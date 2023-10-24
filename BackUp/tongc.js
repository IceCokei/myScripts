/*
 * by：Coke
 * time：2023.10.24 
 * new Env('同程旅行');
 * 捉包，同程旅行APP-我的-里程-去签到。
 * 域名为 https://tcmobileapi.17usoft.com/
 * 可以直接搜signIndex。然后抓请求body中的memberId与token
 * 环境变量: rgnb / token=&memberId=&bz=;
 * 多账号新建变量或者用 ; 分开
 * 软工大神鼎力支持！！！吃水不忘挖井人～
*/


const axios = require('axios');
const util = require('util');

const sleep = util.promisify(setTimeout);

// 获取环境变量的函数
function getEnvVariable(variableName) {
  return process.env[variableName];
}

//  (一言)
async function getYiyan() {
  try {
    const response = await axios.get('https://v1.hitokoto.cn/');
    const data = response.data;
    return `${data.hitokoto} by--${data.from}`;
  } catch (error) {
    print(`获取一言失败: ${error}`, true);
    return '获取一言失败';
  }
}

// 解析 rgnb 变量的函数
function parseRgnb(rgnb) {
  const accountStrings = rgnb.split(';');
  const accountData = [];
  for (const accountString of accountStrings) {
    const parts = accountString.split('&');
    const data = {};
    for (const part of parts) {
      const [key, value] = part.split('=');
      data[key] = value;
    }
    accountData.push({
      account: data.bz || `Account${accountData.length + 1}`,
      memberId: data.memberId,
      token: data.token
    });
  }
  return accountData;
}

// 查询总积分
async function queryGetMonthDetail(memberId) {
  const url = 'https://tcmobileapi.17usoft.com/platformsign/mileage/getMonthDetail';
  const headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    'X-Requested-With': 'com.tongcheng.android'
  };
  const data = {
    memberId: memberId,
    currentPage: 1,
    pageSize: '10',
    platform: 'mileage'
  };
  try {
    const response = await axios.post(url, data, { headers: headers });
    if (response.data.statusCode === 0) {
      const message = response.data.data.balance;
      print(`当前总里程: [${message}]`);
      return message;
    } else {
      print(`查询失败！statusCode: ${response.data.statusCode}, message: ${response.data.message}`);
      return null;
    }
  } catch (error) {
    print(`HTTP请求失败: ${error}`);
    return null;
  }
}

// 执行登陆签到任务
async function signIndexTask(memberId, token, account) {
  const url = 'https://tcmobileapi.17usoft.com/platformsign/sign/signIndex';
  const headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    'X-Requested-With': 'com.tongcheng.android'
  };
  const data = {
    isReceive: 1,
    memberId: memberId,
    platId: 100,
    reqFrom: 'app',
    deviceId: '627ADAB0-FDEC-4C9A-B6E3-1157567D4E44',
    token: token
  };
  try {
    const response = await axios.post(url, data, { headers: headers });
    if (response.data.data && response.data.data.signInfo && response.data.data.signInfo.todayFirstSign !== undefined) {
      if (response.data.data.signInfo.todayFirstSign === 0) {
        const message = response.data.data.signInfo.addMile;
        if (message === 0) {
          print(`签到失败❌: 未获得里程，可能是今天已经签到过了`);
          return false;
        }
        const nowMileageBalance = response.data.data.mileageBalance;
        print(`签到成功: 获得里程数！[${message}]`);
        print(`\n${account.account}当前里程状况：${nowMileageBalance}`);
        return true;
      } else {
        print(`\n当前${account.account}已成功签到，请明天继续！`);
        return true;
      }
    } else {
      if (response.data.message) {
        print(`\n签到失败❌ 原因：${response.data.message}`);
      } else {
        print(`\n签到失败❌ 未知原因，请检查响应：${JSON.stringify(response.data)}`);
      }
      return false;
    }
  } catch (error) {
    print(`HTTP请求失败: ${error}`);
    return false;
  }
}

// 遍历任务列表
async function queryTaskList(memberId) {
  const url = 'https://tcmobileapi.17usoft.com/platformsign/task/queryTaskList';
  const headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    'Origin': 'https://appnew.ly.com',
    'Referer': 'https://appnew.ly.com/',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'Connection': 'keep-alive'
  };
  const data = {
    taskType: 1002,
    memberId: memberId,
    platId: 100,
    reqFrom: 'app',
    limit: 5,
    taskId: 203,
    taskClassify: '1',
  };
  try {
    const response = await axios.post(url, data, { headers: headers });
    const taskList = response.data.data.taskModelList.map(item => ({
      id: item.id,
      description: item.description,
      status: item.btnMsg === '明日再来' ? '完成✅' : item.btnMsg === '去完成' ? '等待任务⏰' : '未知'
    }));
    const accountType = taskList.length === 3 ? '会员' : taskList.length < 3 ? '普通' : '未知';
    return [taskList, accountType];
  } catch (error) {
    print(`HTTP请求失败: ${error}`);
    return [[], '未知'];
  }
}

