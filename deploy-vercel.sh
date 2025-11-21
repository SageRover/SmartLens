#!/bin/bash

echo "🚀 开始部署到Vercel..."

# 1. 安装Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 安装Vercel CLI..."
    npm i -g vercel
fi

# 2. 登录Vercel
echo "🔐 登录Vercel..."
vercel login

# 3. 部署项目
echo "🚀 部署项目..."
vercel --prod

echo "✅ 部署完成！"

# 4. 提示配置环境变量
echo "⚠️  请在Vercel Dashboard中配置以下环境变量："
echo "   NEXT_PUBLIC_SUPABASE_URL"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY" 
echo "   SUPABASE_SERVICE_ROLE_KEY"
echo "   BAIDU_AIP_AK"
echo "   BAIDU_AIP_SK"