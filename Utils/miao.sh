#!/usr/bin/env bash

#BY:Coke
#Time:2024-8-8
#Tips:一个Coke的终端测速玩具

function StartTitle() {
    [[ -z "${SOURCE}" || -z "${SOURCE_REGISTRY}" ]] && clear
    echo -e ' +-----------------------------------+'
    echo -e " | \033[0;1;35;95m⡇\033[0m  \033[0;1;33;93m⠄\033[0m \033[0;1;32;92m⣀⡀\033[0m \033[0;1;36;96m⡀\033[0;1;34;94m⢀\033[0m \033[0;1;35;95m⡀⢀\033[0m \033[0;1;31;91m⡷\033[0;1;33;93m⢾\033[0m \033[0;1;32;92m⠄\033[0m \033[0;1;36;96m⡀⣀\033[0m \033[0;1;34;94m⡀\033[0;1;35;95m⣀\033[0m \033[0;1;31;91m⢀⡀\033[0m \033[0;1;33;93m⡀\033[0;1;32;92m⣀\033[0m \033[0;1;36;96m⢀⣀\033[0m |"
    echo -e " | \033[0;1;31;91m⠧\033[0;1;33;93m⠤\033[0m \033[0;1;32;92m⠇\033[0m \033[0;1;36;96m⠇⠸\033[0m \033[0;1;34;94m⠣\033[0;1;35;95m⠼\033[0m \033[0;1;31;91m⠜⠣\033[0m \033[0;1;33;93m⠇\033[0;1;32;92m⠸\033[0m \033[0;1;36;96m⠇\033[0m \033[0;1;34;94m⠏\033[0m  \033[0;1;35;95m⠏\033[0m  \033[0;1;33;93m⠣⠜\033[0m \033[0;1;32;92m⠏\033[0m  \033[0;1;34;94m⠭⠕\033[0m |"
    echo -e ' +-----------------------------------+'
    echo -e '  欢迎使用 CokeSpeed 一键安装脚本'
}

function Title() {
    local system_name="${SYSTEM_PRETTY_NAME:-"${SYSTEM_NAME} ${SYSTEM_VERSION_NUMBER}"}"
    local arch=""${DEVICE_ARCH}""
    local date="$(date "+%Y-%m-%d %H:%M:%S")"
    local timezone="$(timedatectl status 2>/dev/null | grep "Time zone" | awk -F ':' '{print $2}' | awk -F ' ' '{print $1}')"

    echo -e ''
    echo -e " 系统时间 ${BLUE}${date} ${timezone}${PLAIN}"
    echo -e ''
}

StartTitle
Title

show_progress() {
    local -r msg=$1
    local -r step=$2
    local -r total_steps=$3

    echo -ne "${msg} "
    for ((i=0; i<step; i++)); do
        echo -ne "="
    done
    for ((i=step; i<total_steps; i++)); do
        echo -ne " "
    done
    echo -e " (${step}/${total_steps})"
}

install_dependencies() {
    if [ "$(uname)" = "Darwin" ]; then
        echo "检测macOS依赖..."
        if ! command -v docker &> /dev/null; then
            echo "未检测到 Docker，请先安装并启动 Docker Desktop 后重试。"
            exit 1
        fi
    else
        echo "环境依赖已具备 🍻 开始安装..."
    fi
}

# 避开 frps 服务端占用端口 (bindPort 1341 / Dashboard 13442)
while :; do
    random_port=$(( ( RANDOM % 64512 ) + 1024 ))
    [ "$random_port" != 1341 ] && [ "$random_port" != 13442 ] && break
done

# 检测系统并设置路径
if [ "$(uname)" = "Darwin" ]; then
    docker_data_path="$HOME/docker_data/frpc"
    echo "当前系统环境: macOS"
    # 在 macOS 上使用 uuidgen 生成 token
    token=$(uuidgen)
else
    docker_data_path="/root/data/docker_data/frpc"
    echo "当前系统环境: $(uname)"
    token=$(cat /proc/sys/kernel/random/uuid)
fi

install_dependencies

total_steps=13
current_step=0

# 创建目录
mkdir -p $docker_data_path
current_step=$((current_step + 1))
show_progress "创建目录" $current_step $total_steps

# 生成 frpc.toml 配置文件
cat >$docker_data_path/frpc.toml << EOF
transport.tls.enable = true
serverAddr = "140.143.185.20"
serverPort = 1341
auth.token = "NWN4CJB7NFzZp4WRgKWfbnap"

