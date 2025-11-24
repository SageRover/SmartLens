"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MobileCameraFix } from "@/components/mobile-camera-fix";
import { Camera, CameraOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CameraTestPage() {
  const [frontStream, setFrontStream] = useState<MediaStream | null>(null);
  const [rearStream, setRearStream] = useState<MediaStream | null>(null);
  const [testResults, setTestResults] = useState<{
    front: boolean;
    rear: boolean;
    error?: string;
  }>({ front: false, rear: false });
  const [isTesting, setIsTesting] = useState(false);
  const [showCameraFix, setShowCameraFix] = useState(false);
  
  const frontVideoRef = useRef<HTMLVideoElement>(null);
  const rearVideoRef = useRef<HTMLVideoElement>(null);

  const testCamera = async (facingMode: "user" | "environment"): Promise<boolean> => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      return false;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 停止流，只是测试
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error(`${facingMode} 摄像头测试失败:`, error);
      return false;
    }
  };

  const runCameraTest = async () => {
    setIsTesting(true);
    setTestResults({ front: false, rear: false });

    try {
      // 测试前置摄像头
      console.log("📱 测试前置摄像头...");
      const frontOk = await testCamera("user");
      setTestResults(prev => ({ ...prev, front: frontOk }));

      // 测试后置摄像头
      console.log("📸 测试后置摄像头...");
      const rearOk = await testCamera("environment");
      setTestResults(prev => ({ ...prev, rear: rearOk }));

    } catch (error) {
      setTestResults({ 
        front: false, 
        rear: false, 
        error: error instanceof Error ? error.message : "未知错误" 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const startDualCamera = async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      return;
    }

    try {
      // 同时获取两个摄像头
      const [frontStream, rearStream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        }),
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        }),
      ]);

      setFrontStream(frontStream);
      setRearStream(rearStream);

      // 设置视频元素
      if (frontVideoRef.current) {
        frontVideoRef.current.srcObject = frontStream;
        await frontVideoRef.current.play();
      }
      if (rearVideoRef.current) {
        rearVideoRef.current.srcObject = rearStream;
        await rearVideoRef.current.play();
      }

    } catch (error) {
      console.error("双摄像头启动失败:", error);
      setTestResults({ 
        front: false, 
        rear: false, 
        error: error instanceof Error ? error.message : "双摄像头启动失败" 
      });
    }
  };

  const stopAllCameras = () => {
    if (frontStream) {
      frontStream.getTracks().forEach(track => track.stop());
      setFrontStream(null);
    }
    if (rearStream) {
      rearStream.getTracks().forEach(track => track.stop());
      setRearStream(null);
    }
  };

  useEffect(() => {
    return () => {
      stopAllCameras();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 头部 */}
      <div className="bg-black/50 backdrop-blur-sm p-4 flex items-center gap-4">
        <Link href="/camera">
          <Button variant="ghost" size="sm" className="text-white">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">摄像头测试</h1>
      </div>

      <div className="p-4 space-y-6 max-w-4xl mx-auto">
        {/* 测试控制 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">摄像头检测</h2>
            
            <div className="flex gap-4 mb-4">
              <Button 
                onClick={runCameraTest}
                disabled={isTesting}
                className="flex-1"
              >
                {isTesting ? "检测中..." : "开始检测"}
              </Button>
              
              <Button 
                onClick={startDualCamera}
                variant="outline"
                className="flex-1"
              >
                启动双摄像头
              </Button>
              
              <Button 
                onClick={stopAllCameras}
                variant="destructive"
                size="sm"
              >
                停止
              </Button>
            </div>

            {/* 测试结果 */}
            {(testResults.front !== false || testResults.rear !== false) && (
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${
                  testResults.front 
                    ? 'bg-green-900/50 border-green-600' 
                    : 'bg-red-900/50 border-red-600'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResults.front ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="font-medium">前置摄像头</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {testResults.front ? "✅ 工作正常" : "❌ 无法访问"}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  testResults.rear 
                    ? 'bg-green-900/50 border-green-600' 
                    : 'bg-red-900/50 border-red-600'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResults.rear ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="font-medium">后置摄像头</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {testResults.rear ? "✅ 工作正常" : "❌ 无法访问"}
                  </p>
                </div>
              </div>
            )}

            {testResults.error && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-600 rounded-lg">
                <p className="text-red-400 font-medium">错误信息：</p>
                <p className="text-sm text-red-300 mt-1">{testResults.error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 视频预览 */}
        {(frontStream || rearStream) && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">实时预览</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {frontStream && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-400">前置摄像头</h3>
                    <video
                      ref={frontVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-48 bg-black rounded-lg object-cover"
                    />
                  </div>
                )}
                
                {rearStream && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-400">后置摄像头</h3>
                    <video
                      ref={rearVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-48 bg-black rounded-lg object-cover"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 设备信息 */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">设备信息</h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">用户代理:</span>
                <span className="font-mono text-xs break-all ml-2">
                  {typeof window !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : '加载中...'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">HTTPS:</span>
                <span className={typeof window !== 'undefined' && window.location?.protocol === 'https:' ? 'text-green-400' : 'text-red-400'}>
                  {typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '✅ 安全' : '❌ 不安全'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">移动设备:</span>
                <span className="text-blue-400">
                  {typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? '是' : '否'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 摄像头修复弹窗 */}
      {showCameraFix && (
        <MobileCameraFix 
          onFixed={() => {
            setShowCameraFix(false);
            runCameraTest();
          }} 
        />
      )}
    </div>
  );
}