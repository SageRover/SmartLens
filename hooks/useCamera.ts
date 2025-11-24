"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { compressImageInWorker } from "@/lib/image-compress-worker";
import { getCompressionConfig, type CompressionConfig, type CompressionPreset } from "@/lib/compression-config";

interface UseCameraReturn {
  rearStream: MediaStream | null;
  frontStream: MediaStream | null;
  isRearReady: boolean;
  isFrontReady: boolean;
  error: string | null;
  captureRearPhoto: (videoElement: HTMLVideoElement | null) => Promise<Blob | null>;
  captureFrontPhoto: () => Promise<Blob | null>;
  stopCameras: () => void;
}

export function useCamera(): UseCameraReturn {
  const [rearStream, setRearStream] = useState<MediaStream | null>(null);
  const [frontStream, setFrontStream] = useState<MediaStream | null>(null);
  const [isRearReady, setIsRearReady] = useState(false);
  const [isFrontReady, setIsFrontReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressionConfig, setCompressionConfig] = useState<CompressionConfig | null>(null);

  const frontVideoRef = useRef<HTMLVideoElement | null>(null);

  // 加载压缩配置
  useEffect(() => {
    getCompressionConfig().then(setCompressionConfig).catch(console.error);
  }, []);

  const capturePhoto = useCallback(
    async (videoElement: HTMLVideoElement | null): Promise<Blob | null> => {
      if (!videoElement || videoElement.readyState !== 4) {
        return null;
      }

      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return null;
      }

      ctx.drawImage(videoElement, 0, 0);
      
      // 🚀 优化：使用Web Worker在后台线程压缩图片，不阻塞主线程
      try {
        // 获取ImageData
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 🚀 优化：智能压缩策略 - 根据配置和图片复杂度动态调整压缩参数
        // 估算原始图片大小（ImageData大小）
        const estimatedSize = imageData.width * imageData.height * 4; // RGBA = 4 bytes per pixel
        const estimatedSizeKB = estimatedSize / 1024;
        
        // 使用配置或默认值
        const config = compressionConfig || await getCompressionConfig();
        
        // 根据图片大小选择压缩预设
        let preset: CompressionPreset;
        if (estimatedSizeKB > config.large.threshold) {
          preset = config.large;
          console.log(`📊 检测到大图片 (${estimatedSizeKB.toFixed(0)}KB)，使用大图压缩预设`);
        } else if (estimatedSizeKB > config.medium.threshold) {
          preset = config.medium;
          console.log(`📊 检测到中等图片 (${estimatedSizeKB.toFixed(0)}KB)，使用中等压缩预设`);
        } else {
          preset = config.small;
          console.log(`📊 检测到小图片 (${estimatedSizeKB.toFixed(0)}KB)，使用小图压缩预设`);
        }
        
        const compressStartTime = performance.now();
        const compressedBlob = await compressImageInWorker(imageData, {
          maxWidth: preset.maxWidth,
          maxHeight: preset.maxHeight,
          quality: preset.quality
        });
        
        const compressTime = performance.now() - compressStartTime;
        const finalSizeKB = compressedBlob.size / 1024;
        console.log(`🗜️ 图片压缩完成，耗时: ${compressTime.toFixed(0)}ms，大小: ${finalSizeKB.toFixed(1)}KB`);
        
        // 如果压缩后仍然很大（>100KB），给出警告
        if (finalSizeKB > 100) {
          console.warn(`⚠️ 图片仍然较大 (${finalSizeKB.toFixed(1)}KB)，建议检查压缩参数`);
        }
        
        return compressedBlob;
      } catch (error) {
        // 如果Worker失败，降级到主线程压缩
        console.warn("Web Worker压缩失败，使用主线程压缩:", error);
        
        // 🚀 降级方案：主线程压缩（使用相同的优化参数）
        const maxWidth = 1920;
        const maxHeight = 1080;
        const quality = 0.8;   // 从0.85降低到0.75
        let { width, height } = canvas;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
          
          const resizedCanvas = document.createElement("canvas");
          resizedCanvas.width = width;
          resizedCanvas.height = height;
          const resizedCtx = resizedCanvas.getContext("2d");
          if (resizedCtx) {
            resizedCtx.drawImage(canvas, 0, 0, width, height);
            return new Promise<Blob | null>((resolve) => {
              resizedCanvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
            });
          }
        }
        
        return new Promise<Blob | null>((resolve) => {
          canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
        });
      }
    },
    []
  );

  const captureRearPhoto = useCallback(
    async (videoElement: HTMLVideoElement | null) => {
      return capturePhoto(videoElement);
    },
    [capturePhoto]
  );

  const captureFrontPhoto = useCallback(async () => {
    return capturePhoto(frontVideoRef.current);
  }, [capturePhoto]);

  const stopCameras = useCallback(() => {
    if (rearStream) {
      rearStream.getTracks().forEach((track) => track.stop());
    }
    if (frontStream) {
      frontStream.getTracks().forEach((track) => track.stop());
    }
  }, [rearStream, frontStream]);

  useEffect(() => {
    let frontVideo: HTMLVideoElement | null = null;

    const initCameras = async () => {
      try {
        console.log("🎥 开始初始化摄像头...");

        // 🔧 修复移动端前置摄像头问题：先获取前置摄像头权限
        const frontConstraints: MediaStreamConstraints = {
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        console.log("📱 获取前置摄像头权限...");
        const frontMediaStream = await navigator.mediaDevices.getUserMedia(
          frontConstraints
        );
        setFrontStream(frontMediaStream);
        console.log("✅ 前置摄像头获取成功");

        // 🔧 创建前置摄像头视频元素（需要能实际渲染）
        frontVideo = document.createElement("video");
        frontVideo.autoplay = true;
        frontVideo.muted = true; // 🔧 移动端必须静音
        frontVideo.playsInline = true; // 🔧 iOS必需
        frontVideo.style.position = "fixed";
        frontVideo.style.top = "-2000px";
        frontVideo.style.left = "-2000px";
        frontVideo.style.width = "640px";
        frontVideo.style.height = "480px";
        frontVideo.style.objectFit = "cover";
        frontVideo.style.backgroundColor = "#000";
        frontVideo.srcObject = frontMediaStream;
        document.body.appendChild(frontVideo);

        frontVideo.onloadedmetadata = async () => {
          try {
            await frontVideo?.play();
            setIsFrontReady(true);
            console.log("✅ 前置摄像头播放成功");
          } catch (playError) {
            console.warn("前置摄像头播放失败:", playError);
            // 🔧 iOS/移动端常见问题：需要用户交互才能播放
            document.addEventListener(
              "click",
              async () => {
                try {
                  await frontVideo?.play();
                  setIsFrontReady(true);
                } catch (e) {
                  console.warn("用户交互后前置摄像头仍然失败:", e);
                }
              },
              { once: true }
            );
          }
        };

        frontVideoRef.current = frontVideo;

        // 初始化后置摄像头
        const rearConstraints: MediaStreamConstraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        console.log("📸 获取后置摄像头...");
        const rearMediaStream = await navigator.mediaDevices.getUserMedia(
          rearConstraints
        );
        setRearStream(rearMediaStream);
        setIsRearReady(true);
        console.log("✅ 后置摄像头获取成功");

      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "无法访问摄像头";
        setError(errorMessage);
        console.error("摄像头初始化错误:", err);
        
        // 🔧 提供移动端故障排除建议
        if (err instanceof Error) {
          if (err.message.includes("Permission denied")) {
            console.warn("🔒 摄像头权限被拒绝，请检查浏览器权限设置");
          } else if (err.message.includes("NotFound")) {
            console.warn("📱 未找到摄像头，请检查设备硬件");
          } else if (err.message.includes("NotAllowed")) {
            console.warn("🚫 摄像头访问被阻止，请在设置中允许");
          }
        }
      }
    };

    // 🔧 延迟初始化，避免页面加载时的权限冲突
    const timer = setTimeout(initCameras, 100);

    return () => {
      clearTimeout(timer);
      
      // 卸载时停止摄像头并移除隐藏的视频元素
      if (rearStream) {
        rearStream.getTracks().forEach((track) => track.stop());
      }
      if (frontStream) {
        frontStream.getTracks().forEach((track) => track.stop());
      }
      if (frontVideo && document.body.contains(frontVideo)) {
        document.body.removeChild(frontVideo);
      }
    };
    // 只在首次挂载时初始化，避免反复创建流导致闪屏
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    rearStream,
    frontStream,
    isRearReady,
    isFrontReady,
    error,
    captureRearPhoto,
    captureFrontPhoto,
    stopCameras,
  };
}

