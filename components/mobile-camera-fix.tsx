"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { AlertTriangle, Camera, Smartphone } from "lucide-react";

interface MobileCameraFixProps {
  onFixed: () => void;
}

export function MobileCameraFix({ onFixed }: MobileCameraFixProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    checkCameraSupport();
  }, []);

  const checkCameraSupport = async () => {
    setIsChecking(true);
    const issues: string[] = [];

    // 检查浏览器支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      issues.push("浏览器不支持摄像头API");
      setIsChecking(false);
      setIssues(issues);
      return;
    }

    // 检查HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      issues.push("需要HTTPS环境才能访问摄像头");
    }

    // 检查移动端特征
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isMobile) {
      console.log("📱 检测到移动设备");
      
      if (isIOS) {
        issues.push("iOS设备：确保使用Safari浏览器");
      }

      // 尝试获取摄像头设备列表
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length === 0) {
          issues.push("未检测到摄像头设备");
        } else {
          console.log(`📸 检测到 ${videoDevices.length} 个摄像头设备`);
          
          // 检查是否有前置摄像头
          const hasFrontCamera = videoDevices.some(device => 
            device.label.toLowerCase().includes('front') || 
            device.label.toLowerCase().includes('user')
          );
          
          const hasBackCamera = videoDevices.some(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('environment')
          );

          if (!hasFrontCamera) {
            issues.push("未检测到前置摄像头");
          }
          if (!hasBackCamera && videoDevices.length < 2) {
            issues.push("未检测到后置摄像头");
          }
        }
      } catch (error) {
        console.warn("无法获取摄像头设备列表:", error);
        issues.push("无法枚举摄像头设备");
      }
    }

    setIssues(issues);
    setIsChecking(false);
  };

  const requestCameraPermission = async () => {
    try {
      console.log("🔐 请求摄像头权限...");
      
      // 先尝试前置摄像头
      await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
      });
      
      console.log("✅ 摄像头权限获取成功");
      onFixed();
      
    } catch (error) {
      console.error("摄像头权限获取失败:", error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert("请在浏览器设置中允许摄像头访问权限");
        } else if (error.name === 'NotFoundError') {
          alert("未找到摄像头设备，请检查硬件");
        } else if (error.name === 'NotReadableError') {
          alert("摄像头被其他应用占用，请关闭其他使用摄像头的应用");
        }
      }
    }
  };

  const getMobileTips = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      return [
        "使用Safari浏览器（不是Chrome）",
        "确保在设置中允许摄像头访问",
        "关闭其他使用摄像头的应用",
        "重启Safari浏览器"
      ];
    }
    
    if (isAndroid) {
      return [
        "使用Chrome浏览器",
        "检查系统摄像头权限",
        "清除浏览器缓存",
        "关闭省电模式"
      ];
    }
    
    return ["检查浏览器权限设置", "确保HTTPS访问"];
  };

  if (issues.length === 0 && !isChecking) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone className="w-6 h-6 text-orange-500" />
          <h3 className="text-lg font-semibold">移动端摄像头问题</h3>
        </div>

        {isChecking && (
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <Camera className="w-4 h-4 animate-spin" />
            正在检测摄像头...
          </div>
        )}

        {!isChecking && issues.length > 0 && (
          <div className="space-y-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-700">检测到以下问题：</p>
                <ul className="mt-2 space-y-1 text-sm text-red-600">
                  {issues.map((issue, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="font-medium text-blue-700 mb-2">解决方案：</p>
              <ul className="space-y-1 text-sm text-blue-600">
                {getMobileTips().map((tip, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span>{index + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button 
            onClick={requestCameraPermission}
            className="flex-1"
          >
            请求权限
          </Button>
          <Button 
            variant="outline" 
            onClick={checkCameraSupport}
            disabled={isChecking}
          >
            重新检测
          </Button>
        </div>
      </div>
    </div>
  );
}