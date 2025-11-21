# 🚀 物品识别应用部署指南

## 📋 部署前检查清单

### ✅ 环境变量配置
确保以下环境变量已正确配置：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥

# 百度AI配置
BAIDU_AIP_AK=你的百度AI应用AK
BAIDU_AIP_SK=你的百度AI应用SK
```

### ✅ Supabase 数据库
确保已执行以下SQL：

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

### ✅ Supabase 存储桶
1. 在 Supabase Dashboard 中创建 `images` 存储桶
2. 设置为公开访问（Public bucket）
3. 配置 RLS 策略（可选，根据安全需求）

---

## 🌟 部署方案

### 方案1: Vercel 部署 ⭐ 推荐

**优点：**
- 自动CI/CD
- 全球CDN加速
- Serverless函数支持
- 免费SSL证书

**步骤：**

1. **安装Vercel CLI**
```bash
npm i -g vercel
```

2. **登录Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
vercel
```

4. **配置环境变量**
在Vercel Dashboard中添加环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BAIDU_AIP_AK`
- `BAIDU_AIP_SK`

5. **自动部署**
推送代码到GitHub会自动触发部署

---

### 方案2: Supabase Edge Functions 部署

**优点：**
- 与数据库同平台
- 低延迟
- 统一管理

**步骤：**

1. **安装Supabase CLI**
```bash
npm install -g supabase
```

2. **初始化Supabase项目**
```bash
supabase init
```

3. **链接到项目**
```bash
supabase link --project-ref your-project-ref
```

4. **部署Edge Functions**
```bash
# 需要将API路由转换为Edge Functions格式
supabase functions deploy
```

---

### 方案3: Railway 部署

**优点：**
- 简单易用
- 支持数据库
- 价格合理

**步骤：**

1. **登录Railway**
```bash
railway login
```

2. **部署项目**
```bash
railway init
railway up
```

3. **配置环境变量**
在Railway Dashboard中添加环境变量

---

### 方案4: Docker 部署

**优点：**
- 完全控制
- 可移植性强
- 适合私有部署

**Dockerfile配置：**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**部署命令：**
```bash
docker build -t item-recognition .
docker run -p 3000:3000 --env-file .env item-recognition
```

---

## 🔧 部署配置优化

### 性能优化配置

**1. Next.js 配置优化**
```javascript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  experimental: {
    optimizeCss: true,
  },
};
```

**2. 缓存策略**
```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

### 安全配置

**1. 环境变量安全**
- 不要在代码中硬编码密钥
- 使用平台的环境变量管理
- 定期轮换API密钥

**2. CORS配置**
```javascript
// 在API路由中添加CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

---

## 📊 监控和维护

### 1. 性能监控
- 使用Vercel Analytics
- 监控API响应时间
- 监控错误率

### 2. 日志管理
```javascript
// 在关键位置添加日志
console.log(`识别请求开始: ${new Date().toISOString()}`);
```

### 3. 数据库备份
- 定期备份Supabase数据
- 设置存储桶的生命周期策略

---

## 🚨 常见问题解决

### 问题1: 图片上传失败
**解决方案：**
- 检查Supabase存储桶权限
- 验证RLS策略配置
- 确认环境变量正确

### 问题2: AI识别超时
**解决方案：**
- 增加API超时时间
- 检查百度AI配额
- 优化图片大小

### 问题3: 部署后404错误
**解决方案：**
- 确认Next.js路由配置
- 检查构建输出
- 验证静态文件路径

---

## 📱 部署后测试清单

- [ ] 访问首页正常加载
- [ ] 摄像头权限获取正常
- [ ] 拍照功能正常
- [ ] 图片上传成功
- [ ] AI识别响应正常
- [ ] 识别记录保存成功
- [ ] 前后摄像头同时工作
- [ ] 错误处理正常

---

## 🎯 推荐部署方案

**最佳选择：Vercel**
- 理由：完美支持Next.js、自动优化、全球CDN
- 成本：个人项目免费
- 部署时间：5分钟

**备选方案：Railway**
- 理由：支持更多自定义配置
- 成本：性价比高
- 适合：需要更多控制权的项目

选择适合你需求的平台进行部署即可！🚀