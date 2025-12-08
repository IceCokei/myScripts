# #对接项目：https://github.com/Chanzhaoyu/chatgpt-web 感谢🙏大神提供
#授权通知小助手
#By: @coke
# time: 2023-04-10 
#机器人🤖️命令：
# /start：欢迎提示🔔 
# /info：查询自己信息包含群组注册链接 
# /key：查询当前key[防止新成员看不到历史记录]
# /rekey：判断是否为管理员，重置key并重启服务[同步群组]

import os
import random
import string
import subprocess
import telebot
import json
import time
import threading

#防止消息过快 等待 10 秒钟
time.sleep(10)

#TG信息💻
API_TOKEN = "🤖️API_TOKEN"
# ID[群组]
CHAT_ID = -1000000000000 
bot = telebot.TeleBot(API_TOKEN)

#设置路径🦌
env_file_path = '/lujing'
user_info_folder = "/lujing"

#创建文件夹📁
if not os.path.exists(user_info_folder):
    os.makedirs(user_info_folder)

def handle_start_command(message):
    bot.reply_to(message, "欢迎🔔！请发送 /info 查看您的注册信息。")

ADMIN_ID = 管理员ID

#注册🐷
def handle_info_command(message):
    user_id = message.from_user.id
    user_info = create_or_update_user_info(user_id, user_info_folder)

    if user_info.get("authorized"):
        invite_link_exists = False

#检查信息文件中是否包含邀请链接🏠
        user_info_file = os.path.join(user_info_folder, f"{user_id}.json")
        if os.path.exists(user_info_file):
            with open(user_info_file, "r") as f:
                user_info_data = json.load(f)
                if user_info_data.get("invite_link"):
                    invite_link_exists = True

        try:
#调用函数设置为 True
            invite_link_exists = True
            if invite_link_exists:
                send_user_info(bot, user_id, user_info, invite_link_exists) 
        except Exception as e:
            print(f"发送用户信息时发生错误：{e}")
            bot.reply_to(message, "获取邀请链接失败，请稍后再试。")
    else:
        bot.reply_to(message, "您尚未注册授权，请再次发送 /info 以完成注册。")

#管理员更新key🐶
def handle_rekey_command(message):
    if message.from_user.id == ADMIN_ID:
        update_docker_compose()
        bot.reply_to(message, "已重新生成授权码并更新到配置文件，服务已重新启动。")
    else:
        bot.reply_to(message, "对不起，您没有权限执行此操作。")

#新成员加入计入状态✍️
def handle_new_chat_member(message):
    new_chat_member = message.new_chat_member
    user_id = new_chat_member.id
    user_info = create_or_update_user_info(user_id, user_info_folder)

    if user_info["status"] == 0:
        user_info["status"] = 1
        with open(os.path.join(user_info_folder, f"{user_id}.json"), "w") as f:
            json.dump(user_info, f)

#随机key 正则匹配 替换key并重启服务
def update_docker_compose():
    new_key = ''.join(random.choices(string.ascii_letters + string.digits, k=32))

    with open(env_file_path, 'r') as f:
        lines = f.readlines()

    for i, line in enumerate(lines):
        if line.strip().startswith('AUTH_SECRET_KEY='):
            lines[i] = 'AUTH_SECRET_KEY={}\n'.format(new_key)
            break
    else:
        print('找不到 AUTH_SECRET_KEY 配置项')
        exit(1)

    with open(env_file_path, 'w') as f:
        f.writelines(lines)

#restart pm2
    os.chdir('/lujing')
    subprocess.run(['pm2', 'restart', '0'])
    subprocess.run(['pm2', 'restart', '1'])

    print('成功生成新密钥并更新到 .env 文件中，并重新启动服务。')
    bot.send_message(chat_id=CHAT_ID, text=f'新密钥来啦🎉：{new_key}')

#发送用户信息
def send_user_info(bot, user_id, user_info, invite_link_exists=True):
    message = f"🆔 用户ID：{user_id}\n"
    message += f"🔑 授权状态：{'已授权' if user_info.get('authorized', False) else '未授权'}\n"
    message += f"💡 您的专属邀请链接：\n{user_info.get('invite_link', '')}" if invite_link_exists and user_info.get('invite_link', '') else ''  
    bot.send_message(user_id, message)

#创建或更新用户信息
def create_or_update_user_info(user_id, user_info_folder):
    user_info_file = os.path.join(user_info_folder, f"{user_id}.json")
    user_info = {"id": user_id, "authorized": False, "invite_link": ""}  # 设置初始值

    user_info_list = []
    if os.path.exists(user_info_file):
        with open(user_info_file, "r") as f:
            user_info = json.load(f)

    if user_info.get("authorized"):
        return user_info

#创建新用户信息
    user_info["key"] = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    user_info["authorized"] = True
    user_info["status"] = 0

#获取有效的链接🔗
    try:
        invite_link = bot.export_chat_invite_link(CHAT_ID)
        user_info["invite_link"] = invite_link
    except Exception as e:
        print(f"获取群组邀请链接时发生错误：{e}")

#保存用户信息💻
    with open(user_info_file, "w") as f:
        json.dump(user_info, f, indent=2)

    return user_info

#key删除消息⛰️
def delete_messages(chat_id, message_ids, delay=0):
    time.sleep(delay)
    for message_id in message_ids:
        bot.delete_message(chat_id, message_id)

def handle_key_command(message):
    if message.chat.id == CHAT_ID:
        with open(env_file_path, 'r') as f:
            lines = f.readlines()
        current_key = None
        for line in lines:
            if line.strip().startswith('AUTH_SECRET_KEY='):
                current_key = line.strip().split('=')[1]
                break
        if current_key:
#删除消息⛰️
            sent_message = bot.send_message(CHAT_ID, f"当前密钥🔑：{current_key}")
            threading.Thread(target=delete_messages, args=(CHAT_ID, [message.message_id, sent_message.message_id], 30)).start()  # 30 秒后删除消息
        else:
            sent_message = bot.send_message(CHAT_ID, "获取当前密钥失败，请稍后再试。")
            threading.Thread(target=delete_messages, args=(CHAT_ID, [message.message_id, sent_message.message_id], 30)).start()  # 30 秒后删除消息
    else:
        sent_message = bot.send_message(message.chat.id, "抱歉，该命令仅在群组中可用。")
        threading.Thread(target=delete_messages, args=(message.chat.id, [message.message_id, sent_message.message_id], 30)).start()  # 30 秒后删除消息

update_docker_compose()
bot.message_handler(commands=['start'])(handle_start_command)
bot.message_handler(commands=['info'])(handle_info_command)
bot.message_handler(commands=['rekey'])(handle_rekey_command)  
bot.message_handler(content_types=['new_chat_members'])(handle_new_chat_member)
bot.message_handler(commands=['key'])(handle_key_command)

# 开始轮询
bot.polling(timeout=120)
