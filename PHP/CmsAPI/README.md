# 🎬 CmsBack API 文档

> 一个功能强大的后端 API，Coke二次开发修改

[![PHP](https://img.shields.io/badge/PHP-7.4+-777BB4?style=flat&logo=php) ](https://www.php.net) [![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE) [![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=flat)](CHANGELOG) [![Status](https://img.shields.io/badge/Status-Active-success?style=flat)](#)

## 📋 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [核心概念](#核心概念)
- [API 接口参考](#api-接口参考)
- [身份验证](#身份验证)
- [错误处理](#错误处理)
- [最佳实践](#最佳实践)

---

## ✨ 功能特性

####   用户系统
- 用户注册与登录认证
- VIP 会员管理
- 积分奖励系统
- 邀请返利机制

####   视频管理
- 视频详情与搜索
- 分类筛选
- 热门排行榜
- 更新日程管理

####  互动功能
- 多级评论系统
- 实时弹幕
- 收藏功能
- 视频求片与更新提醒

####  系统管理
- 广告管理
- 系统公告
- 应用版本更新
- 用户反馈系统

---

## 🚀 快速开始


### 基础用法

```php
// 初始化客户端
$client = new VideoAppAPI();
$client->setToken($auth_token);

// 获取视频详情
$video = $client->vodDetail(['vod_id' => 123]);

// 发表评论
$client->sendComment([
    'vod_id' => 123,
    'comment' => '视频很棒!'
]);
```

---

## 核心概念

####   身份验证

所有需要认证的接口都需要在请求头中包含 `app-user-token`：

```http
POST /api.php/getappapi.index/collect
Authorization: Bearer {auth_token}
app-user-token: {token}
```

### 响应格式

所有响应遵循统一的结构：

```json
{
  "code": 1,
  "msg": "Success",
  "data": "{encrypted_json}"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | int | `1` = 成功, `0` = 失败 |
| `msg` | string | 状态消息 |
| `data` | string | AES-128-CBC 加密的响应数据 |

### 数据加密

所有敏感数据使用 AES-128-CBC 加密：

```javascript
// 解密响应数据
const CryptoJS = require('crypto-js');

const key = CryptoJS.enc.Utf8.parse('your16charkey123');
const decrypted = CryptoJS.AES.decrypt(data, key, {
  iv: key,
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.Pkcs7
});

const parsed = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
```

---

## API 接口参考

### 1. 初始化

####   `GET /api.php/getappapi.index/init`

初始化应用并获取首页所有数据。

**响应示例：**
```json
{
  "code": 1,
  "data": {
    "banner_list": [],
    "recommend_list": [],
    "type_list": [],
    "hot_search_list": [],
    "update": {},
    "notice": {},
    "config": {}
  }
}
```

---

### 2. 视频相关

####   `POST /api.php/getappapi.index/vodDetail`

获取视频详细信息。

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|------|----|------|------|
| vod_id | int | ✅ | 视频 ID |

**响应示例：**
```json
{
  "code": 1,
  "data": {
    "vod": {
      "id": 1,
      "name": "视频标题",
      "intro": "简介",
      "poster": "https://...",
      "play_count": 10000,
      "score": 8.5
    },
    "comment_list": [],
    "vod_play_list": [
      { "name": "高清", "url": "https://..." }
    ],
    "same_list": [],
    "is_collect": false
  }
}
```

####   `POST /api.php/getappapi.index/searchList`

根据关键词搜索视频。

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `keywords` | string | ✅ | 搜索关键词 |
| `page` | int | ✅ | 页码 |
| `type_id` | int | ❌ | 分类 ID |

####   `POST /api.php/getappapi.index/typeFilterVodList`

多条件筛选视频列表。

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `type_id` | int | ✅ | 分类 ID |
| `page` | int | ✅ | 页码 |
| `class` | string | ❌ | 类型（如 "动作"） |
| `area` | string | ❌ | 地区（如 "美国"） |
| `year` | string | ❌ | 年份（如 "2023"） |
| `sort` | string | ❌ | 排序：`newest`/`hottest`/`trending` |

**请求示例：**
```bash
curl -X POST https://api.example.com/vodList \
  -H "Content-Type: application/json" \
  -d '{
    "type_id": 1,
    "area": "美国",
    "year": "2023",
    "sort": "hottest",
    "page": 1
  }'
```

####   `POST /api.php/getappapi.index/rankList`

获取排行榜。

**请求参数：**
| 参数名 | 类型 | 说明 |
|-------|------|------|
| `type_id` | int | 分类 ID |
| `rank_type` | string | `day` / `week` / `month` |

---

### 3. 用户认证

####   `POST /api.php/getappapi.index/appRegister`

注册新用户账号。

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `user_name` | string | ✅ | 用户名 |
| `password` | string | ✅ | 密码 |
| `verify_code` | string | ❌ | 验证码 |

**响应示例：**
```json
{
  "code": 1,
  "data": {
    "user_info": {
      "id": 123,
      "user_name": "john_doe",
      "auth_token": "eyJ0eXAi...",
      "invite_code": "ABC123XYZ"
    }
  }
}
```

####   `POST /api.php/getappapi.index/appLogin`

用户登录。

**请求参数：**
| 参数名 | 类型 | 必填 |
|-------|------|------|
| `user_name` | string | ✅ |
| `password` | string | ✅ |

---

### 4. 收藏功能

####   `POST /api.php/getappapi.index/collect`

添加/取消视频收藏。

**请求参数：**
| 参数名 | 类型 | 必填 |
|-------|------|------|
| `vod_id` | int | ✅ |

**说明：** 自动切换收藏状态

**需要认证：** `app-user-token`

####   `GET /api.php/getappapi.index/collectList`

获取用户收藏的视频列表。

**请求参数：**
| 参数名 | 类型 | 必填 |
|-------|------|------|
| `page` | int | ✅ |

**需要认证：** `app-user-token`

---

### 5. 评论系统

####   `GET /api.php/getappapi.index/commentList`

获取视频评论列表。

**请求参数：**
| 参数名 | 类型 | 必填 |
|-------|------|------|
| `vod_id` | int | ✅ |
| `page` | int | ✅ |

**响应示例：**
```json
{
  "code": 1,
  "data": {
    "comment_list": [
      {
        "id": 1,
        "user": { "id": 123, "name": "user123", "avatar": "..." },
        "content": "很棒的内容！",
        "created_at": "2024-01-15 10:30:00",
        "reply_count": 5
      }
    ],
    "total": 100
  }
}
```

####   `POST /api.php/getappapi.index/sendComment`

发表评论。

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `vod_id` | int | ✅ | 视频 ID |
| `comment` | string | ✅ | 评论内容 |
| `reply_comment_id` | int | ❌ | 父评论 ID（用于回复） |

**安全机制：** 自动过滤敏感词

**需要认证：** `app-user-token`

---

### 6. 弹幕系统

####   `GET /api.php/getappapi.index/danmuList`

获取视频某集的弹幕列表。

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `vod_id` | int | ✅ | 视频 ID |
| `url_position` | int | ✅ | 集数索引 |

####   `POST /api.php/getappapi.index/sendDanmu`

发送弹幕。

**请求参数：**
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| `vod_id` | int | ✅ | 视频 ID |
| `url_position` | int | ✅ | 集数索引 |
| `text` | string | ✅ | 弹幕文本 |
| `color` | string | ✅ | 十六进制颜色（如 `#FFFFFF`） |
| `time` | int | ✅ | 时间（毫秒） |
| `position` | int | ✅ | `0`=滚动 / `1`=顶部 / `2`=底部 |

**弹幕颜色：**
```
#FFFFFF - 白色      #FF0000 - 红色
#00FF00 - 绿色      #0000FF - 蓝色
#FFFF00 - 黄色      #FF00FF - 品红
```

**需要认证：** `app-user-token`

---

### 7. 用户管理

####   `GET /api.php/getappapi.index/userInfo`

获取当前用户信息。

**需要认证：** `app-user-token`

####   `POST /api.php/getappapi.index/modifyPassword`

修改密码。

**请求参数：**
| 参数名 | 类型 | 必填 |
|-------|------|------|
| `old_password` | string | ✅ |
| `new_password` | string | ✅ |

####   `POST /api.php/getappapi.index/appAvatarUpload`

上传用户头像。

**请求参数：**
| 参数名 | 类型 | 必填 |
|-------|------|------|
| `file` | file | ✅ |

---

### 8. 公告通知

####   `GET /api.php/getappapi.index/noticeList`

获取所有公告列表。

**请求参数：**
| 参数名 | 类型 | 必填 |
|-------|------|------|
| `page` | int | ✅ |

####   `GET /api.php/getappapi.index/noticeDetail`

获取公告详情。

**请求参数：**
| 参数名 | 类型 | 必填 |
|-------|------|------|
| `notice_id` | int | ✅ |

---

### 9. 用户反馈

####   `POST /api.php/getappapi.index/suggest`

提交用户反馈。

**请求参数：**
| 参数名 | 类型 | 必填 |
|-------|------|------|
| `content` | string | ✅ |

####   `POST /api.php/getappapi.index/find`

求片功能。

**请求参数：**
| 参数名 | 类型 | 必填 |
|-------|------|------|
| `name` | string | ✅ |
| `remark` | string | ❌ |

####   `POST /api.php/getappapi.index/requestUpdate`

请求视频更新提醒。

**请求参数：**
| 参数名 | 类型 | 必填 |
|-------|------|------|
| `vod_id` | int | ✅ |

---

### 10. 会员系统

####   `GET /api.php/getappapi.index/userVipCenter`

获取 VIP 套餐列表。

**响应示例：**
```json
{
  "code": 1,
  "data": {
    "vip_list": [
      { "id": 1, "name": "VIP 1个月", "price": 9.99 },
      { "id": 2, "name": "VIP 1年", "price": 89.99 }
    ],
    "user_info": { "vip_expired_at": null }
  }
}
```

####   `POST /api.php/getappapi.index/userBuyVip`

购买 VIP 会员。

**请求参数：**
| 参数名 | 类型 | 必填 |
|-------|------|------|
| `package_id` | int | ✅ |

---

### 11. 积分奖励

####   `GET /api.php/getappapi.index/userPointsLogs`

获取积分交易记录。

**请求参数：**
| 参数名 | 类型 | 必填 |
|-------|------|------|
| `page` | int | ✅ |

####   `POST /api.php/getappapi.index/watchRewardAd`

观看激励广告获取积分。

**请求参数：**
| 参数名 | 类型 | 必填 |
|-------|------|------|
| `data` | string | ✅ |

---

##  身份验证

####   Token 流程

```
1. 用户注册/登录
   ↓
2. 服务器返回 auth_token
   ↓
3. 客户端存储 token
   ↓
4. 在所有需要认证的请求头中包含 token：
   Header: app-user-token: {token}
```

### 需要认证的接口

需要认证的接口包括：
- `/collect` - 添加收藏
- `/sendComment` - 发表评论
- `/sendDanmu` - 发送弹幕
- `/userInfo` - 获取用户信息
- `/userPointsLogs` - 积分记录
- `/userVipCenter` - VIP 信息

---

## ⚠️ 错误处理

### 错误码

| 状态码 | HTTP | 含义 |
|--------|------|------|
| `1` | 200 | ✅ 成功 |
| `0` | 400 | ❌ 失败 |
| `-1` | 401 | 🔒 未授权 |
| `-2` | 404 | 📭 未找到 |
| `-3` | 429 | ⏱️ 请求过于频繁 |

### 错误响应示例

```json
{
  "code": 0,
  "msg": "用户名已存在",
  "data": null
}
```

### 推荐的客户端错误处理

```javascript
async function apiCall(endpoint, params) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'app-user-token': localStorage.getItem('token')
      },
      body: JSON.stringify(params)
    });
    
    const result = await response.json();
    
    if (result.code === 1) {
      return decrypt(result.data);
    } else if (result.code === -1) {
      // 处理未授权 - 跳转到登录页
      redirectToLogin();
    } else {
      throw new Error(result.msg);
    }
  } catch (error) {
    console.error('API 错误:', error);
    showErrorToast(error.message);
  }
}
```

---

## 💡 最佳实践

### 1. 缓存策略

```javascript
// 建议缓存这些接口
const CACHE_CONFIG = {
  'init': 5 * 60,        // 5 分钟
  'typeList': 30 * 60,   // 30 分钟
  'rankList': 10 * 60,   // 10 分钟
  'vodDetail': 5 * 60    // 5 分钟（但用户相关数据需绕过缓存）
};
```

### 2. 频率限制

- 对重试实现指数退避
- 缓存频繁访问的数据
- 尽可能批量请求

### 3. 安全性

```javascript
// 始终安全存储 token
// ✅ 推荐：使用安全的 HttpOnly cookie
// ❌ 避免：在 localStorage 存储敏感数据

// ✅ 推荐：仅使用 HTTPS
// ✅ 推荐：验证 SSL 证书
// ✅ 推荐：包含 CSRF 令牌
```

### 4. 性能优化

- 使用数据库连接池
- 为频繁查询的字段添加索引
- 使用 Redis 缓存热数据
- 为图片/视频实现 CDN 分发

### 5. API 分页

所有列表接口都应支持分页：

```javascript
// 默认分页参数
{
  "page": 1,
  "page_size": 20,
  "total": 1000
}
```

---

##  数据库表

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `getapp_user` | 用户账号 | id, auth_token, vip_expired_at |
| `getapp_vod_comment` | 视频评论 | vod_id, user_id, status |
| `getapp_vod_danmu` | 弹幕 | vod_id, time, position |
| `getapp_vod_collect` | 收藏 | user_id, vod_id |
| `getapp_user_suggest` | 用户反馈 | user_id, content |
| `getapp_request_update` | 更新请求 | vod_id, times |

---
