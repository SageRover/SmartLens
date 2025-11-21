const BAIDU_AK = process.env.BAIDU_AIP_AK;
const BAIDU_SK = process.env.BAIDU_AIP_SK;

if (!BAIDU_AK || !BAIDU_SK) {
  console.warn(
    "Missing BAIDU_AIP_AK or BAIDU_AIP_SK environment variables. Baidu recognition will fail."
  );
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getBaiduAccessToken() {
  if (!BAIDU_AK || !BAIDU_SK) {
    throw new Error("未配置百度AI密钥");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: BAIDU_AK,
    client_secret: BAIDU_SK,
  });

  const res = await fetch(
    `https://aip.baidubce.com/oauth/2.0/token?${params.toString()}`,
    {
      method: "POST",
    }
  );

  if (!res.ok) {
    throw new Error("获取百度Access Token失败");
  }

  const data = await res.json();
  const expiresIn = data.expires_in ?? 3600;

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
  };

  return data.access_token as string;
}

export async function recognizeWithBaidu(imageBase64: string) {
  const accessToken = await getBaiduAccessToken();

  const params = new URLSearchParams({
    image: imageBase64,
    baike_num: "1",
  });

  const res = await fetch(
    `https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=${accessToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`百度识别失败: ${text}`);
  }

  return res.json();
}

