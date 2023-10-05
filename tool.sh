#!/bin/bash

echo "Coke 工具 🛳️"

while :; do
    echo "1. 安装 Docker"
    echo "2. 安装 ElmTool"
    echo "3. 更新 ElmTool"
    echo "0. 退出"
    read -p "请选择你要执行的操作: " choice

    case $choice in
        1)
            echo "正在安装 Docker...💬"
            curl -fsSL https://get.docker.com | bash
            curl -L "https://github.com/docker/compose/releases/download/1.26.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
            echo "Docker 安装完成 🚀"
            ;;
        2)
            echo "正在安装 ElmTool...💬"
            docker run -dit \
              -v /etc/elmWeb/config.ini:/etc/elmWeb/config.ini \
              -v /etc/elmWeb/database.db:/etc/elmWeb/database.db \
              --network host \
              --name elmWeb \
              --restart unless-stopped \
              marisn/elmweb:latest
            echo "ElmTool 安装完成 🚀"
            ;;
        3)
            echo "正在更新 ElmTool...💬"
            docker stop elmWeb && docker rm elmWeb
            docker rmi marisn/elmweb
            docker pull marisn/elmweb
            docker run -dit \
              -v /etc/elmWeb/config.ini:/etc/elmWeb/config.ini \
              -v /etc/elmWeb/database.db:/etc/elmWeb/database.db \
              --network host \
              --name elmWeb \
              --restart unless-stopped \
              marisn/elmweb:latest
            echo "ElmTool 更新完成✅"
            ;;
        0)
            break
            ;;
        *)
            echo "❌无效选项 $choice"
            ;;
    esac

    # 在操作之后询问用户是否要继续
    read -p "是否继续？(y/n): " continue_choice
    if [[ "$continue_choice" != "y" ]]; then
        break
    fi
done
