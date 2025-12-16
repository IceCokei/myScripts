<div align="center">

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)

</div>

## 联通权益超市自动任务脚本

自动完成联通权益超市的每日任务、抽奖和领取奖品。

## 功能特性

- ✅ 自动完成每日任务（浏览、分享等）
- ✅ 自动检查抽奖池并抽奖
- ✅ 自动领取待领取的奖品
- ✅ 支持多账号
- ✅ 支持配置文件和环境变量两种方式

## 快速开始

### 1. 配置账号信息

复制配置模板：
```bash
cp config.example.json config.json
```

编辑 `config.json`，填入你的账号信息：
```json
{
  "accounts": [
    {
      "phone": "18500000000",
      "ecs_token": "你的ecs_token",
      "token_online": "",
      "appId": ""
    }
  ]
}
```

### 2. 运行脚本

```bash
node unicom_task.js
```

## 获取 Cookie 参数

### 方法1: 使用抓包工具（推荐）

1. 使用 Charles、Fiddler 或浏览器开发者工具
2. 打开联通营业厅 APP 或网页版
3. 登录后访问权益超市
4. 找到请求头中的 `Cookie`，提取 `ecs_token` 的值

## 配置说明

### config.json 配置（推荐）

```json
{
  "accounts": [
    {
      "phone": "手机号",
      "ecs_token": "ecs_token值",
      "token_online": "",
      "appId": ""
    }
  ]
}
```

**参数说明：**
- `phone`: 手机号（必填）
- `ecs_token`: 登录凭证（推荐使用）
- `token_online`: 在线登录 token（可选，目前联通限制使用）
- `appId`: 应用 ID（配合 token_online 使用）

### 环境变量配置

如果不想使用配置文件，也可以设置环境变量：

```bash
export UNICOM_ACCOUNTS="手机号#ecs_token"
node unicom_task.js
```

多账号用换行符分隔：
```bash
export UNICOM_ACCOUNTS="手机号1#ecs_token1
手机号2#ecs_token2"
node unicom_task.js
```

## 多账号配置

在 `config.json` 的 `accounts` 数组中添加多个账号：

```json
{
  "accounts": [
    {
      "phone": "18500000000",
      "ecs_token": "token1"
    },
    {
      "phone": "18600000000",
      "ecs_token": "token2"
    }
  ]
}
```

## 注意事项

1. **Cookie 有效期**：ecs_token 通常有效期较长，但仍需定期更新
2. **登录限制**：目前联通系统升级，token_online 登录方式可能受限
3. **抽奖限制**：抽奖次数和奖品库存由联通系统控制
4. **安全提醒**：请妥善保管 config.json，不要泄露给他人

## 文件说明

- `unicom_task.js` - 主脚本
- `config.json` - 配置文件（需自行创建）
- `config.example.json` - 配置模板

## 常见问题

### Q: 提示"获取 ticket 失败"？
A: ecs_token 可能已过期，需要重新获取。

### Q: 提示"登录系统安全升级中"？
A: 使用 ecs_token 方式登录，不要使用 token_online。

### Q: 抽奖提示"库存不足"？
A: 这是正常现象，说明当前奖品池没有可抽的奖品。

### Q: 如何添加多个账号？
A: 在 config.json 的 accounts 数组中添加多个账号对象。

## 更新日志

### v1.0
- 支持 config.json 配置文件
- 优化 HTTP 请求处理
- 修复 302 重定向问题
- 改进错误提示
