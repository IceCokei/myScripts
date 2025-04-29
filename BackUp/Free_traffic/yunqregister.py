# -*- coding: utf-8 -*-
# ============================================================
#  yunqregister.py
#  Author: Coke
#  Date:   2025-04-28
#  Introduce:
#      云桥机场自动注册脚本，支持自动发送邮箱验证码、注册账号并输出订阅链接。
#      支持随机User-Agent，兼容多邮箱前缀自动拼接gmail.com。
#      临时邮箱推荐：https://www.emailnator.com/，选择Gmail后获取邮箱前缀使用。「默认@gmail.com后缀的临时邮箱都可以」
#      「预览图：」
# ============================================================

import requests
import time
import json
import random
from http.cookies import SimpleCookie

USER_AGENTS = [
    # 常见移动端和桌面端UA，可自行扩展
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15",
    "Mozilla/5.0 (Linux; Android 13; SM-S9180) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
]

def get_headers(extra=None):
    headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'referer': 'https://www.yunq001.xyz/',
        'origin': 'https://www.yunq001.xyz',
        'dnt': '1',
        'priority': 'u=1, i',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': random.choice(USER_AGENTS)
    }
    if extra:
        headers.update(extra)
    return headers

def send_email_verification(email_prefix):
    url = 'https://www.yunq001.xyz/api/v1/passport/comm/sendEmailVerify'
    headers = get_headers({'content-type': 'application/json'})
    email = f"{email_prefix}@gmail.com"
    data = {"email": email}
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data), timeout=10)
        response.raise_for_status()
        result = response.json()
        if result.get("data") is True:
            print(f"验证码已发送到邮箱：{email}")
        else:
            print(f"发送邮箱验证码失败，返回：{result}")
    except requests.RequestException as error:
        print(f"发送邮箱验证码失败: {error}")

def register_account(email_prefix, password, email_code, invite_code=""):
    url = 'https://www.yunq001.xyz/api/v1/passport/auth/register'
    headers = get_headers({'content-type': 'application/json'})
    email = f"{email_prefix}@gmail.com"
    data = {
        "email": email,
        "password": password,
        "email_code": email_code,
        "invite_code": invite_code
    }
    try:
        response = requests.post(url, headers=headers, data=json.dumps(data), timeout=10)
        response.raise_for_status()
        result = response.json()
        if "data" in result and "token" in result["data"]:
            return {
                "email": email,
                "password": password,
                "token": result["data"]["token"]
            }
        else:
            print(f"注册失败，返回：{result}")
            return None
    except requests.RequestException as error:
        print(f"注册账号失败: {error}")
        return None

def get_user_info(auth_data, cookies):
    url = 'https://www.yunq001.xyz/api/v1/user/info'
    headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'authorization': auth_data,
        'cache-control': 'no-cache',
        'dnt': '1',
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'referer': 'https://www.yunq001.xyz/',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    }
    try:
        response = requests.get(url, headers=headers, cookies=cookies, timeout=10)
        response.raise_for_status()
        user_info = response.json()
        print("用户信息：")
        print(json.dumps(user_info, ensure_ascii=False, indent=2))
        return user_info
    except requests.RequestException as error:
        print(f"获取用户信息失败: {error}")
        return None

def get_subscribe_info(auth_data, cookies):
    url = 'https://www.yunq001.xyz/api/v1/user/getSubscribe'
    headers = {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'authorization': auth_data,
        'cache-control': 'no-cache',
        'dnt': '1',
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'referer': 'https://www.yunq001.xyz/',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    }
    try:
        response = requests.get(url, headers=headers, cookies=cookies, timeout=10)
        response.raise_for_status()
        subscribe_info = response.json()
        print("订阅信息：")
        print(json.dumps(subscribe_info, ensure_ascii=False, indent=2))
        return subscribe_info
    except requests.RequestException as error:
        print(f"获取订阅信息失败: {error}")
        return None

def get_subscribe_url(token):
    return f"https://api-yq.02000.net/api/v1/client/subscribe?token={token}"

if __name__ == "__main__":
    email_prefix = input("请输入邮箱前缀（不含@gmail.com: ").strip()
    send_email_verification(email_prefix)
    email_code = input("请输入邮箱收到的验证码：").strip()
    password = "12345678"  # 可自定义，最少8位
    reg_result = register_account(email_prefix, password, email_code)
    if reg_result:
        subscribe_url = get_subscribe_url(reg_result["token"])
        print("\n注册成功！信息如下：")
        print("====================================")
        print(f"邮箱：{reg_result['email']}")
        print(f"密码：{reg_result['password']}")
        print(f"订阅链接：{subscribe_url}")
        print("====================================\n")
