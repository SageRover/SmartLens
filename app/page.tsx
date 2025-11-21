import Link from "next/link";
import { Camera, Settings } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">物品识别</h1>
          <p className="text-gray-600">使用AI识别您拍摄的物品</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/camera"
            className="flex items-center justify-center gap-3 w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            <Camera className="w-6 h-6" />
            开始识别
          </Link>

          <Link
            href="/admin"
            className="flex items-center justify-center gap-3 w-full bg-gray-200 text-gray-800 py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-300 transition-colors"
          >
            <Settings className="w-6 h-6" />
            后台管理
          </Link>
        </div>
      </div>
    </div>
  );
}

