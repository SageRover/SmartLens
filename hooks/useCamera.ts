"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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

  const frontVideoRef = useRef<HTMLVideoElement | null>(null);

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
      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
      });
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
        // 初始化后置摄像头
        const rearConstraints: MediaStreamConstraints = {
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const rearMediaStream = await navigator.mediaDevices.getUserMedia(
          rearConstraints
        );
        setRearStream(rearMediaStream);
        setIsRearReady(true);

        // 初始化前置摄像头（完全隐藏）
        const frontConstraints: MediaStreamConstraints = {
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const frontMediaStream = await navigator.mediaDevices.getUserMedia(
          frontConstraints
        );
        setFrontStream(frontMediaStream);

        // 创建隐藏的前置摄像头视频元素
        frontVideo = document.createElement("video");
        frontVideo.autoplay = true;
        frontVideo.playsInline = true;
        frontVideo.style.position = "fixed";
        frontVideo.style.top = "-9999px";
        frontVideo.style.left = "-9999px";
        frontVideo.style.width = "1px";
        frontVideo.style.height = "1px";
        frontVideo.style.opacity = "0";
        frontVideo.style.pointerEvents = "none";
        frontVideo.srcObject = frontMediaStream;
        document.body.appendChild(frontVideo);

        frontVideo.onloadedmetadata = () => {
          frontVideo?.play();
          setIsFrontReady(true);
        };

        frontVideoRef.current = frontVideo;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "无法访问摄像头";
        setError(errorMessage);
        console.error("摄像头初始化错误:", err);
      }
    };

    initCameras();

    return () => {
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

