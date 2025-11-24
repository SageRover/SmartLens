const BAIDU_AK = process.env.BAIDU_AIP_AK;
const BAIDU_SK = process.env.BAIDU_AIP_SK;

if (!BAIDU_AK || !BAIDU_SK) {
  console.warn(
    "Missing BAIDU_AIP_AK or BAIDU_AIP_SK environment variables. Baidu recognition will fail."
  );
}

// 优化的Token缓存
let cachedToken: { value: string; expiresAt: number } | null = null;

// 🚀 优化：防止并发请求Token的锁
let tokenFetchPromise: Promise<string> | null = null;

// 🚀 优化：预加载Token标志
let isPreloading = false;
let preloadPromise: Promise<void> | null = null;

// 🚀 优化：主动预加载Token（在服务器端API路由初始化时调用）
export function preloadBaiduToken() {
  // 如果已经有缓存的Token且未过期，不需要预加载
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return Promise.resolve();
  }

  // 如果正在预加载，返回现有的Promise
  if (preloadPromise) {
    return preloadPromise;
  }

  // 如果正在获取Token，等待完成
  if (tokenFetchPromise) {
    return tokenFetchPromise.then(() => {});
  }

  // 开始预加载
  isPreloading = true;
  preloadPromise = getBaiduAccessToken()
    .then(() => {
      console.log("✅ Token预加载成功");
      isPreloading = false;
      preloadPromise = null;
    })
    .catch((error) => {
      console.warn("⚠️ Token预加载失败:", error);
      isPreloading = false;
      preloadPromise = null;
    });

  return preloadPromise;
}

// 在模块加载时预加载Token（仅服务器端）
if (typeof window === 'undefined') {
  // 服务器端：延迟预加载，避免阻塞启动
  setTimeout(() => {
    preloadBaiduToken().catch(console.warn);
  }, 1000);
}

export async function getBaiduAccessToken() {
  if (!BAIDU_AK || !BAIDU_SK) {
    throw new Error("未配置百度AI密钥");
  }

  // 使用更宽松的缓存时间，避免频繁刷新
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  // 🚀 优化：如果正在获取Token，等待正在进行的请求
  if (tokenFetchPromise) {
    console.log("Token正在获取中，等待现有请求...");
    return tokenFetchPromise;
  }

  // 并发获取Token，避免重复请求
  if (cachedToken && cachedToken.expiresAt > Date.now() - 30000) { // 30秒内不重复获取
    return cachedToken.value;
  }

  console.log("获取新的百度Access Token...");
  const startTime = Date.now();
  
  // 🚀 优化：创建Token获取Promise，防止并发请求
  tokenFetchPromise = (async () => {
    try {
      const params = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: BAIDU_AK,
        client_secret: BAIDU_SK,
      });

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
    } finally {
      // 清除锁，允许下次请求
      tokenFetchPromise = null;
    }
  })();

  return tokenFetchPromise;
}

// 优化的百度识别函数（带重试机制）
export async function recognizeWithBaidu(imageBase64: string, retries = 2) {
  const startTime = Date.now();
  
  // 并行获取Token
  const [accessToken] = await Promise.all([
    getBaiduAccessToken()
  ]);

  for (let attempt = 0; attempt <= retries; attempt++) {
    // 设置合理的超时时间（重试时稍微增加超时时间）
    const timeout = 10000 + (attempt * 2000); // 10s, 12s, 14s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const params = new URLSearchParams({
        image: imageBase64,
        baike_num: "1",
      });

      if (attempt > 0) {
        console.log(`百度图像识别重试 (${attempt}/${retries})...`);
      } else {
        console.log("开始百度图像识别...");
      }

      const networkStartTime = Date.now();
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
      const networkTime = Date.now() - networkStartTime;
      console.log(`🌐 百度API网络请求完成，耗时: ${networkTime}ms`);

      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        // 如果是服务器错误且还有重试机会，则重试
        if (res.status >= 500 && attempt < retries) {
          console.warn(`百度识别失败 (${res.status})，将重试...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // 递增延迟
          continue;
        }
        throw new Error(`百度识别失败: ${text}`);
      }

      const parseStartTime = Date.now();
      const result = await res.json();
      const parseTime = Date.now() - parseStartTime;
      const duration = Date.now() - startTime;
      console.log(`📊 百度API响应解析完成，耗时: ${parseTime}ms`);
      console.log(`✅ 百度识别完成，总耗时: ${duration}ms${attempt > 0 ? ` (重试${attempt}次)` : ''} [网络: ${networkTime}ms, 解析: ${parseTime}ms]`);

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < retries) {
          console.warn(`百度识别超时，将重试 (${attempt + 1}/${retries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error("百度识别超时，请重试");
      }
      
      // 最后一次尝试失败，抛出错误
      if (attempt === retries) {
        throw error;
      }
      
      // 其他错误也重试
      console.warn(`百度识别错误，将重试 (${attempt + 1}/${retries}):`, error);
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  throw new Error("百度识别失败：所有重试均失败");
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
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error("图片下载超时");
    }
    throw error;
  }
}