"""
name = 🏷️喵探烤鱼 签到脚本  
desc = 定时执行签到任务，获取积分奖励 🎯  
author = Coke🆕 [https://github.com/IceCokei]  
date = 2025-2-8  
system = Python  

# 📌 需要替换以下参数:
# - token
# - mpId
# - openId
# - unionId
# - memberId
# 🛠️ 抓包 URL:
# - 公众号服务 > 积分签到
# - https://scrm.wuuxiang.com/crm7game-api/api/game/sign/monthDetail

# - Add 增加JWT时间显示到期 [默认1h29m] 到期
"""

import requests
import json
from datetime import datetime, timezone
import logging
import time
import os

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MiaoTanSign:
    def __init__(self):
        # API配置
        self.base_url = "https://scrm.wuuxiang.com/crm7game-api"
        self.headers = {
            'xcx-version': '21.03.1',
            'content-type': 'application/json',
            'apiCaller': 'wxxcx',
            'pname': 'minigame',
            'Authorization': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJvRVdkUjQwTHI4bTVBZGFnQWM0ZFR0a3pUcDZvIiwiYXBwaWQiOiJ3eDk4YmNkYjM4MTIzODYwOWIiLCJpc3MiOiJtb2JpbGUiLCJleHAiOjE3MzkwMjAxMDMsIm1waWQiOiJnaF9kOWIwODY5MWJkZTQifQ.Mn0tdrwLMeROVbdi_x_esj_zRzi4eEbJa2e8w-nA8xU',
            'X-Requested-With': 'XMLHttpRequest',
            'Tcsl-Shardingfield': 'group_code'
        }
        # 用户信息
        self.user_info = {
            'mpId': 'gh_d9b08691bde4', #替换自己的mpId
            'openId': 'oEWdR40Lr8m5AdagAc4dTtkzTp6o', #替换自己的openId
            'unionId': 'objzM6u_5PGLnUkC3kic9ht8STQA', #替换自己的unionId
            'memberId': '2716268056', #替换自己的memberId
            'gameId': '1000179065' # 固定不变
        }
        
        # Token配置
        self.token_file = "mt_token.json"
        self.token_info = self.load_token()
        if self.token_info:
            self.headers['Authorization'] = self.token_info.get('token', '')
        self.token_warning_shown = False  # 添加标记

    def get_sign_calendar(self):
        """获取月度签到日历"""
        try:
            url = f"{self.base_url}/api/game/sign/monthDetail"
            data = {
                "mpId": self.user_info['mpId'],
                "openId": self.user_info['openId'],
                "unionId": self.user_info['unionId'],
                "data": {
                    "memberId": self.user_info['memberId'],
                    "month": datetime.now().strftime('%Y-%m'),
                    "gameId": self.user_info['gameId']
                }
            }
            response = requests.post(url, headers=self.headers, json=data)
            result = response.json()
            if result['code'] == '200':
                content = json.loads(result['content'])
                logger.info("📅 加载签到日历")
                return content
            return None
        except Exception as e:
            logger.error(f"❌ 获取日历失败: {e}")
            return None

    def get_sign_detail(self):
        """获取签到活动详情"""
        try:
            url = f"{self.base_url}/api/game/sign/detail"
            data = {
                "mpId": self.user_info['mpId'],
                "openId": self.user_info['openId'],
                "unionId": self.user_info['unionId'],
                "data": {
                    "gameId": self.user_info['gameId']
                }
            }
            response = requests.post(url, headers=self.headers, json=data)
            result = response.json()
            if result['code'] == '200':
                content = json.loads(result['content'])
                logger.info(f"🎯 活动: {content.get('name')}")
                return True
            return False
        except Exception as e:
            logger.error(f"❌ 获取活动失败: {e}")
            return False

    def get_sign_survey(self):
        """获取签到统计"""
        try:
            url = f"{self.base_url}/api/member/sign/survey"
            data = {
                "mpId": self.user_info['mpId'],
                "openId": self.user_info['openId'],
                "unionId": self.user_info['unionId'],
                "data": {
                    "memberId": self.user_info['memberId'],
                    "gameId": self.user_info['gameId']
                }
            }
            response = requests.post(url, headers=self.headers, json=data)
            result = response.json()
            if result['code'] == '200':
                content = json.loads(result['content'])
                last_date = content.get('lastSignDate', '无')
                sign_num = content.get('signNum', 0)
                logger.info(f"📊 上次签到: {last_date}, 累计: {sign_num}次")
                return True
            return False
        except Exception as e:
            logger.error(f"❌ 获取统计失败: {e}")
            return False

    def get_member_info(self, with_game=True):
        """获取会员信息"""
        try:
            url = f"{self.base_url}/api/member/single"
            data = {
                "mpId": self.user_info['mpId'],
                "openId": self.user_info['openId'],
                "unionId": self.user_info['unionId']
            }
            if with_game:
                data["data"] = {
                    "gameType": 2,
                    "gameId": self.user_info['gameId']
                }
            else:
                data["data"] = {}
            
            response = requests.post(url, headers=self.headers, json=data)
            result = response.json()
            if result['code'] == '200':
                content = json.loads(result['content'])
                if with_game:
                    logger.info(f"👤 会员积分: {content.get('score', 0)}")
                return True
            return False
        except Exception as e:
            logger.error(f"❌ 获取会员信息失败: {e}")
            return False

    def get_activity_list(self):
        """获取活动列表"""
        try:
            url = f"{self.base_url}/api/game/lot/list"
            data = {
                "mpId": self.user_info['mpId'],
                "openId": self.user_info['openId'],
                "unionId": self.user_info['unionId'],
                "data": {
                    "pageNum": 1,
                    "pageSize": 10
                }
            }
            response = requests.post(url, headers=self.headers, json=data)
            result = response.json()
            if result['code'] == '200':
                content = json.loads(result['content'])
                logger.info("📋 获取活动列表")
                return True
            return False
        except Exception as e:
            logger.error(f"❌ 获取活动列表失败: {e}")
            return False

    def load_sign_page(self):
        """加载签到页面"""
        try:
            # 1. 获取月度签到日历
            calendar = self.get_sign_calendar()
            if not calendar:
                return False
            
            # 2. 获取签到活动详情
            if not self.get_sign_detail():
                return False
                
            # 3. 获取签到统计
            if not self.get_sign_survey():
                return False
                
            # 4. 获取会员信息(带游戏参数)
            if not self.get_member_info(True):
                return False
                
            # 5. 获取活动列表
            if not self.get_activity_list():
                return False
                
            # 6. 获取会员信息(不带参数)
            if not self.get_member_info(False):
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"加载签到页面失败: {e}")
            return False

    def load_token(self):
        """从文件加载token信息"""
        try:
            if os.path.exists(self.token_file):
                with open(self.token_file, 'r') as f:
                    token_info = json.load(f)
                    # 检查token是否过期
                    if self.is_token_valid(token_info.get('token', '')):
                        logger.info("🔑 Token加载成功")
                        return token_info
                    else:
                        logger.error("⚠️ Token已过期，请更新")
            return None
        except Exception as e:
            logger.error(f"❌ 加载Token失败: {e}")
            return None
            
    def save_token(self, token_info):
        """保存token信息到文件"""
        try:
            with open(self.token_file, 'w') as f:
                json.dump(token_info, f)
            logger.info("💾 Token保存成功")
        except Exception as e:
            logger.error(f"❌ 保存Token失败: {e}")
            
    def is_token_valid(self, token):
        """检查token是否有效"""
        try:
            if not token:
                return False
                
            # 解析JWT token
            parts = token.split('.')
            if len(parts) != 3:
                return False
                
            # 解码payload部分
            payload = json.loads(self._base64_decode(parts[1]))
            exp_timestamp = payload.get('exp', 0)
            
            # 检查是否过期
            current_timestamp = int(time.time())
            if current_timestamp >= exp_timestamp:
                if not self.token_warning_shown:
                    logger.error(f"❌ Token已过期 (过期时间: {datetime.fromtimestamp(exp_timestamp).strftime('%Y-%m-%d %H:%M:%S')})")
                    self.token_warning_shown = True
                return False
                
            # 计算剩余时间
            remaining_seconds = exp_timestamp - current_timestamp
            remaining_days = remaining_seconds // 86400
            remaining_hours = (remaining_seconds % 86400) // 3600
            remaining_minutes = (remaining_seconds % 3600) // 60
            
            # 如果还有1天就过期，提醒更新
            if remaining_seconds < 86400:
                if not self.token_warning_shown:
                    logger.warning(f"⚠️ Token即将过期! 剩余时间: {remaining_hours}小时{remaining_minutes}分钟")
                    self.token_warning_shown = True
            else:
                if not self.token_warning_shown:
                    logger.info(f"✅ Token有效期还剩: {remaining_days}天{remaining_hours}小时{remaining_minutes}分钟")
                    self.token_warning_shown = True
                
            return True
        except Exception as e:
            logger.error(f"❌ 检查Token失败: {e}")
            return False
            
    def _base64_decode(self, data):
        """解码base64"""
        import base64
        padding = 4 - (len(data) % 4)
        if padding != 4:
            data += '=' * padding
        return base64.b64decode(data.replace('-', '+').replace('_', '/')).decode('utf-8')
            
    def check_token(self):
        """检查token状态"""
        if not self.is_token_valid(self.headers.get('Authorization')):
            logger.error("🚫 Token无效或已过期，请更新配置中的token")
            return False
        return True
        
    def do_sign(self):
        """执行签到"""
        try:
            # 先检查token
            if not self.check_token():
                return False
                
            # 1. 先获取会员信息，获取cardId和cardNo
            url = f"{self.base_url}/api/member/single"
            data = {
                "mpId": self.user_info['mpId'],
                "openId": self.user_info['openId'],
                "unionId": self.user_info['unionId'],
                "data": {
                    "gameType": 2,
                    "gameId": self.user_info['gameId']
                }
            }
            response = requests.post(url, headers=self.headers, json=data)
            result = response.json()
            if result['code'] != '200':
                logger.error("获取会员信息失败")
                return False
            
            member_info = json.loads(result['content'])
            cardId = member_info.get('cardId')
            cardNo = member_info.get('cardNo')
            
            # 2. 执行签到
            url = f"{self.base_url}/api/game/sign/signIn"
            data = {
                "mpId": self.user_info['mpId'],
                "openId": self.user_info['openId'],
                "unionId": self.user_info['unionId'],
                "data": {
                    "memberId": self.user_info['memberId'],
                    "gameId": self.user_info['gameId'],
                    "cardId": cardId,
                    "cardNo": cardNo,
                    "from": ""
                }
            }
            
            response = requests.post(url, headers=self.headers, json=data)
            result = response.json()
            
            if result['code'] == '200':
                content = json.loads(result['content'])
                if content.get('isScoreSuccess') == 1:
                    logger.info(f"✨ 签到成功! +{content.get('scoreValue')}积分")
                    return True
                else:
                    logger.error(f"❌ {content.get('scoreMsg')}")
            else:
                logger.error(f"❌ {result.get('msg')}")
            return False
            
        except Exception as e:
            logger.error(f"❌ 签到异常: {e}")
            return False

def main():
    mt = MiaoTanSign()
    logger.info("🚀 开始签到流程...")
    
    # 检查token
    if not mt.check_token():
        return
        
    if mt.load_sign_page():
        logger.info("✅ 页面加载完成")
        if mt.do_sign():
            logger.info("🎉 签到完成!")
        else:
            logger.error("💔 签到失败")
    else:
        logger.error("💔 页面加载失败")

if __name__ == "__main__":
    main()
