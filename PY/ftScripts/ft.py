#!name=福田抽奖
#!desc=账户密码登陆并抽奖
#!author=Coke🅥
#!date=2025-04-15 19:08:01

import requests
import time
import random
import json
from datetime import datetime
import argparse
import logging
import os
import platform

# 日志配置
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)
log_filename = os.path.join(LOG_DIR, f"ft_{datetime.now().strftime('%Y%m%d')}.log")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_filename, encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ft_logger")

def get_proxy_ip():
    """
    获取代理IP，需用户自定义API地址
    Returns:
        dict: requests库可用的proxies参数字典，如 {'http': 'http://ip:port', 'https': 'http://ip:port'}
    """
    try:
        # 请将此处的 api_url 替换为您自己的代理API地址，例如从您的代理官网获取
        api_url = ""  # 例如: "http://api2.xkdaili.xxxx"
        if not api_url:
            logger.error("未设置代理API地址，请在 get_proxy_ip 函数中填写您的代理API地址")
            return None
        resp = requests.get(api_url, timeout=10)
        resp.raise_for_status()
        ip_port = resp.text.strip()
        if ip_port and ":" in ip_port:
            proxy = f"http://{ip_port}"
            return {"http": proxy, "https": proxy}
        else:
            logger.error(f"获取代理IP失败，返回内容: {resp.text}")
            return None
    except Exception as e:
        logger.error(f"获取代理IP异常: {e}")
        return None

def lucky_draw(encrypt_member_id, activity_num, session_id=None, hwwafsesid=None, hwwafsestime=None, proxies=None):
    """
    执行福田抽奖请求
    新增proxies参数
    """
    url = "https://czyl.foton.com.cn/shareCars/c250401/luckyDraw.action"
    headers = {
        "Host": "czyl.foton.com.cn",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "Sec-Fetch-Site": "same-origin",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Sec-Fetch-Mode": "cors",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://czyl.foton.com.cn",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) ftejIOS",
        "Referer": f"https://czyl.foton.com.cn/shareCars/activity/interactCenter250401/draw.html?memberComplexCode={encrypt_member_id}&memberId=9640865",
        "Connection": "keep-alive",
        "Sec-Fetch-Dest": "empty"
    }
    cookies = []
    if session_id:
        cookies.append(f"SESSION={session_id}")
    if hwwafsesid:
        cookies.append(f"HWWAFSESID={hwwafsesid}")
    if hwwafsestime:
        cookies.append(f"HWWAFSESTIME={hwwafsestime or int(time.time()*1000)}")
    if cookies:
        headers["Cookie"] = "; ".join(cookies)
    data = {
        "encryptMemberId": encrypt_member_id,
        "activityNum": activity_num
    }
    try:
        response = requests.post(url, headers=headers, data=data, proxies=proxies, timeout=15)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"请求错误: {e}")
        return {"msg": f"请求错误: {e}", "code": -999}
    except json.JSONDecodeError:
        logger.error(f"JSON解析错误，响应内容: {response.text}")
        return {"msg": "JSON解析错误", "code": -998}

def pretty_print_json(data):
    """美化打印JSON数据"""
    return json.dumps(data, ensure_ascii=False, indent=2)

def login_and_get_cookies(phone, password):
    """
    登录福田e家并获取必要的Cookie
    
    Args:
        phone: 手机号
        password: 密码
        
    Returns:
        dict: 包含登录信息和Cookie的字典
    """
    login_url = "https://czyl.foton.com.cn/ehomes-new/homeManager/getLoginMember"
    
    headers = {
        "Host": "czyl.foton.com.cn",
        "Content-Type": "application/json;charset=utf-8",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
    }
    
    login_data = {
        "password": password,
        "version_name": "",
        "version_auth": "",
        "device_id": "",
        "device_model": "",
        "ip": "",
        "name": phone,
        "version_code": "180",
        "deviceSystemVersion": "",
        "device_type": "0"
    }
    
    try:
        response = requests.post(login_url, headers=headers, json=login_data)
        response.raise_for_status()
        result = response.json()
        
        if result and result.get("code") == 200:
            
            # 提取Cookie
            cookies = {}
            if 'set-cookie' in response.headers:
                cookie_header = response.headers['set-cookie']
                for cookie in cookie_header.split(';'):
                    if '=' in cookie:
                        name, value = cookie.split('=', 1)
                        cookies[name.strip()] = value.strip()
            
            # 提取登录信息
            login_info = {
                "token": result["data"]["token"],
                "memberComplexCode": result["data"]["memberComplexCode"],
                "uid": result["data"]["uid"],
                "memberID": result["data"]["memberID"],
                "HWWAFSESTIME": cookies.get("HWWAFSESTIME"),
                "HWWAFSESID": cookies.get("HWWAFSESID"),
                "FOTONTGT": result["data"]["ticketValue"]
            }
            
            # 获取SESSION
            session_info = get_session(login_info)
            if session_info:
                login_info.update(session_info)
            
            return login_info
        else:
            logger.error(f"账号 {phone} 登录失败: {result.get('msg', '未知错误')}")
            return None
    except Exception as e:
        logger.error(f"登录异常: {e}")
        return None

