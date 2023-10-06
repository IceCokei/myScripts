#!/bin/bash

echo "系统信息查询"
echo "------------------------"

# 主机名
hostname=$(hostname)
echo "主机名: $hostname"

# 运营商信息
isp_info=$(curl -s ipinfo.io/org)
echo "运营商: $isp_info"

# 系统版本和Linux版本
os_info=$(source /etc/os-release && echo "$PRETTY_NAME")
kernel_version=$(uname -r)
echo "------------------------"
echo "系统版本: $os_info"
echo "Linux版本: $kernel_version"

# CPU信息
cpu_info=$(lscpu | grep "Model name" | awk -F: '{print $2}' | xargs)
cpu_cores=$(nproc)
cpu_arch=$(uname -m)
echo "------------------------"
echo "CPU架构: $cpu_arch"
echo "CPU型号: $cpu_info"
echo "CPU核心数: $cpu_cores"

# 内存使用情况
mem_info=$(free -m | awk 'NR==2{printf "%s/%sMB (%.2f%%)", $3, $2, $3*100/$2 }')
swap_info=$(free -m | awk 'NR==4{printf "%s/%sMB (%.2f%%)", $3, $2, $3*100/$2 }')
echo "------------------------"
echo "物理内存: $mem_info"
echo "虚拟内存: $swap_info"

# 硬盘占用
disk_info=$(df -h | awk '$NF=="/"{printf "%d/%dGB (%s)", $3,$2,$5}')
echo "硬盘占用: $disk_info"

# 网络信息
ipv4_address=$(curl -s ipv4.ip.sb)
ipv6_address=$(curl -s --max-time 2 ipv6.ip.sb || echo "N/A")
country=$(curl -s ipinfo.io/country)
city=$(curl -s ipinfo.io/city)
echo "------------------------"
echo "公网IPv4地址: $ipv4_address"
echo "公网IPv6地址: $ipv6_address"
echo "------------------------"
echo "地理位置: $country $city"

# 系统时间
current_time=$(date "+%Y-%m-%d %I:%M %p")
echo "系统时间: $current_time"
echo

