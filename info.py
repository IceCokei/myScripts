"""
name = 🥤CokeNodeseek 情报监控
desc = 定时刷新最新帖子内容进行推送🍟
author = Coke🆕 [https://github.com/IceCokei]
data = 2025-2-5
system = Python
"""

import requests
import logging
import json
import os
import re
import time
import random
from telegram import Bot
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import pytz
from datetime import datetime

# 配置
NODESEEK_URL = "https://www.nodeseek.com/categories/info"
TG_BOT_TOKEN = "机器人密钥"
TG_CHAT_ID = "群组ID/频道ID/私聊ID"
HISTORY_FILE = "notes.json"
CHECK_INTERVAL = 300  # 基础间隔时间（秒）
CHECK_INTERVAL_RANDOM = 60  # 随机增加的最大间隔时间（秒）

# Emoji 表情配置
EMOJI = {
    'START': '🚀',
    'END': '🏁',
    'ERROR': '❌',
    'WARNING': '⚠️',
    'INFO': [
        '🌟', '✨', '💫', '⭐️', '🌙', '☀️', '🌈', '🌺', '🌸', '🍀',
        '🎯', '🎨', '🎭', '🎪', '🎡', '🎢', '🎠', '🎮', '🎲', '🎰',
        '🔮', '🎪', '🎭', '🎨', '🎯', '🎲', '🎮', '🎰', '🎳', '🎯'
    ],
    'NEW': '🎉',
    'SAVE': '💾',
    'LOAD': '📂',
    'FETCH': '🔍',
    'SEND': '📨',
    'WAIT': '⏳',
    'TIME': '🕒',
    'LINK': '🔗'
}

# 配置日志
class EmojiFormatter(logging.Formatter):
    def format(self, record):
        if record.levelno == logging.ERROR:
            record.msg = f"{EMOJI['ERROR']} {record.msg}"
        elif record.levelno == logging.WARNING:
            record.msg = f"{EMOJI['WARNING']} {record.msg}"
        elif record.levelno == logging.INFO:
            # 根据消息内容添加不同的emoji
            if "程序开始运行" in record.msg:
                record.msg = f"{EMOJI['START']} {record.msg}"
            elif "程序运行结束" in record.msg:
                record.msg = f"{EMOJI['END']} {record.msg}"
            elif "保存历史记录" in record.msg:
                record.msg = f"{EMOJI['SAVE']} {record.msg}"
            elif "加载历史记录" in record.msg:
                record.msg = f"{EMOJI['LOAD']} {record.msg}"
            elif "获取情报" in record.msg:
                record.msg = f"{EMOJI['FETCH']} {record.msg}"
            elif "发送" in record.msg:
                record.msg = f"{EMOJI['SEND']} {record.msg}"
            elif "等待" in record.msg:
                record.msg = f"{EMOJI['WAIT']} {record.msg}"
            elif "发现" in record.msg and "新帖子" in record.msg:
                record.msg = f"{EMOJI['NEW']} {record.msg}"
            else:
                # 为其他 INFO 消息随机选择一个表情
                record.msg = f"{random.choice(EMOJI['INFO'])} {record.msg}"
        return super().format(record)

# 配置日志格式
formatter = EmojiFormatter('%(asctime)s - %(levelname)s - %(message)s')
handler = logging.StreamHandler()
handler.setFormatter(formatter)
logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.addHandler(handler)

# 获取随机UA
def get_random_ua():
    try:
        ua = UserAgent()
        return ua.random
    except Exception as e:
        logging.warning(f"获取随机UA失败，使用默认UA: {str(e)}")
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

# 加载历史记录
def load_history():
    logging.info("加载历史记录...")
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"加载历史记录失败: {str(e)}")
            return []
    return []

# 保存历史记录
def save_history(history):
    logging.info("保存历史记录...")
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logging.error(f"保存历史记录失败: {str(e)}")

# 获取帖子ID
def extract_post_id(url):
    match = re.search(r'/post-(\d+)', url)
    return match.group(1) if match else None

