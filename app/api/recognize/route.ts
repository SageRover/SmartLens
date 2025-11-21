import { NextRequest, NextResponse } from "next/server";
import { recognizeWithBaidu, downloadImageOptimized } from "@/lib/baidu-optimized";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "缺少图片URL" },
        { status: 400 }
      );
    }

    console.log(`开始处理识别请求: ${imageUrl}`);

    // 优化：使用并发处理
    const [arrayBuffer] = await Promise.all([
      downloadImageOptimized(imageUrl)
    ]);

    // 转换为Base64 - 优化大小
    const maxSize = 2 * 1024 * 1024; // 2MB限制
    let processedBuffer = arrayBuffer;
    
    if (arrayBuffer.byteLength > maxSize) {
      console.log(`图片过大 (${arrayBuffer.byteLength} bytes)，尝试压缩...`);
      // 这里可以添加图片压缩逻辑
      // 暂时抛出错误提示
      return NextResponse.json(
        { error: `图片过大，请使用小于2MB的图片` },
        { status: 400 }
      );
    }

    const base64 = Buffer.from(processedBuffer).toString("base64");

    // 调用百度AI识别
    const baiduResult = await recognizeWithBaidu(base64);
    const topResult = baiduResult.result?.[0];

    const keyword = topResult?.keyword ?? "无法识别";
    const score = topResult?.score
      ? `${(topResult.score * 100).toFixed(1)}%`
      : null;
    const baikeInfo = topResult?.baike_info?.description;

    const totalTime = Date.now() - startTime;
    console.log(`识别请求完成，总耗时: ${totalTime}ms`);

    return NextResponse.json({
      result: score ? `${keyword} (${score})` : keyword,
      keyword,
      score,
      baike: baikeInfo,
      raw: baiduResult,
      processingTime: totalTime,
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`识别错误 (耗时: ${totalTime}ms):`, error);
    
    let errorMessage = "识别服务暂时不可用";
    if (error instanceof Error) {
      if (error.message.includes("超时")) {
        errorMessage = "识别服务响应超时，请重试";
      } else if (error.message.includes("下载")) {
        errorMessage = "图片下载失败，请检查图片URL";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        processingTime: totalTime 
      },
      { status: 500 }
    );
  }
}