def get_session(login_info):
    """
    获取SESSION Cookie
    
    Args:
        login_info: 登录信息字典
        
    Returns:
        dict: 包含SESSION的字典
    """
    url = "https://czyl.foton.com.cn/shareCars/validateToken.action"
    
    headers = {
        "Host": "czyl.foton.com.cn",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Cookie": f"HWWAFSESTIME={login_info.get('HWWAFSESTIME')}; HWWAFSESID={login_info.get('HWWAFSESID')}; FOTONTGT={login_info.get('FOTONTGT')}"
    }
    
    data = {
        "ticketName": "FOTONTGT",
        "ticketValue": login_info.get("FOTONTGT")
    }
    
    try:
        response = requests.post(url, headers=headers, data=data)
        response.raise_for_status()
        
        # 提取SESSION
        cookies = {}
        if 'set-cookie' in response.headers:
            cookie_header = response.headers['set-cookie']
            for cookie in cookie_header.split(';'):
                if '=' in cookie:
                    name, value = cookie.split('=', 1)
                    cookies[name.strip()] = value.strip()
        
        return {
            "SESSION": cookies.get("SESSION"),
            "fullCookie": f"SESSION={cookies.get('SESSION')}; FOTONTGT={login_info.get('FOTONTGT')}; HWWAFSESTIME={login_info.get('HWWAFSESTIME')}; HWWAFSESID={login_info.get('HWWAFSESID')}"
        }
    except Exception as e:
        logger.error(f"获取SESSION异常: {e}")
        return None