// 申请和提交任务
async function receiveTaskReward(memberId, token, taskList, account) {
  const url = 'https://tcmobileapi.17usoft.com/platformsign/task/receive';
  const headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    'Origin': 'https://appnew.ly.com',
    'Referer': 'https://appnew.ly.com/',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'Connection': 'keep-alive'
  };
  for (const [i, task] of taskList.entries()) {
    print(`\n开始做第 [${i + 1}] 个任务🍖`);
    print(`任务 ：[${task.description}] 🍕`);
    
    const data = {
      taskId: task.id,
      memberId: memberId,
      token: token
    };
    try {
      const response = await axios.post(url, data, { headers: headers });
      await sleep(randomUniform(1000, 5000));  // Random delay between tasks
      
      if (response.data.statusCode === 0 && response.data.message === '请求成功') {
        print(`[${task.description}]完成✅`);
      } else {
        print(`[${task.description}]失败❌`);
        print(`\n${account.account}当前里程状况：`);  
        await queryGetMonthDetail(memberId);
      }
    } catch (error) {
      print(`HTTP请求失败: ${error}`);
    }
  }
}

// 执行任务列表
async function commitTask(memberId, taskList, account) {
  const url = 'https://tcmobileapi.17usoft.com/platformsign/task/commit';
  const headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    'Origin': 'https://appnew.ly.com',
    'Referer': 'https://appnew.ly.com/',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'Connection': 'keep-alive'
  };
  for (const [i, task] of taskList.entries()) {
    print(`\n开始做第 [${i + 1}] 个任务🍖`);
    print(`任务 ：[${task.description}] 🍕`);
    
    const data = {
      taskId: task.id,
      memberId: memberId,
      reqFrom: 'app',
      platId: 100
    };
    try {
      const response = await axios.post(url, data, { headers: headers });
      await sleep(randomUniform(1000, 5000));  // Random delay between tasks
      
      if (response.data.statusCode === 0) {
        print(`[${task.description}]完成✅`);
      } else {
        print(`[${task.description}]失败❌`);
      }
    } catch (error) {
      print(`HTTP请求失败: ${error}`);
    }
  }
}

// 多账户函数
async function multiAccountOperation(accountData) {
  const startTime = new Date();
  print('同程旅行 🔔 开始运行:\n', true);
  
  // 随机一言
  const yiyan = await getYiyan();
  print(` [一言]: ${yiyan}\n`, true);
  
  print(`共找到${accountData.length}个账号`, true);
  
  for (let i = 0; i < accountData.length; i++) {
    const account = accountData[i];
    print(`\n开始账号${i + 1} 🎉: ${account.account}`, true);

    const memberId = account.memberId;
    const token = account.token;
    
    // 查询任务列表和状态
    const [taskList, accountType] = await queryTaskList(memberId);
    const allTasksCompleted = taskList.every(task => task.status === '完成✅');
    
    if (allTasksCompleted) {
      print(`\n🎉全部浏览任务已完成～无需重复运行脚本！！`, true);
      print(`${account.account}总里程💬：`, true);
      await queryGetMonthDetail(memberId);
      continue;
    }

    print(`${account.account}的初始里程💬：`, true);
    const initialMileage = await queryGetMonthDetail(memberId);
    
    print(`\n开始进行签到任务🚀`, true);
    if (await signIndexTask(memberId, token, account)) {
      print(`${accountType} 账号，获取 ${taskList.length} 个任务`, true);
      
      for (const [i, task] of taskList.entries()) {
        print(`任务 [${i + 1}]: ${task.description} - 状态：${task.status}`, true);
      }
      
      const waitingTasks = taskList.filter(task => task.status === '等待任务⏰');
      if (waitingTasks.length > 0) {
        print(`\n🚀准备开始…`, true);
        await receiveTaskReward(memberId, token, waitingTasks, account);
        await commitTask(memberId, waitingTasks, account);
        print(`${account.account} 任务接口请求完成🏅！`, true);
        await receiveTaskReward(memberId, token, taskList, account);
        print(`${account.account}任务完成里程🎉：`, true);
        const finalMileage = await queryGetMonthDetail(memberId);
        print(`里程增加了：${finalMileage - initialMileage}`, true);
      }
    } else {
      print(`跳过任务处理`, true);
    }
  }

}

// 辅助打印
function print(message) {
  console.log(message);
}

function randomUniform(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 检查青龙环境变量
const rgnb = getEnvVariable('rgnb');
if (!rgnb) {
  print('请设置环境变量名 rgnb\n值 token=?&memberId=?&bz=备注\n多账号使用;分割', true);
  process.exit(1);
}
const accountData = parseRgnb(rgnb);

// 账户任务操作
multiAccountOperation(accountData);