[[proxies]]
name = "miaospeed.$random_port"
type = "tcp"
localIP = "127.0.0.1"
localPort = 9966
remotePort = $random_port
EOF
current_step=$((current_step + 1))
show_progress "生成 frpc.toml 配置文件" $current_step $total_steps

# 生成 docker-compose.yml 配置文件
cat >$docker_data_path/docker-compose.yml << EOF
services:
    frpc:
        restart: always
        network_mode: host
        volumes:
            - '$docker_data_path/frpc.toml:/etc/frp/frpc.toml'
        container_name: frpc
        image: snowdreamtech/frpc:0.56.0
EOF
current_step=$((current_step + 1))
show_progress "生成 docker-compose.yml 配置文件" $current_step $total_steps

# 检查是否已安装Docker和Docker Compose
if ! command -v docker &> /dev/null; then
    echo "Docker 未安装，开始安装..."
    bash <(curl -sSL https://sh.msl.la/mirrors/DockerInstallation.sh)
    if ! command -v docker &> /dev/null; then
        echo "Docker 安装失败，请检查安装脚本或手动安装。"
        exit 1
    else
        echo "Docker 安装成功！"
    fi
else
    docker_version=$(docker --version)
    echo "Docker 已安装，版本信息: $docker_version"
fi
current_step=$((current_step + 1))
show_progress "检查/安装 Docker" $current_step $total_steps

if docker compose version &> /dev/null; then
    COMPOSE="docker compose"
    echo "Docker Compose 已安装，版本信息: $(docker compose version)"
elif command -v docker-compose &> /dev/null; then
    COMPOSE="docker-compose"
    echo "Docker Compose 已安装，版本信息: $(docker-compose --version)"
else
    echo "Docker Compose 未安装，开始安装..."
    curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    if ! command -v docker-compose &> /dev/null; then
        echo "Docker Compose 安装失败，请检查安装脚本或手动安装。"
        exit 1
    else
        COMPOSE="docker-compose"
        echo "Docker Compose 安装成功！"
    fi
fi
current_step=$((current_step + 1))
show_progress "检查/安装 Docker Compose" $current_step $total_steps

# 删除已有的同名容器
if [ "$(docker ps -aq -f name=miaospeed)" ]; then
    echo "删除已有的同名容器 miaospeed..."
    docker rm -f miaospeed
fi
current_step=$((current_step + 1))
show_progress "删除已有的同名容器 miaospeed" $current_step $total_steps

if [ "$(docker ps -aq -f name=watchtower_miaospeed)" ]; then
    echo "删除已有的同名容器 watchtower..."
    docker rm -f watchtower_miaospeed
fi
current_step=$((current_step + 1))
show_progress "删除已有的同名容器 watchtower_miaospeed" $current_step $total_steps

if [ "$(docker ps -aq -f name=frpc)" ]; then
    echo "删除已有的同名容器 frpc..."
    docker rm -f frpc
fi
current_step=$((current_step + 1))
show_progress "删除已有的同名容器 frpc" $current_step $total_steps

# 拉取镜像
docker pull moshaoli688/miaospeed:latest
current_step=$((current_step + 1))
show_progress "拉取 Docker 镜像 moshaoli688/miaospeed:latest" $current_step $total_steps

docker pull containrrr/watchtower
current_step=$((current_step + 1))
show_progress "拉取 Docker 镜像 containrrr/watchtower" $current_step $total_steps

# 启动相关 Docker 容器
docker run -d -m 2g --memory-swap -1 --name=miaospeed --restart=always --network host -e MIAOSPEED_MTLS=1 -e MIAOSPEED_META=1 -e MIAOSPEED_CONNTHREAD=16 -e MIAOSPEED_TOKEN=$token --dns=223.5.5.5 --dns=223.6.6.6 --dns=119.29.29.29 --dns=114.114.114.114 --dns=114.114.115.115 --dns=182.254.116.116 moshaoli688/miaospeed:latest
current_step=$((current_step + 1))
show_progress "启动相关 Docker 容器 miaospeed" $current_step $total_steps

cd $docker_data_path
$COMPOSE up -d
current_step=$((current_step + 1))
show_progress "启动相关 Docker 容器 frpc" $current_step $total_steps

docker run -d --name watchtower_miaospeed --restart always -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower --cleanup --interval 3600 miaospeed
current_step=$((current_step + 1))
show_progress "启动 Watchtower" $current_step $total_steps

echo -e "\n任务完成!"
echo -e "\n请复制以下信息给可乐"
echo -e "对接端口: $random_port, Token: $token\n"
