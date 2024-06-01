#!/bin/bash

# 提升为root用户
sudo -i

# 开放所有端口
iptables_open() {
    iptables -P INPUT ACCEPT
    iptables -P FORWARD ACCEPT
    iptables -P OUTPUT ACCEPT
    iptables -F

    ip6tables -P INPUT ACCEPT
    ip6tables -P FORWARD ACCEPT
    ip6tables -P OUTPUT ACCEPT
    ip6tables -F
}

# ROOT密码登录模式
add_sshpasswd() {
    echo "设置你的ROOT密码"
    passwd
    sed -i 's/^\s*#\?\s*PermitRootLogin.*/PermitRootLogin yes/g' /etc/ssh/sshd_config
    sed -i 's/^\s*#\?\s*PasswordAuthentication.*/PasswordAuthentication yes/g' /etc/ssh/sshd_config
    rm -rf /etc/ssh/sshd_config.d/* /etc/ssh/ssh_config.d/*
    restart_ssh
    echo -e "${lv}ROOT登录设置完毕！${bai}"
}

# 重启 SSH 服务
restart_ssh() {
    if command -v dnf &>/dev/null; then
        systemctl restart sshd
    elif command -v yum &>/dev/null; then
        systemctl restart sshd
    elif command -v apt &>/dev/null; then
        service ssh restart
    elif command -v apk &>/dev/null; then
        service sshd restart
    else
        echo "未知的包管理器!"
        return 1
    fi
}

# 主函数
main() {
    echo "按 ENTER 键继续..."
    read -r  # 等待用户按 ENTER
    iptables_open
    add_sshpasswd
}

main
