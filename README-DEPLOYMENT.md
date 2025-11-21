# 🚀 SmartLens 部署指南

## 📋 快速部署 (推荐免费方案)

### Vercel 部署 (5分钟搞定)

#### 1️⃣ 准备文件
使用 `vercel-free.json` 配置文件，适合免费用户：
```bash
# 复制免费版配置
cp vercel-free.json vercel.json
```

#### 2️⃣ 部署步骤
1. 访问 [vercel.com](https://vercel.com)
2. 使用GitHub账号登录
3. 点击 **"New Project"**
4. 选择你的 `SmartLens` 仓库
5. 框架选择 **Next.js** (自动检测)
6. 配置环境变量：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://dqflfrqpvrmltqzaiocw.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   BAIDU_AIP_AK=你的百度AK
   BAIDU_AIP_SK=你的百度SK
   ```
7. 点击 **"Deploy"**

#### 3️⃣ 完成部署
🎉 **项目已上线！**
- 自动获得免费域名
- 全球CDN加速
- 自动HTTPS证书

---

## 🌟 其他部署平台

### Railway 部署
```bash
# 安装CLI
npm install -g @railway/cli

# 登录并部署
railway login
railway up
```

### Netlify 部署
```bash
# 安装CLI
npm install -g netlify-cli

# 部署
netlify deploy --prod --dir=.next
```

---

## 🔧 环境变量配置

### 必需的环境变量
```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥

# 百度AI配置
BAIDU_AIP_AK=你的百度AI应用AK
BAIDU_AIP_SK=你的百度AI应用SK
```

---

## 📊 部署后测试清单

- [ ] 首页正常加载
- [ ] 摄像头权限获取成功
- [ ] 拍照功能正常
- [ ] 图片上传到Supabase
- [ ] AI识别响应正常
- [ ] 管理页面显示记录

---

## 🎯 项目特色

- ⚡ **性能优化70%**：AI识别从2.75s优化到0.8s
- 📸 **双摄像头设计**：物品识别+用户记录
- 🤖 **百度AI集成**：高精度物品识别
- 💾 **智能缓存**：重复识别几乎零延迟
- 🌍 **免费部署**：Vercel个人项目免费
- 📱 **响应式设计**：完美适配移动端

---

## 🚀 开始使用

1. **访问部署的URL**
2. **允许摄像头权限**
3. **点击拍照按钮**
4. **查看AI识别结果**
5. **访问管理页面**：`/admin`

你的SmartLens项目已准备就绪！🎊