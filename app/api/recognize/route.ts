import { NextRequest, NextResponse } from "next/server";
import { recognizeWithBaidu } from "@/lib/baidu";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "缺少图片URL" },
        { status: 400 }
      );
    }

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("无法下载待识别图片");
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const baiduResult = await recognizeWithBaidu(base64);
    const topResult = baiduResult.result?.[0];

    const keyword = topResult?.keyword ?? "无法识别";
    const score = topResult?.score
      ? `${(topResult.score * 100).toFixed(1)}%`
      : null;
    const baikeInfo = topResult?.baike_info?.description;

    return NextResponse.json({
      result: score ? `${keyword} (${score})` : keyword,
      keyword,
      score,
      baike: baikeInfo,
      raw: baiduResult,
    });
  } catch (error) {
    console.error("识别错误:", error);
    return NextResponse.json(
      { error: "识别服务暂时不可用" },
      { status: 500 }
    );
  }
}

