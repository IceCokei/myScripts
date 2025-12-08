<div align="center">

<h1 align="center">ChatGPT Auth Assistant</h1>

"A free ChatGPT authorized robot for deployment, making it easy to manage web page authorization."

一款免费部署你的ChatGPT授权机器人🤖️ 轻松管理网页授权👋。


</div>


### Not in Plan

- I may not update it unless
- have functional needs or continue to consolidate my learning.
- It is for personal practice only."

## 感谢大佬提供的项目🙏
- <p> 此项目开源于 <a class="text-blue-600 dark:text-blue-500" href="https://github.com/Chanzhaoyu/chatgpt-web" target="_blank"> Github </a> ，免费且基于 MIT 协议，没有任何形式的付费行为！ </p>

## 主要功能

- 在 5 分钟内使用 Node PM2 **免费一键部署**
- 精心设计的 UI，响应式设计，支持深色模式，网页ChatGPT体验最好的项目
- 再次感谢大佬提供的项目
#### 机器人功能：
- /start：欢迎提示🔔 
- /info：查询自己信息包含群组注册链接 
- /key：查询当前key[防止新成员看不到历史记录]
- /rekey：判断是否为管理员，重置key并重启服务[同步群组]

#### "Step1:"

```shell
git clone https://github.com/Chanzhaoyu/chatgpt-web.git   #在执行该命令前，需要先安装好 Git 工具。
```

### Node

`node` 需要 `^16 || ^18 || ^19` 版本（`node >= 14` 需要安装 [fetch polyfill](https://github.com/developit/unfetch#usage-as-a-polyfill)），使用 [nvm](https://github.com/nvm-sh/nvm) 可管理本地多个 `node` 版本

```shell
node -v
```

##PM2安装

- 移步这里教程 (https://www.jianshu.com/p/6774903e366a)

### PNPM
如果你没有安装过 `pnpm`
```shell
npm install pnpm -g
```

### 填写密钥 
获取 `Openai Api Key` 或 `accessToken` 并填写本地环境变量 [跳转](#介绍)

##### service/.env 文件 大佬项目下载就能看到这个路径chatgpt-web/service/.env.example 更改为.env
##### 默认的配置详情可以去大佬项目看备注这里不做多余介绍确保你的key填写上
```
# OpenAI API Key - https://platform.openai.com/overview
OPENAI_API_KEY=

```

## 安装依赖

> 为了简便 `后端开发人员` 的了解负担，所以并没有采用前端 `workspace` 模式，而是分文件夹存放。如果只需要前端页面做二次开发，删除 `service` 文件夹即可。

### 后端

进入文件夹 `/service` 运行以下命令

```shell
pnpm install
```

### 前端
根目录下运行以下命令
```shell
pnpm bootstrap
```

## 测试环境运行
### 后端服务

进入文件夹 `/service` 运行以下命令

```shell
pnpm start
```

### 前端网页
项目根目录下运行以下命令
```shell
pnpm dev
```

#### 触发命令看是否可以连通后端和前端 有界面响应即可

- 此时 运行命令下载授权脚本

解释：
如果我的项目路径是 `/Users/coke/network/chatgpt-web-main/service`  那你可以选择直接运行脚本

```
curl https://raw.githubusercontent.com/IceCokei/CokeAuth/main/Authorized.py --output Authorized.py
```

此时你的脚本Authorized.py会在 `/Users/coke/network/chatgpt-web-main/service` 路径下变成

`/Users/coke/network/chatgpt-web-main/service/Authorized.py` 

### 启动后端

保证你的路径是项目/service文件 这点很重要以后你改.env文件都要重启后端
```
pm2 start "pnpm start"
```

### 启动前端

cd 到项目路径 `/Users/coke/network/chatgpt-web-main` 根据自己目录自己改

```
pm2 start "pnpm dev"
```

- 这时候pm2会启动两个进程分别对应前后端
- 现在我们要改我们的脚本

- 打开`Authorized.py` 查看我们要改的地方🈶️五处 

- 分别是：

1.🤖️API_TOKEN

2.-1000000000000 群组ID

3.env_file_path = '/lujing'  `.env路径`

4.user_info_folder = "/lujing"  `user_info 运行脚本在当前目录自己创建这个文件夹存放TG用户信息`

5.ADMIN=自己的TGID 用于识别管理员

- 不知道怎么获取自己的ID去找机器人 

- 搜索getuserIDbot，并点击开始对话，getuserIDbot会发送给你一串数字，就是UserID，即第二个参数”BOT _USER _ID“

![查询ID](https://image.kejiwanjia.com/wp-content/uploads/2021/04/image-20.png)

- 举例：
根据上面的配置我的路径是：
在文件中.env属于隐藏文件 你可以在代码里看到实际上看不到但是只要你目录给对了程序即可修改你的文件
- `env_file_path = '/Users/coke/network/chatgpt-web-main/service/.env'`
- `user_info_folder = "/Users/coke/network/chatgpt-web-main/service/CokeAuth/user_info"`

### 启动授权🤖️脚本
```
#用以下命令在 Python 中安装所需的依赖：
pip install os random string subprocess telebot json time threading
#如果您已经安装了其中一些依赖，也可以只安装未安装的依赖
pip install telebot
#运行脚本
python3 Authorized.py
```
#### 结果总结
- 当你配置好需要改的东西 你的群组会发送一个新密钥来啦的提示🔔 并且包含key
- 会在同级目录创建 `user_info`目录
- 这时候程序会自动找到你的项目路径下的.env文件对`AUTH_SECRET_KEY=`字段匹配并生成32位随机数
- 并添加到你的.env文件中 并且重启你的pm2进程 初始启动只要你不删除都应该是0或1无论哪个先运行效果一样

用户：
- 发送/start 获取欢迎
- 发送/info 自动授权用户并把信息加入到存放的目录包含邀请链接
- 发送/key 在群组里查看当前key是什么 30s自动销毁信息
- 小tips /key仅在群组生效

管理员：
- 与用户命令无差别 只是增加了/rekey 命令 可以随时重置key

原理：
1.发送命令检测是否是管理员
2.如果是开始触发函数寻找你的.env目录进行一次生成随机数替换修改然后发送到群组
3.当发完群组更新后重启你的pm2进程达到同时更换重启



### 一键脚本安装
- 下次一定有
- 说不定是明天

### 图片展示

![ml](https://files.catbox.moe/ssr2dg.png)