def run_smart_lucky_draw(encrypt_member_id, activity_num, session_id=None, hwwafsesid=None, hwwafsestime=None, delay=1, draw_delay_range=(12, 15), proxies=None):
    logger.info(f"开始抽奖 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"会员ID: {encrypt_member_id} 活动编号: {activity_num}")
    print("=" * 60)

    total_attempts = 0

    # 第一次尝试
    print("\n🎲 第 1 次抽奖...")
    result = lucky_draw(encrypt_member_id, activity_num, session_id, hwwafsesid, hwwafsestime, proxies=proxies)
    total_attempts += 1
    logger.info(f"第1次抽奖响应: {pretty_print_json(result)}")

    code = result.get("code")
    has_chance = True

    if code == -1 or "没有抽奖次数" in result.get("msg", ""):
        print("⚠️ 没有抽奖次数，停止抽奖")
        has_chance = False

    # 如果有抽奖机会，继续抽满三次
    if has_chance:
        print("\n✅ 检测到有抽奖机会，继续抽满三次...")
        for i in range(2, 4):  # 再抽两次，总共三次
            actual_delay = random.uniform(*draw_delay_range)
            logger.info(f"等待{actual_delay:.2f}秒后进行第{i}次抽奖")
            time.sleep(actual_delay)
            print(f"\n🎲 第 {i} 次抽奖...")
            result = lucky_draw(encrypt_member_id, activity_num, session_id, hwwafsesid, hwwafsestime, proxies=proxies)
            total_attempts += 1
            logger.info(f"第{i}次抽奖响应: {pretty_print_json(result)}")
            code = result.get("code")
            if code == -1 or "没有抽奖次数" in result.get("msg", ""):
                print("⚠️ 抽奖次数已用完，停止抽奖")
                break

    print("\n" + "=" * 60)
    print(f"🏁 抽奖结束 - ⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

def read_accounts_from_txt(file_path):
    accounts = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or "#" not in line:
                continue
            phone, password = line.split("#", 1)
            accounts.append((phone.strip(), password.strip()))
    return accounts

def display_ascii_title():
    """显示彩色的 Coke ASCII 艺术标题，兼容不同操作系统"""
    system = platform.system()
    if system == "Windows":
        print("   ____       _           ")
        print("  / ___| ___ | | _____    ")
        print(" | |   / _ \\| |/ / _ \\   ")
        print(" | |__| (_) |   <  __/   ")
        print("  \\____\\___/|_|\\_\\___|   ")
        print("                         ")
        try:
            os.system("")
        except:
            pass
    else:
        print("\033[1;31m   ____       _           \033[0m")
        print("\033[1;33m  / ___| ___ | | _____    \033[0m")
        print("\033[1;32m | |   / _ \\| |/ / _ \\   \033[0m")
        print("\033[1;34m | |__| (_) |   <  __/   \033[0m")
        print("\033[1;35m  \\____\\___/|_|\\_\\___|   \033[0m")
        print("\033[1;36m                         \033[0m")

def display_disclaimer():
    """显示更详细的免责条款"""
    system = platform.system()
    disclaimer_text = """
本网站/程序所提供的所有内容仅供学习与参考，不保证其完整性、准确性或适用性，用户需自行判断风险。
使用过程中如涉及第三方资源、网络请求、自动化操作或爬虫行为，请确保用途合法，否则后果自负。
因使用或无法使用本项目所造成的任何损失，我们概不负责。
涉及的数据接口、账号、API等内容为模拟用途，禁止用于商业或非法用途。
除特别声明外，所有内容与代码版权归原作者所有，使用须遵守相关开源协议，禁止擅自传播或商用。
项目可能包含第三方链接，我们不对其合法性与安全性负责。
我们保留随时修改免责声明的权利，用户继续使用视为接受全部条款。
"""
    if system == "Windows":
        print("\n" + "=" * 80)
        print("免责条款:")
        print(disclaimer_text)
        print("=" * 80 + "\n")
    else:
        print("\n" + "=" * 80)
        print("\033[1;33m免责条款:\033[0m")
        print("\033[0;37m" + disclaimer_text + "\033[0m")
        print("=" * 80 + "\n")

def main():
    display_ascii_title()
    display_disclaimer()
    accounts_file = "accounts.txt"
    if not os.path.exists(accounts_file):
        logger.error(f"未找到账号文件: {accounts_file}")
        print(f"未找到账号文件: {accounts_file}")
        if platform.system() == "Windows":
            input("按回车键退出...")
        return

    accounts = read_accounts_from_txt(accounts_file)
    if not accounts:
        logger.error("账号文件中没有有效账号")
        print("账号文件中没有有效账号")
        if platform.system() == "Windows":
            input("按回车键退出...")
        return

    logger.info(f"共读取到{len(accounts)}个账号")
    for idx, (phone, password) in enumerate(accounts, 1):
        # 获取代理IP（必须有，没获取到就跳过本账号）
        proxies = get_proxy_ip()
        if not proxies:
            logger.error(f"账号{phone} 未获取到代理IP，跳过本账号")
            print(f"账号{phone} 未获取到代理IP，跳过本账号")
            continue
        logger.info(f"账号{idx}/{len(accounts)}: {phone} 开始登录")
        logger.info(f"使用代理IP: {proxies['http']}")
        login_info = login_and_get_cookies(phone, password)
        
        if login_info:
            logger.info(f"账号{phone} 登录成功，开始抽奖")
            print(f"✅ 登录成功，获取到会员ID: {login_info['memberComplexCode']}")
            # 运行抽奖（同一个代理IP）
            run_smart_lucky_draw(
                login_info["memberComplexCode"],
                "250401",
                login_info.get("SESSION"),
                login_info.get("HWWAFSESID"),
                login_info.get("HWWAFSESTIME"),
                delay=1,
                draw_delay_range=(12, 15),
                proxies=proxies
            )
        else:
            logger.error(f"账号{phone} 登录失败，跳过抽奖")
        if idx < len(accounts):
            acc_delay = random.uniform(10, 15)
            logger.info(f"账号间延迟{acc_delay:.2f}秒")
            time.sleep(acc_delay)
    
    print("全部任务已完成")
    if platform.system() == "Windows":
        input("按回车键退出...")

if __name__ == "__main__":
    main()
