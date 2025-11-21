# 物品识别应用

一个基于 Next.js 15 的移动端物品识别网站，支持拍照识别物品并自动保存前后摄像头照片。

## 技术栈

- **Next.js 15** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Shadcn/ui** - UI 组件库
- **Supabase** - 后端服务和数据库
- **React Hooks** - 状态管理

## 功能特性

### 1. 拍照识别页面
- 移动端优先设计
- 后置摄像头实时预览
- 点击拍照后调用 AI 接口识别物品
- 自动调用前置摄像头拍摄人脸（后台进行，用户无感知）
- 自动保存识别结果和照片到数据库

### 2. 后台管理页面
- 查看所有识别记录的时间线
- 展示识别结果、物品照片、人脸照片
- 支持按时间筛选
- 支持关键词搜索

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建项目
2. 创建数据库表：

```sql
-- 创建识别记录表
CREATE TABLE recognition_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recognition_result TEXT NOT NULL,
  item_image_url TEXT NOT NULL,
  face_image_url TEXT
);

-- 创建存储桶（在 Supabase Dashboard 中操作）
-- Storage > Create bucket > 名称: images, 公开: true
```

3. 复制 `.env.local.example` 为 `.env.local` 并填入你的 Supabase 与百度AI配置：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key # 仅服务端使用
BAIDU_AIP_AK=your_baidu_app_key
BAIDU_AIP_SK=your_baidu_secret_key
```

### 3. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
.
├── app/
│   ├── api/
│   │   ├── recognize/      # 调用百度图像识别
│   │   └── save-recognition/ # 服务端保存识别记录
│   ├── admin/              # 后台管理页面
│   ├── camera/             # 拍照识别页面
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页
│   └── globals.css         # 全局样式
├── components/
│   └── ui/                 # Shadcn/ui 组件
├── hooks/
│   └── useCamera.ts        # 摄像头管理Hook
├── lib/
│   ├── supabase.ts         # 前端 Supabase 客户端（anon key）
│   ├── supabase-server.ts  # 服务端 Supabase 客户端（service role）
│   ├── baidu.ts            # 百度AI鉴权与识别封装
│   └── utils.ts            # 工具函数
└── package.json
```

## 注意事项

1. **摄像头权限**：应用需要访问设备的前后摄像头，请确保在浏览器中授予相应权限。

2. **HTTPS要求**：摄像头API在大多数浏览器中需要HTTPS环境才能正常工作。本地开发可以使用 `localhost`，生产环境必须使用HTTPS。

3. **AI识别接口**：默认集成百度通用物体识别（advanced_general）。请在 `.env.local` 中填入 `BAIDU_AIP_AK` 与 `BAIDU_AIP_SK`，否则识别会失败。

4. **Supabase存储**：确保在Supabase Dashboard中创建了名为 `images` 的公开存储桶。

## 开发说明

### 摄像头管理

`hooks/useCamera.ts` 实现了前后摄像头的同步管理：
- 后置摄像头用于显示和拍摄物品
- 前置摄像头在后台静默运行，用于拍摄人脸
- 两个摄像头流通过隐藏的 `<video>` 元素管理

### 数据存储

- 图片存储在 Supabase Storage 的 `images` 桶中
- 识别记录存储在 `recognition_records` 表中
- 前端仅负责上传图片并调用 `/api/save-recognition`
- `/api/save-recognition` 由服务端使用 `SUPABASE_SERVICE_ROLE_KEY` 写入数据库，避免在浏览器暴露密钥

## 许可证

MIT

