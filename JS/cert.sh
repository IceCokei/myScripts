#!/bin/bash

# ==UserScript==
# @name         自动申请 SSL 证书脚本
# @description  自动识别系统类型、修复错误源、申请 Let's Encrypt/ZeroSSL 证书
# @namespace    https://github.com/IceCokei
# @version      1.0.0
# @author       Coke
# ==/UserScript==

set -e

OS="$(grep '^ID=' /etc/os-release | cut -d= -f2 | tr -d '"')"

echo "🔍 检测系统: $OS"

if [[ "$OS" == "debian" ]]; then
    echo "🧹 清理 Ubuntu Docker 错误源..."
    sed -i '/download.docker.com\/linux\/ubuntu/d' /etc/apt/sources.list /etc/apt/sources.list.d/*.list 2>/dev/null || true

elif [[ "$OS" == "ubuntu" ]]; then
    echo "🧹 清理 Debian Docker 错误源..."
    sed -i '/download.docker.com\/linux\/debian/d' /etc/apt/sources.list /etc/apt/sources.list.d/*.list 2>/dev/null || true
fi

if grep -q "bullseye-backports" /etc/apt/sources.list; then
    echo "🧹 移除 bullseye-backports 源..."
    sed -i '/bullseye-backports/d' /etc/apt/sources.list
fi

read -p "请输入你的域名: " DOMAIN

EMAIL="user$RANDOM$RANDOM@gmail.com"
echo "📧 使用随机邮箱: $EMAIL"

apt update -y

for pkg in cron socat lsof curl; do
    if ! command -v $pkg &>/dev/null; then
        echo "🔧 安装 $pkg..."
        apt install -y $pkg
    fi
done

if [ ! -d "$HOME/.acme.sh" ]; then
    echo "🔧 安装 acme.sh..."
    curl https://get.acme.sh | sh -s email="$EMAIL" --force
fi

source "$HOME/.acme.sh/acme.sh.env"

echo "📝 注册 Let's Encrypt 账户..."
~/.acme.sh/acme.sh --set-default-ca --server letsencrypt
~/.acme.sh/acme.sh --register-account -m "$EMAIL" || true

echo "⛔ 检查 80 端口占用..."
PID=$(lsof -i :80 -t || true)
if [ -n "$PID" ]; then
    echo "⚠️ 80 端口被占用 (PID: $PID)"
    read -p "是否结束该进程以使用 80 端口？(y/n): " KILL80
    if [[ "$KILL80" == "y" ]]; then
        kill -9 $PID
        sleep 2
        PORT=80
    else
        echo "🔄 将使用 443 端口申请证书..."
        PORT=443
    fi
else
    PORT=80
fi

~/.acme.sh/acme.sh --remove -d "$DOMAIN" >/dev/null 2>&1 || true
rm -rf ~/.acme.sh/"$DOMAIN"* || true

echo "🚀 开始申请证书 (端口: $PORT)..."

if ! ~/.acme.sh/acme.sh --issue --standalone --listen-v4 --httpport $PORT -d "$DOMAIN"; then
    echo "⚠️ Let's Encrypt 失败，尝试 ZeroSSL..."
    ~/.acme.sh/acme.sh --register-account -m "$EMAIL" --server zerossl
    if ! ~/.acme.sh/acme.sh --issue --standalone --listen-v4 --httpport $PORT -d "$DOMAIN"; then
        echo "❌ 证书申请失败，请检查域名解析及端口。"
        exit 1
    fi
fi

echo "✅ 安装证书..."
~/.acme.sh/acme.sh --installcert -d "$DOMAIN" \
  --key-file       /root/private.key \
  --fullchain-file /root/cert.crt

if [ ! -s /root/private.key ] || [ ! -s /root/cert.crt ]; then
    echo "❌ 证书生成失败。"
    exit 1
fi

echo "🎉 证书申请成功!"
echo "� 私钥：请/root/private.key"
echo "📄 证书：/root/cert.crt"
