#!/bin/bash

function display_main_menu {
    # 获取version.json
    JSON_DATA=$(curl -ks https://raw.githubusercontent.com/IceCokei/myScripts/main/version.json)
    
    # 检查curl命令是否成功执行
    if [ $? -ne 0 ]; then
        echo "❌: 无法解析版本数据"
        exit 1
    fi
    
    VERSION=$(echo $JSON_DATA | python3 -c "import sys, json; print(json.load(sys.stdin)['version'])")
    MESSAGE=$(echo $JSON_DATA | python3 -c "import sys, json; print(json.load(sys.stdin)['message'])")
    
    # 检查Python命令是否成功执行
    if [ $? -ne 0 ]; then
        echo "❌: 无法解析版本数据"
        exit 1
    fi
    
    clear
    
    echo -e "\033[1;31m _  __ _       _____  ___    ___   _     \033[0m"
    echo -e "\033[1;32m| |/ /| |     |_   _|/ _ \  / _ \ | |    \033[0m"
    echo -e "\033[1;33m| ' / | |       | | | | | || | | || |    \033[0m"
    echo -e "\033[1;34m| . \ | |___    | | | |_| || |_| || |___ \033[0m"
    echo -e "\033[1;35m|_|\_\|_____|   |_|  \___/  \___/ |_____| \033[0m"
    echo -e "\033[1;36m                                         \033[0m"

    echo -e "\033[1;37mCokeTooL一键脚本工具 $VERSION （支持Ubuntu，Debian，Centos系统）\033[0m"

    
    echo "***********************"
    
    echo "1. 系统信息查询"
    echo "2. Docker 管理 > "
    echo "3. 实用工具 > "
    echo "4. WARP 管理 ▶ 解锁🔓ChatGPT / Netfilx "
    echo "5. BBR加速管理 >"
    echo "6. 常用面板安装 >"
    echo "0. 退出"
    echo "00. 版本日志"
    
}

function display_utility_menu {
    clear
    echo "实用工具"
    echo "1. 系统更新"
    echo "2. 流媒体检测"
    echo "3. ChatGPT解锁检测"
    echo "4. 一键搭建X-ui"
    echo "5. 网络测速"
    echo "6. IP质量体检"
    echo "7. 设置ROOT密码"
    echo "0. 返回"
}

function display_docker_menu {
    clear
    echo "Docker 管理"
    echo "1. 安装 Docker"
    echo "2. 查看Dcoker全局状态"
    # 在这里你可以添加更多的 Docker 相关的选项
    echo "0. 返回"
}

function display_panel_menu {
    clear
    echo "青龙面板管理"
    echo "1. 安装青龙 2.10.12版本"
    # echo "2. 安装青龙 latest 版本"
    # echo "3. 卸载青龙"
    # echo "4. 查看青龙面板"
    echo "0. 返回上一级"
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

# 设置ROOT密码登录模式
add_sshpasswd() {
    echo "设置你的ROOT密码"
    passwd
    sed -i 's/^\s*#\?\s*PermitRootLogin.*/PermitRootLogin yes/g' /etc/ssh/sshd_config
    sed -i 's/^\s*#\?\s*PasswordAuthentication.*/PasswordAuthentication yes/g' /etc/ssh/sshd_config
    rm -rf /etc/ssh/sshd_config.d/* /etc/ssh/ssh_config.d/*
    service sshd restart
    echo "ROOT登录设置完毕！"

    read -p "需要重启服务器吗？(Y/N): " choice
    case "$choice" in
    [Yy])
        reboot
        ;;
    [Nn])
        echo "已取消"
        ;;
    *)
        echo "无效的选择，请输入 Y 或 N。"
        ;;
    esac
}

while :; do
    display_main_menu
    read -p "请选择你要执行的操作: " choice

case $choice in
        1)
            clear
            echo "开始检测系统⚡️"
            # x-ui 一键搭建命令
            curl -sSL https://raw.githubusercontent.com/IceCokei/myScripts/main/CPU/system.sh | bash
            read -p "按任意键继续... " pause
            ;;
        2)
            while :; do
                display_docker_menu
                read -p "请选择 Docker 的操作: " docker_choice
                
                case $docker_choice in
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
                            clear
                            {
                                echo "Docker版本"
                                docker --version
                                docker-compose --version
                                echo ""
                                echo "Docker镜像列表"
                                docker image ls
                                echo ""
                                echo "Docker容器列表"
                                docker ps -a
                                echo ""
                                echo "Docker卷列表"
                                docker volume ls
                                echo ""
                                echo "Docker网络列表"
                                docker network ls
                                echo -e "\nDocker 输出完毕 退出请按'q'"
                            } | less
                            ;;
                    0)
                        break
                        ;;
                    *)
                        clear
                        echo "❌无效选项 $docker_choice"
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
                        echo "ChatGPT解锁检测"
                        # ChatGPT解锁检测
                        bash <(curl -Ls https://cdn.jsdelivr.net/gh/missuo/OpenAI-Checker/openai.sh)
                        read -p "按任意键继续... " pause
                        ;;
                    4)
                        clear
                        echo "x-ui 一键搭建"
                        # x-ui 一键搭建命令
                        bash <(curl -Ls https://raw.githubusercontent.com/vaxilu/x-ui/master/install.sh)
                        read -p "按任意键继续... " pause
                        ;;
                    5)
                        clear
                        echo "测速"
                        curl -Lso- bench.sh | bash
                        read -p "按任意键继续... " pause
                        ;;
                    6)
                        clear
                        echo "IP质量体检"
                        # IP质量体检命令
                        bash <(curl -sL IP.Check.Place)
                        read -p "按任意键继续... " pause
                        ;;
                    7)
                        add_sshpasswd
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
        4)
        clear
        # 检查并安装 wget（如果需要）
            if ! command -v wget &>/dev/null; then
                if command -v apt &>/dev/null; then
                apt update -y && apt install -y wget
            elif command -v yum &>/dev/null; then
                yum -y update && yum -y install wget
            else
                echo "未知的包管理器!"
                exit 1
                fi
            fi
        wget -N https://gitlab.com/fscarmen/warp/-/raw/main/menu.sh && bash menu.sh [option] [lisence/url/token]
        read -p "按任意键继续... " pause
        ;;
        5)
        clear
        # 检查并安装 wget（如果需要）
            if ! command -v wget &>/dev/null; then
                if command -v apt &>/dev/null; then
                apt update -y && apt install -y wget
            elif command -v yum &>/dev/null; then
                yum -y update && yum -y install wget
            else
                echo "未知的包管理器!"
                exit 1
                fi
            fi
        wget --no-check-certificate -O tcpx.sh https://raw.githubusercontent.com/ylx2016/Linux-NetSpeed/master/tcpx.sh
        chmod +x tcpx.sh
        ./tcpx.sh
        ;;
        6)
            while :; do
            display_panel_menu
            read -p "请选择你的的操作: " panel_choice

            case $panel_choice in
            1)
                clear
                # 检测是否安装了Docker
                if ! command -v docker &>/dev/null; then
                    curl -fsSL https://get.docker.com | sh  
                    systemctl start docker
                    systemctl enable docker
                else
                    echo "Docker 已经安装，正在部署容器……"
                fi

                # 用户输入自定义的端口
                read -p "请输入您想要的青龙面板端口: " ql_port

                # 检查用户输入的是否是一个有效的端口号
                if [[ "$ql_port" =~ ^[0-9]+$ ]] && [ "$ql_port" -ge 1024 ] && [ "$ql_port" -le 65535 ]; then
                    
                    # 检查是否有重复的容器名，如果有，在名称后面加1
                    base_name="qinglong"
                    name_to_use="$base_name"
                    count=0

                    while docker ps -a --format '{{.Names}}' | grep -wq $name_to_use; do
                        count=$((count + 1))
                        name_to_use="${base_name}${count}"
                    done

                    # 创建文件夹
                    mkdir -p "/root/$name_to_use/config" "/root/$name_to_use/log" "/root/$name_to_use/db" "/root/$name_to_use/scripts"

                    # 运行 Docker 命令来部署青龙
                    docker run -dit \
                        -v /root/$name_to_use/config:/ql/config \
                        -v /root/$name_to_use/log:/ql/log \
                        -v /root/$name_to_use/db:/ql/db \
                        -v /root/$name_to_use/scripts:/ql/scripts \
                        -p $ql_port:5700 \
                        --name $name_to_use \
                        --restart always \
                        whyour/qinglong:2.10.12

                    echo "$name_to_use 版本安装完成 🚀"
                    external_ip=$(curl -s ipv4.ip.sb)
                    # 获取以 192 开头的内网 IP 地址
                    internal_ip=$(hostname -I | awk '{for(i=1;i<=NF;i++) if ($i ~ /^192/) print $i}')
                    echo "您可以使用以下地址访问青龙面板:"
                    echo "外网地址: http://$external_ip:$ql_port"
                    echo "内网地址: http://$internal_ip:$ql_port"
                    echo ""
                    read -p "按任意键继续... " pause
                else
                    echo "无效的端口号。请确保您输入一个在1024到65535之间的数字。"
                    read -p "按任意键继续... " pause
                fi
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
            ;;
        00)
            clear
            echo -e "$MESSAGE"  
            read -p "按任意键返回主菜单... " pause
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
