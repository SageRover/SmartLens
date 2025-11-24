import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// 获取配置
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("compression_config")
      .select("*")
      .eq("config_key", "default")
      .single();

    if (error) {
      // 如果表不存在或没有配置，返回默认值
      return NextResponse.json({
        small: {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8,
          threshold: 1000,
        },
        medium: {
          maxWidth: 1600,
          maxHeight: 900,
          quality: 0.7,
          threshold: 2000,
        },
        large: {
          maxWidth: 1400,
          maxHeight: 800,
          quality: 0.65,
          threshold: 999999,
        },
      });
    }

    return NextResponse.json(data.config_value);
  } catch (error) {
    console.error("获取配置失败:", error);
    // 返回默认值
    return NextResponse.json({
      small: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        threshold: 1000,
      },
      medium: {
        maxWidth: 1600,
        maxHeight: 900,
        quality: 0.7,
        threshold: 2000,
      },
      large: {
        maxWidth: 1400,
        maxHeight: 800,
        quality: 0.65,
        threshold: 999999,
      },
    });
  }
}

// 更新配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("compression_config")
      .upsert(
        {
          config_key: "default",
          config_value: body,
        },
        {
          onConflict: "config_key",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("保存配置失败:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, config: data.config_value });
  } catch (error) {
    console.error("保存配置异常:", error);
    return NextResponse.json(
      { error: "保存失败" },
      { status: 500 }
    );
  }
}

