# 项目设置指南

## 1. 安装依赖

```bash
npm install
```

## 2. Supabase 配置

### 步骤 1: 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并登录
2. 创建新项目
3. 等待项目初始化完成

### 步骤 2: 创建数据库表

在 Supabase Dashboard 中，进入 SQL Editor，执行以下 SQL：

```sql
-- 创建识别记录表
CREATE TABLE IF NOT EXISTS recognition_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recognition_result TEXT NOT NULL,
  item_image_url TEXT NOT NULL,
  face_image_url TEXT
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_recognition_records_created_at 
ON recognition_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recognition_records_result 
ON recognition_records(recognition_result);
```

或者直接运行项目根目录下的 `supabase/schema.sql` 文件。

### 步骤 3: 创建存储桶

1. 在 Supabase Dashboard 中，进入 **Storage**
2. 点击 **Create bucket**
3. 配置如下：
   - **Name**: `images`
   - **Public bucket**: ✅ 勾选（重要！）
4. 点击 **Create bucket**

### 步骤 4: 配置存储桶策略（可选，用于生产环境）

如果需要更细粒度的权限控制，可以在 SQL Editor 中执行：

```sql
-- 允许公开读取
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- 允许插入（需要根据你的认证方式调整）
CREATE POLICY "Allow insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images');
```

### 步骤 5: 获取 API 密钥（Supabase）

1. 在 Supabase Dashboard 中，进入 **Settings** > **API**
2. 复制以下信息：
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY，仅服务器端使用，切勿暴露给前端)

### 步骤 6: 注册百度智能云（可选但推荐）

1. 访问 [百度智能云控制台](https://console.bce.baidu.com/ai/#/ai/imagerecognition/overview/index)
2. 创建“通用物体识别”应用，获取 **API Key (AK)** 与 **Secret Key (SK)**
3. 在 `.env.local` 中添加：

```env
BAIDU_AIP_AK=your-baidu-app-key
BAIDU_AIP_SK=your-baidu-secret-key
```

## 3. 配置环境变量

1. 复制 `.env.local.example` 为 `.env.local`
2. 填入你的 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BAIDU_AIP_AK=your-baidu-app-key
BAIDU_AIP_SK=your-baidu-secret-key
```

## 4. 运行项目

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 5. 配置 AI 识别（可选）

当前项目使用模拟识别结果。要使用真实的 AI 识别：

1. 在 `.env.local` 中添加 OpenAI API Key：

```env
OPENAI_API_KEY=your-openai-api-key
```

2. 修改 `app/api/recognize/route.ts`，取消注释 OpenAI API 调用代码。

## 注意事项

1. **摄像头权限**：应用需要访问设备的前后摄像头，请确保在浏览器中授予相应权限。

2. **HTTPS 要求**：
   - 本地开发可以使用 `localhost`
   - 生产环境必须使用 HTTPS
   - 可以使用 Vercel、Netlify 等平台部署

3. **移动端测试**：
   - 在移动设备上测试时，确保使用 HTTPS
   - 可以通过 ngrok 等工具创建 HTTPS 隧道进行本地测试

4. **浏览器兼容性**：
   - Chrome/Edge: 完全支持
   - Safari (iOS): 需要 HTTPS
   - Firefox: 完全支持

## 故障排除

### 摄像头无法访问
- 检查浏览器权限设置
- 确保使用 HTTPS（生产环境）或 localhost（开发环境）
- 检查设备是否有多个摄像头，某些设备可能需要手动选择

### 图片上传失败
- 检查 Supabase 存储桶是否已创建且为公开
- 检查环境变量是否正确配置
- 查看浏览器控制台的错误信息

### 数据库操作失败
- 检查数据库表是否已创建
- 确认 `.env.local` 正确配置 anon key 与 service_role key
- 查看 Supabase Dashboard 的日志