# 获取情报板块的帖子
def fetch_info_posts():
    logging.info("获取情报板块数据...")
    headers = {'User-Agent': get_random_ua()}
    
    try:
        response = requests.get(NODESEEK_URL, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        posts = []
        for post in soup.select('.post-list-item'):
            try:
                title_element = post.select_one('.post-title a')
                category_element = post.select_one('.post-category')
                time_element = post.select_one('.info-last-comment-time time')
                
                if title_element and category_element and '情报' in category_element.text.strip():
                    title = title_element.text.strip()
                    link = title_element.get('href', '')
                    if link and not link.startswith('http'):
                        link = f"https://www.nodeseek.com{link}"
                    
                    post_id = extract_post_id(link)
                    # 获取发布时间
                    post_time = time_element.get('datetime', '') if time_element else ''
                    
                    if post_id:
                        posts.append({
                            'title': title,
                            'link': link,
                            'id': post_id,
                            'time': post_time
                        })
            except Exception as e:
                logging.error(f"解析帖子时出错: {str(e)}")
                continue
        
        # 按时间倒序排序
        posts.sort(key=lambda x: x['time'], reverse=True)
        
        logging.info(f"获取到 {len(posts)} 条情报板块帖子")
        return posts
    except Exception as e:
        logging.error(f"获取数据失败: {str(e)}")
        return []

# 发送 Telegram 消息
def send_telegram_message(bot_token, chat_id, message):
    logging.info("发送 Telegram 消息...")
    bot = Bot(token=bot_token)
    bot.send_message(chat_id=chat_id, text=message, parse_mode='HTML')

# 在 EMOJI 配置后添加时间转换函数
def format_datetime(datetime_str):
    """将UTC时间转换为上海时间并格式化"""
    try:
        # 解析UTC时间字符串
        utc_time = datetime.strptime(datetime_str, '%Y-%m-%dT%H:%M:%S.%fZ')
        # 设置为UTC时区
        utc_time = utc_time.replace(tzinfo=pytz.UTC)
        # 转换为上海时区
        shanghai_tz = pytz.timezone('Asia/Shanghai')
        shanghai_time = utc_time.astimezone(shanghai_tz)
        # 格式化时间
        return shanghai_time.strftime('%Y-%m-%d %H:%M:%S')
    except Exception as e:
        logging.error(f"时间格式转换失败: {str(e)}")
        return datetime_str

# 运行逻辑
def main():
    logging.info("程序开始运行...")
    try:
        history = load_history()
        posts = fetch_info_posts()
        
        if not posts:
            logging.warning("没有找到任何情报帖子")
            return
        
        new_posts = []
        for post in posts:
            if post['id'] not in history:
                new_posts.append(post)
                history.append(post['id'])
        
        save_history(history)
        
        if new_posts:
            logging.info(f"发现 {len(new_posts)} 条新帖子")
            # 倒序发送消息，最新的最后发送
            for post in reversed(new_posts):
                formatted_time = format_datetime(post['time'])
                message = (f"{EMOJI['NEW']} 监控到新帖子：\n\n"
                          f"<a href='{post['link']}'>{post['title']}</a>\n\n"
                          f"{EMOJI['TIME']} 发布时间: {formatted_time}")
                send_telegram_message(TG_BOT_TOKEN, TG_CHAT_ID, message)
                # 随机延迟0.5-2秒
                time.sleep(random.uniform(0.5, 2))
        else:
            logging.info("没有发现新帖子")
    
    except Exception as e:
        logging.error(f"运行出错: {str(e)}")
    
    logging.info("程序运行结束")

if __name__ == "__main__":
    while True:
        main()
        # 随机延迟检查时间
        wait_time = CHECK_INTERVAL + random.randint(0, CHECK_INTERVAL_RANDOM)
        logging.info(f"等待 {wait_time} 秒后重新检查...")
        time.sleep(wait_time)
