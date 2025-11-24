import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// 🚀 优化：添加重试机制
async function uploadWithRetry(
  path: string,
  buffer: Buffer,
  contentType: string,
  retries = 2
): Promise<{ data: any; error: any }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const { data, error } = await supabaseAdmin.storage
      .from("images")
      .upload(path, buffer, {
        contentType,
        upsert: false,
      });

    if (!error) {
      return { data, error: null };
    }

    // 如果是最后一次尝试或错误不可重试，直接返回
    const statusCode = (error as any).statusCode;
    if (attempt === retries || (statusCode && statusCode < 500)) {
      return { data: null, error };
    }

    // 等待后重试（递增延迟）
    console.warn(`上传失败，重试 (${attempt + 1}/${retries}):`, error.message);
    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
  }

  return { data: null, error: new Error("上传失败：所有重试均失败") };
}

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    console.log("上传请求:", { fileName: file?.name, path, fileType: file?.type, size: file?.size });

    if (!file || !path) {
      console.error("缺少参数:", { file: !!file, path });
      return NextResponse.json(
        { error: "缺少文件或路径参数" },
        { status: 400 }
      );
    }

    // 将 File 转换为 Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log("文件大小:", buffer.length, "bytes");

    // 🚀 优化：使用重试机制上传
    const { data, error } = await uploadWithRetry(path, buffer, file.type);

    if (error) {
      console.error("Supabase 上传失败:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const uploadTime = Date.now() - startTime;
    console.log(`上传成功，耗时: ${uploadTime}ms`, data);

    // 获取公开 URL
    const { data: urlData } = supabaseAdmin.storage
      .from("images")
      .getPublicUrl(path);

    return NextResponse.json({ 
      success: true, 
      data,
      url: urlData.publicUrl,
      uploadTime 
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`上传异常 (耗时: ${totalTime}ms):`, error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "上传失败" 
    }, { status: 500 });
  }
}