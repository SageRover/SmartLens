import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recognitionResult, itemImageUrl, faceImageUrl } = body;

    if (!recognitionResult || !itemImageUrl) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("recognition_records")
      .insert({
        recognition_result: recognitionResult,
        item_image_url: itemImageUrl,
        face_image_url: faceImageUrl ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("保存识别记录失败:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, record: data }, { status: 201 });
  } catch (error) {
    console.error("保存识别记录异常:", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

