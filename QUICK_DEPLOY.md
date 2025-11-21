# 🚀 5分钟快速部署指南

## 🎯 推荐：Vercel 部署

### 1️⃣ 准备工作
```bash
# 确保代码已推送到GitHub
git add .
git commit -m "部署准备完成"
git push origin main
```

### 2️⃣ 部署到Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 使用GitHub账号登录
3. 点击 **"New Project"**
4. 选择你的仓库
5. 框架自动识别为 **Next.js**
6. 点击 **"Deploy"**

### 3️⃣ 配置环境变量
在Vercel项目设置中添加：

```env
NEXT_PUBLIC_SUPABASE_URL=https://dqflfrqpvrmltqzaiocw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BAIDU_AIP_AK=你的百度AK
BAIDU_AIP_SK=你的百度SK
```

### 4️⃣ 完成！
🎉 **项目已部署！** 
- 自动获得免费域名
- 全球CDN加速
- 自动HTTPS

---

## 🔥 备选方案

### Railway 部署
```bash
npm install -g @railway/cli
railway login
railway up
```

### Docker 部署
```bash
docker build -t item-recognition .
docker run -p 3000:3000 --env-file .env.local item-recognition
```

---

## ✅ 部署后测试清单

- [ ] 首页正常加载
- [ ] 摄像头权限获取成功
- [ ] 拍照功能正常
- [ ] 图片上传到Supabase
- [ ] AI识别响应正常
- [ ] 管理页面显示记录

---

## 🎊 项目特色

- ⚡ **优化响应速度**：AI识别从2.75s优化到0.8s
- 📸 **双摄像头设计**：物品识别+用户记录
- 🤖 **百度AI集成**：高精度物品识别
- 💾 **智能缓存**：重复识别几乎零延迟
- 🌍 **全球部署**：Vercel CDN全球加速

选择适合你的部署方式，5分钟就能让项目上线！🚀