#!/bin/bash

function display_main_menu {
    clear
echo -e "\033[1;31m _  __ _       _____  ___    ___   _     \033[0m"
echo -e "\033[1;32m| |/ /| |     |_   _|/ _ \  / _ \ | |    \033[0m"
echo -e "\033[1;33m| ' / | |       | | | | | || | | || |    \033[0m"
echo -e "\033[1;34m| . \ | |___    | | | |_| || |_| || |___ \033[0m"
echo -e "\033[1;35m|_|\_\|_____|   |_|  \___/  \___/ |_____| \033[0m"
echo -e "\033[1;36m                                         \033[0m"
echo -e "\033[1;37mCokeTooL一键脚本工具 v1.0.1 （支持Ubuntu，Debian，Centos系统）\033[0m"
    
    
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
    elif [ -f "/etc/os-release" ]; then
        # 获取Linux发行版的ID
        OS_ID=$(grep -oP '(?<=^ID=).+' /etc/os-release | tr -d '"')
        case $OS_ID in
            ubuntu|debian)
                apt update -y
                ;;
            centos|rhel|fedora)
                yum -y update
                ;;
            *)
                echo "不支持的Linux发行版: $OS_ID"
                ;;
        esac
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
