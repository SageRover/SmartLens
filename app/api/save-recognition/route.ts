import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// 🚀 优化：添加重试机制
async function saveWithRetry(
  recognitionResult: string,
  itemImageUrl: string,
  faceImageUrl: string | null,
  retries = 2
): Promise<{ data: any; error: any }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { data, error } = await supabaseAdmin
      .from("recognition_records")
      .insert({
        recognition_result: recognitionResult,
        item_image_url: itemImageUrl,
        face_image_url: faceImageUrl ?? null,
      })
      .select()
      .single();

    if (!error) {
      return { data, error: null };
    }

    // 如果是最后一次尝试或错误不可重试，直接返回
    if (attempt === retries || (error.code && !error.code.startsWith('5'))) {
      return { data: null, error };
    }

    // 等待后重试（递增延迟）
    if (attempt < retries) {
      console.warn(`保存记录失败，重试 (${attempt + 1}/${retries}):`, error.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  return { data: null, error: new Error("保存失败：所有重试均失败") };
}

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { recognitionResult, itemImageUrl, faceImageUrl } = body;

    if (!recognitionResult || !itemImageUrl) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 🚀 优化：使用重试机制保存
    const { data, error } = await saveWithRetry(
      recognitionResult,
      itemImageUrl,
      faceImageUrl ?? null
    );

    if (error) {
      const totalTime = Date.now() - startTime;
      console.error(`保存识别记录失败 (耗时: ${totalTime}ms):`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const totalTime = Date.now() - startTime;
    console.log(`保存识别记录成功，耗时: ${totalTime}ms`);

    return NextResponse.json({ success: true, record: data }, { status: 201 });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`保存识别记录异常 (耗时: ${totalTime}ms):`, error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

