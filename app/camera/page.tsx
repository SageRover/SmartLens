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
      const video = videoRef.current;
      video.srcObject = rearStream;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((err) => {
          console.warn("视频播放被阻止，等待用户交互后重试:", err);
        });
      }
    }
  }, [rearStream]);

  const handleCapture = async () => {
    if (!isRearReady || isProcessing) return;

    setIsProcessing(true);
    setRecognitionResult(null);

    try {
      const timestamp = Date.now();

      // 1. 同时拍摄前后摄像头照片
      const [rearPhoto, frontPhoto] = await Promise.all([
        captureRearPhoto(videoRef.current),
        captureFrontPhoto(),
      ]);

      if (!rearPhoto) {
        throw new Error("无法拍摄后置摄像头照片");
      }

      // 2. 预处理：准备文件对象（用于AI识别）
      const rearFile = new File([rearPhoto], `item_${timestamp}.jpg`, {
        type: 'image/jpeg'
      });

      // 3. 并行准备FormData
      const [rearFormData, frontFormData] = await Promise.all([
        Promise.resolve().then(() => {
          const formData = new FormData();
          formData.append('file', rearFile);
          formData.append('path', `items/${timestamp}_item.jpg`);
          return formData;
        }),
        Promise.resolve().then(() => {
          if (!frontPhoto) return null;
          const frontFile = new File([frontPhoto], `face_${timestamp}.jpg`, {
            type: 'image/jpeg'
          });
          const formData = new FormData();
          formData.append('file', frontFile);
          formData.append('path', `faces/${timestamp}_face.jpg`);
          return formData;
        })
      ]);

      // 4. 立即开始AI识别（直接传递图片文件，避免上传下载循环）
      const recognitionFormData = new FormData();
      recognitionFormData.append('image', rearFile); // 直接使用原始文件

      const recognitionPromise = fetch("/api/recognize-optimized", {
        method: "POST",
        body: recognitionFormData,
      });

      // 5. 并行上传两张照片（与AI识别并行）
      const uploadPromises = [
        fetch('/api/upload', {
          method: 'POST',
          body: rearFormData,
        }),
      ];

      if (frontFormData) {
        uploadPromises.push(
          fetch('/api/upload', {
            method: 'POST',
            body: frontFormData,
          })
        );
      }

      const uploadResponses = await Promise.allSettled(uploadPromises);

      // 处理上传结果
      const rearUploadResult = uploadResponses[0];
      if (rearUploadResult.status !== 'fulfilled' || !rearUploadResult.value.ok) {
        throw new Error("物品照片上传失败");
      }

      const rearResponseText = await rearUploadResult.value.text();
      let itemImageUrl: string;
      try {
        const data = JSON.parse(rearResponseText);
        itemImageUrl = data.url;
      } catch (error) {
        throw new Error("服务器响应格式错误");
      }

      // 处理前置照片上传（不阻塞主流程）
      let faceImageUrl: string | null = null;
      if (uploadResponses[1]) {
        const frontUploadResult = uploadResponses[1];
        if (frontUploadResult.status === 'fulfilled' && frontUploadResult.value.ok) {
          try {
            const { url } = await frontUploadResult.value.json();
            faceImageUrl = url;
          } catch (error) {
            console.warn("前置照片解析失败:", error);
          }
        } else {
          console.warn("前置照片上传失败");
        }
      }

      const recognitionResponse = await recognitionPromise;
      if (!recognitionResponse.ok) {
        throw new Error("识别请求失败");
      }

      const recognitionData = await recognitionResponse.json();
      const result = recognitionData.result || "无法识别";

      // 立即显示结果给用户
      setRecognitionResult(result);

      // 5. 后台保存识别记录（不阻塞用户）
      // 使用 setTimeout 异步执行，让用户界面先响应
      setTimeout(async () => {
        try {
          await fetch("/api/save-recognition", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              recognitionResult: result,
              itemImageUrl: itemImageUrl,
              faceImageUrl: faceImageUrl,
            }),
          });
        } catch (error) {
          console.error("保存识别记录失败:", error);
        }
      }, 100); // 100ms 后执行

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
    <div
      className="bg-black flex flex-col overflow-hidden"
      style={{ minHeight: "100vh", height: "100dvh" }}
    >
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
            muted
            onLoadedMetadata={() => {
              const video = videoRef.current;
              if (video) {
                video.play().catch((err) => {
                  console.warn("元数据加载后视频播放失败:", err);
                });
              }
            }}
            className="w-full h-full object-cover"
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

