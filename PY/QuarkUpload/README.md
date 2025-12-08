## QuarkDrive Uploader & Sharer

![Coke](https://img.shields.io/badge/Coke-Tool-blue) ![Python](https://img.shields.io/badge/Python-3.6+-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 功能简介

本项目为 **夸克网盘自动上传与分享脚本**，支持文件自动上传
自动生成分享链接、自动输出最终可用的短链。  
适用于自动化备份、批量分发、网盘分享等多种场景。

---

## 主要特性

- 🚀 **自动上传**：支持大文件分片上传，自动计算哈希，兼容多种文件类型
- 🔗 **自动分享**：上传完成后自动生成分享链接，支持普通链接和短链
- 📋 **自动输出**：自动输出「文件名 分享链接」格式，方便复制粘贴
- 📝 **详细日志**：每一步操作均有详细日志输出，便于排查和追踪
- 💻 **多系统适配**：兼容 Windows、macOS 和 Linux 系统

---

## 常见失败原因

- **目录名需为英文**：上传目录路径请使用英文字符，避免中文或特殊符号。
- **文件需大于 2MB**：文件小于 2MB 可能会被拒绝上传。
- **禁止违规内容**：不要上传违规文件名或违规视频，否则会被平台拦截。
- **接口返回示例**：
  ```json
  { "status": 400, "message":"request cpp error[complete file failed!]" }
  ```

---

## 使用方法

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置参数

编辑 `QuarkUp.py`，填写你的 `file_path`、`cookies`、`pdir_fid` 等必要参数。

```python
# 需要上传的文件路径，用户需自行填写
file_path = ""  # 例如 "/path/to/your/file.mkv"

# pdir_fid 获取方法：
# 1. 在 https://pan.quark.cn 新建或进入目标文件夹
# 2. 浏览器地址栏URL形如：
#    https://pan.quark.cn/list#/list/all/47643a1fd06c449372498374242874-my*101update
# 3. 其中 47643a1fd06c449372498374242874 即为 pdir_fid
pdir_fid = ""  # 例如 "47643a1fd06c449372498374242874"
```

### 3. 运行脚本

```bash
python QuarkUp.py
```

> **说明：**
>
> - Windows 下可直接双击或用 `python QuarkUp.py` 运行。
> - macOS/Linux 下用 `python3 QuarkUp.py` 运行。
> - 路径分隔符请根据系统调整（Windows 用 `\`，macOS/Linux 用 `/`）。

### 4. 查看输出

成功后会输出如下格式：

```
文件名 分享链接：https://pan.quark.cn/s/xxxxxx
```

## 注意事项

- 需自行获取并填写有效的 cookies
- 仅供学习交流使用，请勿用于非法用途
- 若接口变动，请根据实际返回结构适配代码
