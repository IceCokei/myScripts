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
    echo "5. 一键申请SSL证书"
    echo "0. 返回"
}

# 定义日志和确认函数
LOGD() {
    echo "[DEBUG] $1"
}

LOGI() {
    echo "[INFO]  $1"
}

LOGE() {
    echo "[ERROR] $1"
}

confirm() {
    read -p "$1 " response
    [[ "$response" =~ ^(yes|y|Y)$ ]]
    return $?
}

show_menu() {
    display_utility_menu
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

ssl_cert_issue() {
    echo -E ""
    LOGD "******使用说明******"
    LOGI "该脚本将使用Acme脚本申请证书,使用时需保证:"
    LOGI "1.知晓Cloudflare 注册邮箱"
    LOGI "2.知晓Cloudflare Global API Key"
    LOGI "3.域名已通过Cloudflare进行解析到当前服务器"
    LOGI "4.该脚本申请证书默认安装路径为/root/cert目录"
    confirm "我已确认以上内容[y/n]" "y"
    if [ $? -eq 0 ]; then
        cd ~
        LOGI "安装Acme脚本"
        curl https://get.acme.sh | sh
        if [ $? -ne 0 ]; then
            LOGE "安装acme脚本失败"
            exit 1
        fi
        CF_Domain=""
        CF_GlobalKey=""
        CF_AccountEmail=""
        certPath=/root/cert
        if [ ! -d "$certPath" ]; then
            mkdir $certPath
        else
            rm -rf $certPath
            mkdir $certPath
        fi
        LOGD "请设置域名:"
        read -p "Input your domain here:" CF_Domain
        LOGD "你的域名设置为:${CF_Domain}"
        LOGD "请设置API密钥:"
        read -p "Input your key here:" CF_GlobalKey
        LOGD "你的API密钥为:${CF_GlobalKey}"
        LOGD "请设置注册邮箱:"
        read -p "Input your email here:" CF_AccountEmail
        LOGD "你的注册邮箱为:${CF_AccountEmail}"
        ~/.acme.sh/acme.sh --set-default-ca --server letsencrypt
        if [ $? -ne 0 ]; then
            LOGE "修改默认CA为Lets'Encrypt失败,脚本退出"
            exit 1
        fi
        export CF_Key="${CF_GlobalKey}"
        export CF_Email=${CF_AccountEmail}
        ~/.acme.sh/acme.sh --issue --dns dns_cf -d ${CF_Domain} -d *.${CF_Domain} --log
        if [ $? -ne 0 ]; then
            LOGE "证书签发失败,脚本退出"
            exit 1
        else
            LOGI "证书签发成功,安装中..."
        fi
        ~/.acme.sh/acme.sh --installcert -d ${CF_Domain} -d *.${CF_Domain} --ca-file /root/cert/ca.cer \
        --cert-file /root/cert/${CF_Domain}.cer --key-file /root/cert/${CF_Domain}.key \
        --fullchain-file /root/cert/fullchain.cer
        if [ $? -ne 0 ]; then
            LOGE "证书安装失败,脚本退出"
            exit 1
        else
            LOGI "证书安装成功,开启自动更新..."
        fi
        ~/.acme.sh/acme.sh --upgrade --auto-upgrade
        if [ $? -ne 0 ]; then
            LOGE "自动更新设置失败,脚本退出"
            ls -lah cert
            chmod 755 $certPath
            exit 1
        else
            LOGI "证书已安装且已开启自动更新,具体信息如下"
            ls -lah cert
            chmod 755 $certPath
        fi
    else
        show_menu
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
                    5)
                        ssl_cert_issue
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
