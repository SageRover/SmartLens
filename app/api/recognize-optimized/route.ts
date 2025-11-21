import { NextRequest, NextResponse } from "next/server";
import { recognizeWithBaidu } from "@/lib/baidu-optimized";
import { imageCache } from "@/lib/image-cache";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 直接接收图片数据，而不是下载URL
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: "缺少图片文件" },
        { status: 400 }
      );
    }

    console.log(`开始处理识别请求: ${imageFile.name}, 大小: ${imageFile.size} bytes`);

    // 限制图片大小
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: `图片过大，请使用小于2MB的图片` },
        { status: 400 }
      );
    }

    // 直接转换文件为ArrayBuffer
    const arrayBuffer = await imageFile.arrayBuffer();

    // 🚀 优化：检查缓存
    const cachedResult = imageCache.get(arrayBuffer);
    if (cachedResult) {
      const totalTime = Date.now() - startTime;
      return NextResponse.json({
        ...cachedResult,
        processingTime: totalTime,
        cached: true,
      });
    }

    console.log(`图片编码完成，大小: ${arrayBuffer.byteLength} bytes`);

    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // 调用百度AI识别
    const baiduResult = await recognizeWithBaidu(base64);
    const topResult = baiduResult.result?.[0];

    const keyword = topResult?.keyword ?? "无法识别";
    const score = topResult?.score
      ? `${(topResult.score * 100).toFixed(1)}%`
      : null;
    const baikeInfo = topResult?.baike_info?.description;

    const resultData = {
      result: score ? `${keyword} (${score})` : keyword,
      keyword,
      score,
      baike: baikeInfo,
      raw: baiduResult,
    };

    // 🚀 缓存结果
    imageCache.set(arrayBuffer, resultData);

    const totalTime = Date.now() - startTime;
    console.log(`优化识别请求完成，总耗时: ${totalTime}ms`);

    return NextResponse.json({
      ...resultData,
      processingTime: totalTime,
      cached: false,
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`优化识别错误 (耗时: ${totalTime}ms):`, error);
    
    let errorMessage = "识别服务暂时不可用";
    if (error instanceof Error) {
      if (error.message.includes("超时")) {
        errorMessage = "识别服务响应超时，请重试";
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