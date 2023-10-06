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
    echo "2. ElmTool 选项"
    echo "0. 退出"
}

function display_elmtool_menu {
    clear
    echo "ElmTool 选项"
    echo "1. 安装 ElmTool"
    echo "2. 更新 ElmTool"
    echo "0. 返回"
}

while :; do
    display_main_menu
    read -p "请选择你要执行的操作: " choice

    case $choice in
        1)
            clear
            echo "正在安装 Docker...💬"
            # Place Docker installation commands here
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
                        # Place ElmTool installation commands here
                        echo "ElmTool 安装完成 🚀"
                        read -p "按任意键继续... " pause
                        ;;
                    2)
                        clear
                        echo "正在更新 ElmTool...💬"
                        # Place ElmTool update commands here
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
