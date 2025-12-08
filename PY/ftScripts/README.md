# 福田 e 家抽奖助手

![Coke](https://img.shields.io/badge/Coke-Tool-blue)
![Python](https://img.shields.io/badge/Python-3.6+-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

一个自动化的福田 e 家抽奖工具，支持多账号、代理 IP 和自定义延迟。

## 功能特点

- ✅ **批量账号处理**：从文本文件批量读取账号信息
- 🔄 **自动登录**：自动完成福田 e 家账号登录流程
- 🎲 **智能抽奖**：自动完成抽奖流程，最多抽满三次
- 🕸️ **代理支持**：每个账号使用独立代理 IP（需自定义代理 API），提高安全性
- ⏱️ **智能延迟**：账号间和抽奖间随机延迟，模拟真实操作
- 📝 **详细日志**：同时输出到控制台和日志文件

## 使用方法

### 1. 准备账号文件

在程序同目录下创建 `accounts.txt` 文件，格式如下：手机号#密码（每行一个账号）

```
13800000000#password1
13900000000#password2
```

### 2. 配置代理 API

本工具不再内置代理 API 地址。请在 `ft.py` 的 `get_proxy_ip` 函数中手动填写您的代理 API 地址。