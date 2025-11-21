"use client";

import { useState, useRef, useEffect } from "react";
import { useCamera } from "@/hooks/useCamera";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function CameraPage() {
  const {
    rearStream,
    isRearReady,
    error,
    captureRearPhoto,
    captureFrontPhoto,
    stopCameras,
  } = useCamera();
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<string | null>(
    null
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (rearStream && videoRef.current) {
      videoRef.current.srcObject = rearStream;
    }
  }, [rearStream]);

  const handleCapture = async () => {
    if (!isRearReady || isProcessing) return;

    setIsProcessing(true);
    setRecognitionResult(null);

    try {
      // 同时拍摄前后摄像头照片
      const [rearPhoto, frontPhoto] = await Promise.all([
        captureRearPhoto(videoRef.current),
        captureFrontPhoto(),
      ]);

      if (!rearPhoto) {
        throw new Error("无法拍摄后置摄像头照片");
      }

      // 上传图片到 Supabase Storage
      const rearFileName = `items/${Date.now()}_rear.jpg`;
      const frontFileName = `faces/${Date.now()}_front.jpg`;

      // 将 Blob 转换为 File
      const rearFile = new File([rearPhoto], `rear_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      // 上传图片到服务端 API
      const rearFormData = new FormData();
      rearFormData.append('file', rearFile);
      rearFormData.append('path', `items/${Date.now()}_rear.jpg`);

      const rearUploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: rearFormData,
      });

      if (!rearUploadResponse.ok) {
        const responseText = await rearUploadResponse.text();
        console.error("上传失败响应:", responseText);
        let errorMessage = "图片上传失败";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // 如果不是 JSON，使用原始响应文本
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const responseText = await rearUploadResponse.text();
      let rearImageUrl: string;
      try {
        const data = JSON.parse(responseText);
        rearImageUrl = data.url;
      } catch (error) {
        console.error("解析响应失败:", responseText);
        throw new Error("服务器响应格式错误");
      }

      let frontImageUrl: string | null = null;
      if (frontPhoto) {
        // 将 Blob 转换为 File
        const frontFile = new File([frontPhoto], `front_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });

        const frontFormData = new FormData();
        frontFormData.append('file', frontFile);
        frontFormData.append('path', `faces/${Date.now()}_front.jpg`);

        const frontUploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: frontFormData,
        });

        if (frontUploadResponse.ok) {
          const { url } = await frontUploadResponse.json();
          frontImageUrl = url;
        } else {
          console.error("前置摄像头照片上传失败");
        }
      }

      // 调用AI识别接口
      const recognitionResponse = await fetch("/api/recognize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: rearImageUrl,
        }),
      });

      if (!recognitionResponse.ok) {
        throw new Error("识别请求失败");
      }

      const recognitionData = await recognitionResponse.json();
      const result = recognitionData.result || "无法识别";

      setRecognitionResult(result);

      const saveResponse = await fetch("/api/save-recognition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recognitionResult: result,
          itemImageUrl: rearImageUrl,
          faceImageUrl: frontImageUrl,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || "保存识别记录失败");
      }
    } catch (err) {
      console.error("处理错误:", err);
      setRecognitionResult(
        err instanceof Error ? err.message : "处理失败，请重试"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm z-10">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="text-white text-lg font-semibold">物品识别</h1>
        <div className="w-10" /> {/* 占位符保持居中 */}
      </div>

      {/* 摄像头预览区域 */}
      <div className="flex-1 relative overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full text-white p-4">
            <div className="text-center">
              <p className="text-lg mb-2">摄像头访问失败</p>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }} // 镜像翻转，更符合用户习惯
          />
        )}

        {/* 识别结果覆盖层 */}
        {recognitionResult && (
          <div className="absolute top-4 left-4 right-4 z-20">
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-1">识别结果</p>
                <p className="text-lg font-semibold text-gray-900">
                  {recognitionResult}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 底部控制区域 */}
      <div className="bg-black/50 backdrop-blur-sm p-6 pb-8">
        <div className="flex flex-col items-center gap-4">
          <Button
            onClick={handleCapture}
            disabled={!isRearReady || isProcessing}
            size="lg"
            className="w-20 h-20 rounded-full bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isProcessing ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <Camera className="w-8 h-8" />
            )}
          </Button>
          <p className="text-white text-sm text-center">
            {isProcessing
              ? "正在识别..."
              : isRearReady
              ? "点击拍照识别"
              : "正在初始化摄像头..."}
          </p>
        </div>
      </div>
    </div>
  );
}

