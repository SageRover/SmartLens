const BAIDU_AK = process.env.BAIDU_AIP_AK;
const BAIDU_SK = process.env.BAIDU_AIP_SK;

if (!BAIDU_AK || !BAIDU_SK) {
  console.warn(
    "Missing BAIDU_AIP_AK or BAIDU_AIP_SK environment variables. Baidu recognition will fail."
  );
}

// 优化的Token缓存
let cachedToken: { value: string; expiresAt: number } | null = null;

// 预加载Token（应用启动时）
getBaiduAccessToken().catch(console.warn);

export async function getBaiduAccessToken() {
  if (!BAIDU_AK || !BAIDU_SK) {
    throw new Error("未配置百度AI密钥");
  }

  // 使用更宽松的缓存时间，避免频繁刷新
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  // 并发获取Token，避免重复请求
  if (cachedToken && cachedToken.expiresAt > Date.now() - 30000) { // 30秒内不重复获取
    return cachedToken.value;
  }

  console.log("获取新的百度Access Token...");
  const startTime = Date.now();
  
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: BAIDU_AK,
    client_secret: BAIDU_SK,
  });

  try {
    const res = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?${params.toString()}`,
      {
        method: "POST",
        // 添加超时控制
        signal: AbortSignal.timeout(5000), // 5秒超时
      }
    );

    if (!res.ok) {
      throw new Error(`获取Token失败: ${res.status}`);
    }

    const data = await res.json();
    const expiresIn = data.expires_in ?? 3600;

    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + (expiresIn - 300) * 1000, // 提前5分钟刷新
    };

    console.log(`Token获取成功，耗时: ${Date.now() - startTime}ms`);
    return data.access_token as string;
  } catch (error) {
    console.error("Token获取失败:", error);
    throw error;
  }
}

// 优化的百度识别函数
export async function recognizeWithBaidu(imageBase64: string) {
  const startTime = Date.now();
  
  // 并行获取Token
  const [accessToken] = await Promise.all([
    getBaiduAccessToken()
  ]);

  // 设置合理的超时时间
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

  try {
    const params = new URLSearchParams({
      image: imageBase64,
      baike_num: "1",
    });

    console.log("开始百度图像识别...");
    const res = await fetch(
      `https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=${accessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          // 启用Keep-Alive连接
          "Connection": "keep-alive",
        },
        body: params.toString(),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`百度识别失败: ${text}`);
    }

    const result = await res.json();
    const duration = Date.now() - startTime;
    console.log(`百度识别完成，耗时: ${duration}ms`);

    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error("百度识别超时，请重试");
    }
    throw error;
  }
}

// 图片下载优化
export async function downloadImageOptimized(imageUrl: string): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

  try {
    console.log("开始下载图片:", imageUrl);
    const startTime = Date.now();

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      // 启用缓存
      cache: 'force-cache',
      // 设置合适的头部
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageRecognizer/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`图片下载失败: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const duration = Date.now() - startTime;
    console.log(`图片下载完成，大小: ${arrayBuffer.byteLength} bytes，耗时: ${duration}ms`);

    return arrayBuffer;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error("图片下载超时");
    }
    throw error;
  }
}