#!/bin/bash

# 用户输入域名
read -p "请输入你的域名: " DOMAIN

# 生成随机 Gmail 邮箱
EMAIL="user$RANDOM$RANDOM@gmail.com"
echo "📧 使用随机邮箱: $EMAIL"

# 检查并安装 socat（acme.sh standalone 模式需要）
if ! command -v socat &>/dev/null; then
    echo "🔧 正在安装 socat..."
    apt update && apt install -y socat
fi

# 安装 acme.sh（如果未安装）
if [ ! -d "$HOME/.acme.sh" ]; then
    echo "🔧 安装 acme.sh..."
    curl https://get.acme.sh | sh
    source ~/.bashrc
fi

# 注册账户（使用 ZeroSSL）
~/.acme.sh/acme.sh --register-account -m "$EMAIL" --server zerossl

# 检查 80 端口是否被占用并释放
echo "⛔ 检查 80 端口占用..."
PID=$(lsof -i :80 -t)
if [ -n "$PID" ]; then
    echo "⚠️ 发现占用 80 端口的进程，PID: $PID，正在尝试停止..."
    kill -9 $PID
    sleep 2
fi

# 申请证书
echo "🚀 开始申请证书..."
~/.acme.sh/acme.sh --issue --standalone -d "$DOMAIN"

# 安装证书
echo "✅ 安装证书..."
~/.acme.sh/acme.sh --installcert -d "$DOMAIN" \
  --key-file       /root/private.key \
  --fullchain-file /root/cert.crt

echo "🎉 证书申请完成："
echo "🔑 私钥：/root/private.key"
echo "📄 证书：/root/cert.crt"
