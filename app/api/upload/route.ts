import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    console.log("上传请求:", { fileName: file?.name, path, fileType: file?.type });

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

    const { data, error } = await supabaseAdmin.storage
      .from("images")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Supabase 上传失败:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("上传成功:", data);

    // 获取公开 URL
    const { data: urlData } = supabaseAdmin.storage
      .from("images")
      .getPublicUrl(path);

    return NextResponse.json({ 
      success: true, 
      data,
      url: urlData.publicUrl 
    });

  } catch (error) {
    console.error("上传异常:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "上传失败" 
    }, { status: 500 });
  }
}