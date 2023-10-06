#!/bin/bash

function display_main_menu {
    clear
    echo " _  __ _       _____  ___    ___   _     "
    echo "| |/ /| |     |_   _|/ _ \  / _ \ | |    "
    echo "| ' / | |       | | | | | || | | || |    "
    echo "| . \ | |___    | | | |_| || |_| || |___ "
    echo "|_|\_\|_____|   |_|  \___/  \___/ |_____|"
    echo "                                         "
    echo "1. 安装 Docker"
    echo "2. ElmTool 选项 > "
    echo "3. 实用工具 > "
    echo "0. 退出"
}

function display_elmtool_menu {
    clear
    echo "ElmTool 选项"
    echo "1. 安装 ElmTool"
    echo "2. 更新 ElmTool"
    echo "0. 返回"
}

function display_utility_menu {
    clear
    echo "实用工具"
    echo "1. 系统更新"
    echo "2. 流媒体检测"
    echo "3. 一键搭建X-ui"
    echo "4. 测速"
    echo "0. 返回"
}

function system_update {
    clear
    if [ "$(uname)" == "Darwin" ]; then
        echo "暂不支持 MacOS。"
    elif [ -f "/etc/redhat-release" ]; then
        yum -y update
    elif [ -f "/etc/lsb-release" ]; then
        apt update -y
    else
        echo "无法确定您的操作系统类型！"
    fi
}

while :; do
    display_main_menu
    read -p "请选择你要执行的操作: " choice

    case $choice in
        1)
            clear
            echo "正在安装 Docker...💬"
            curl -fsSL https://get.docker.com | bash
            curl -L "https://github.com/docker/compose/releases/download/1.26.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
            echo "Docker 安装完成 🚀"
            read -p "按任意键继续... " pause
            ;;
        2)
            while :; do
                display_elmtool_menu
                read -p "请选择 ElmTool 的操作: " elm_choice
                
                case $elm_choice in
                    1)
                        clear
                        echo "正在安装 ElmTool...💬"
                        docker run -dit \
                          -v /etc/elmWeb/config.ini:/etc/elmWeb/config.ini \
                          -v /etc/elmWeb/database.db:/etc/elmWeb/database.db \
                          --network host \
                          --name elmWeb \
                          --restart unless-stopped \
                          marisn/elmweb:latest
                        echo "ElmTool 安装完成 🚀"
                        read -p "按任意键继续... " pause
                        ;;
                    2)
                        clear
                        echo "正在更新 ElmTool...💬"
                        echo "开始执行 删除运行容器...✅"
                        docker stop elmWeb && docker rm elmWeb
                        echo "开始执行 删除依赖镜像...✅"
                        docker rmi marisn/elmweb
                        echo "开始执行 获取最新镜像...✅"
                        docker pull marisn/elmweb
                        echo "开始执行 执行安装镜像...✅"
                        docker run -dit \
                          -v /etc/elmWeb/config.ini:/etc/elmWeb/config.ini \
                          -v /etc/elmWeb/database.db:/etc/elmWeb/database.db \
                          --network host \
                          --name elmWeb \
                          --restart unless-stopped \
                          marisn/elmweb:latest
                        echo "ElmTool 更新完成✅"
                        read -p "按任意键继续... " pause
                        ;;
                    0)
                        break
                        ;;
                    *)
                        clear
                        echo "❌无效选项 $elm_choice"
                        read -p "按任意键继续... " pause
                        ;;
                esac
            done
            ;;
        3)
            while :; do
                display_utility_menu
                read -p "请选择实用工具的操作: " util_choice
                
                case $util_choice in
                    1)
                        system_update
                        read -p "按任意键继续... " pause
                        ;;
                    2)
                        clear
                        echo "流媒体检测"
                        # 流媒体检测命令
                        bash <(curl -L -s check.unlock.media)
                        read -p "按任意键继续... " pause
                        ;;
                    3)
                        clear
                        echo "x-ui 一键搭建"
                        # x-ui 一键搭建命令
                        bash <(curl -Ls https://raw.githubusercontent.com/vaxilu/x-ui/master/install.sh)
                        read -p "按任意键继续... " pause
                        ;;
                    4)
                        clear
                        echo "测速"
                        curl -Lso- bench.sh | bash
                        read -p "按任意键继续... " pause
                        ;;
                    0)
                        break
                        ;;
                    *)
                        clear
                        echo "❌无效选项 $util_choice"
                        read -p "按任意键继续... " pause
                        ;;
                esac
            done
            ;;
        0)
            break
            ;;
        *)
            clear
            echo "❌无效选项 $choice"
            read -p "按任意键继续... " pause
            ;;
    esac
done
