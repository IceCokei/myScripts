/**
 * 联通权益超市自动任务脚本 
 * Version: 1.0 -  JavaScript
 * Author: coke
 * Date: 2025-12-16 11:50
 * 
 * 环境变量配置：
 * UNICOM_ACCOUNTS - 账号信息，每行一个账号
 * 格式1: 手机号#ecs_token
 * 格式2: 手机号#token_online#appid
 * 
 * 二改版本 新增配置读取cookie 兼容青龙
 */

const $ = new Env('联通权益超市');

// ======================
// 配置常量
// ======================
const CONFIG = {
  UA: "Mozilla/5.0 (Linux; Android 10; Redmi K30 Pro Build/QKQ1.191117.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/100.0.4896.58 Mobile Safari/537.36 unicom{version:android@11.0500}",
  TIMEOUT: 10000,
  RETRY_DELAY: 1000
};

// ======================
// 主类
// ======================
class ChinaUnicomAPI {
  constructor(accounts) {
    this.accounts = accounts;
  }

  // ======================
  // HTTP 请求封装
  // ======================
  async request(options) {
    const defaultOptions = {
      headers: {
        'User-Agent': CONFIG.UA,
        'Accept': '*/*'
      },
      timeout: CONFIG.TIMEOUT
    };

    const opts = { ...defaultOptions, ...options };
    
    return new Promise((resolve, reject) => {
      const method = opts.method || 'GET';
      
      if (method === 'POST' || method === 'PUT') {
        if (opts.body && typeof opts.body === 'object') {
          // 检查是否是 form 数据
          if (opts.body.token_online) {
            opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            opts.body = Object.keys(opts.body)
              .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(opts.body[key])}`)
              .join('&');
          } else if (!opts.headers['Content-Type'] || opts.headers['Content-Type'].includes('json')) {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(opts.body);
          }
        }
      }

      $[method.toLowerCase()](opts, (error, response, data) => {
        if (error) {
          $.log(`❌ 请求失败: ${error}`);
          reject(error);
        } else {
          resolve({ response, data });
        }
      });
    });
  }

  // ======================
  // token_online 登录
  // ======================
  async loginWithTokenOnline(phone, tokenOnline, appId) {
    $.log(`[${phone}] 开始 token_online 登录...`);
    
    const options = {
      url: 'https://m.client.10010.com/mobileService/onLine.htm',
      method: 'POST',
      headers: {
        'User-Agent': CONFIG.UA,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: {
        reqtime: Date.now().toString(),
        netWay: 'Wifi',
        version: 'android@11.0000',
        token_online: tokenOnline,
        appId: appId,
        deviceModel: 'Mi10',
        step: 'welcome',
        androidId: 'e1d2c3b4a5f6'
      }
    };

    try {
      const { data } = await this.request(options);
      const json = JSON.parse(data);
      
      if (json.ecs_token) {
        $.log(`✔ [${phone}] token 登录成功`);
        return json.ecs_token;
      }
      
      $.log(`❌ [${phone}] token 登录失败`);
      return null;
    } catch (error) {
      $.log(`❌ [${phone}] 登录异常: ${error}`);
      return null;
    }
  }

  // ======================
  // 获取 ticket
  // ======================
  async getTicket(ecsToken) {
    $.log('正在获取 ticket...');
    
    return new Promise((resolve) => {
      const https = require('https');
      const url = require('url');
      
      const reqUrl = `https://m.client.10010.com/mobileService/openPlatform/openPlatLine.htm?to_url=https://contact.bol.wo.cn/market&reqtime=${Date.now()}&version=android@11.0500`;
      const urlObj = url.parse(reqUrl);
      
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.path,
        method: 'GET',
        headers: {
          'User-Agent': CONFIG.UA,
          'X-Requested-With': 'com.sinovatech.unicom.ui',
          'Origin': 'https://img.client.10010.com',
          'Referer': 'https://img.client.10010.com/',
          'Cookie': `ecs_token=${ecsToken}`
        }
      };
      
      const req = https.request(options, (res) => {
        const location = res.headers['location'] || res.headers['Location'];
        
        if (!location) {
          $.log('❌ 无法获取跳转链接（无 Location）');
          resolve(null);
          return;
        }

        const ticketMatch = location.match(/ticket=([^&]+)/);
        if (ticketMatch) {
          $.log('✔ ticket 获取成功');
          resolve(ticketMatch[1]);
        } else {
          $.log('❌ 从 Location 中解析 ticket 失败');
          resolve(null);
        }
      });
      
      req.on('error', (error) => {
        $.log(`❌ 获取 ticket 失败: ${error}`);
        resolve(null);
      });
      
      req.end();
    });
  }

  // ======================
  // 获取 userToken
  // ======================
  async getUserToken(ticket) {
    $.log('正在获取 userToken...');
    
    const options = {
      url: `https://backward.bol.wo.cn/prod-api/auth/marketUnicomLogin?ticket=${ticket}`,
      method: 'POST',
      headers: {
        'User-Agent': CONFIG.UA
      }
    };

    try {
      const { data } = await this.request(options);
      const json = JSON.parse(data);
      
      if (json.data && json.data.token) {
        $.log('✔ userToken 获取成功');
        return json.data.token;
      }
      
      $.log('❌ userToken 获取失败');
      return null;
    } catch (error) {
      $.log(`❌ 获取 userToken 异常: ${error}`);
      return null;
    }
  }

  // ======================
  // 获取任务列表
  // ======================
  async getTasks(ecsToken, userToken) {
    const options = {
      url: 'https://backward.bol.wo.cn/prod-api/promotion/activityTask/getAllActivityTasks?activityId=12',
      method: 'GET',
      headers: {
        'User-Agent': CONFIG.UA,
        'Authorization': `Bearer ${userToken}`,
        'Cookie': `ecs_token=${ecsToken}`
      }
    };

    try {
      const { data } = await this.request(options);
      const json = JSON.parse(data);
      return json.data?.activityTaskUserDetailVOList || [];
    } catch (error) {
      $.log(`❌ 获取任务列表失败: ${error}`);
      return [];
    }
  }

  // ======================
  // 执行单个任务
  // ======================
  async runTask(task, userToken) {
    const name = task.name || '';
    const param = task.param1;
    const target = parseInt(task.triggerTime || 1);
    const done = parseInt(task.triggeredTime || 0);

    // 跳过购买/秒杀任务
    if (name.includes('购买') || name.includes('秒杀')) {
      $.log(`[跳过复杂任务] ${name}`);
      return;
    }

    if (done >= target) {
      $.log(`✔ 任务已完成：${name}`);
      return;
    }

    // 判断任务类型
    let api;
    if (name.includes('浏览') || name.includes('查看')) {
      api = 'checkView';
    } else if (name.includes('分享')) {
      api = 'checkShare';
    } else {
      $.log(`⚠ 无法识别任务类型：${name}`);
      return;
    }

    const options = {
      url: `https://backward.bol.wo.cn/prod-api/promotion/activityTaskShare/${api}?checkKey=${param}`,
      method: 'POST',
      headers: {
        'User-Agent': CONFIG.UA,
        'Authorization': `Bearer ${userToken}`
      }
    };

    try {
      const { data } = await this.request(options);
      const json = JSON.parse(data);
      
      if (json.code === 200) {
        $.log(`✔ 任务完成：${name}`);
      } else {
        $.log(`❌ 任务失败：${name}`);
      }
    } catch (error) {
      $.log(`❌ 执行任务异常：${name}`);
    }

    await $.wait(1000);
  }

  // ======================
  // 检查抽奖池
  // ======================
  async checkRaffle(userToken) {
    const options = {
      url: 'https://backward.bol.wo.cn/prod-api/promotion/home/raffleActivity/prizeList?id=12',
      method: 'POST',
      headers: {
        'User-Agent': CONFIG.UA,
        'Authorization': `Bearer ${userToken}`
      }
    };

    try {
      const { data } = await this.request(options);
      const json = JSON.parse(data);
      const prizeList = json.data || [];
      
      // 判断是否有"月卡"、"月会员"等奖品
      const hasLive = prizeList.some(p => (p.name || '').includes('月'));
      return hasLive;
    } catch (error) {
      $.log(`❌ 检查抽奖池失败: ${error}`);
      return false;
    }
  }

  // ======================
  // 执行抽奖
  // ======================
  async raffle(userToken) {
    // 获取抽奖次数
    const countOptions = {
      url: 'https://backward.bol.wo.cn/prod-api/promotion/home/raffleActivity/getUserRaffleCount?id=12',
      method: 'POST',
      headers: {
        'User-Agent': CONFIG.UA,
        'Authorization': `Bearer ${userToken}`
      }
    };

    try {
      const { data } = await this.request(countOptions);
      const json = JSON.parse(data);
      const count = json.data || 0;
      
      $.log(`🎟 当前剩余抽奖次数：${count}`);

      for (let i = 0; i < count; i++) {
        await this.raffleOnce(userToken);
        await $.wait(1000);
      }
    } catch (error) {
      $.log(`❌ 获取抽奖次数失败: ${error}`);
    }
  }

  // ======================
  // 执行一次抽奖
  // ======================
  async raffleOnce(userToken) {
    const options = {
      url: 'https://backward.bol.wo.cn/prod-api/promotion/home/raffleActivity/userRaffle?id=12&channel=',
      method: 'POST',
      headers: {
        'User-Agent': CONFIG.UA,
        'Authorization': `Bearer ${userToken}`
      }
    };

    try {
      const { data } = await this.request(options);
      const json = JSON.parse(data);
      
      if (json.code === 200) {
        const prize = json.data?.prizesName || json.data?.message || '未知';
        $.log(`🎁 抽奖结果：${prize}`);
      } else {
        $.log(`❌ 抽奖失败: ${json.message || '未知错误'}`);
      }
    } catch (error) {
      $.log(`❌ 抽奖异常: ${error}`);
    }
  }

  // ======================
  // 查询待领奖品
  // ======================
  async getPendingPrizes(userToken) {
    const options = {
      url: 'https://backward.bol.wo.cn/prod-api/promotion/home/raffleActivity/getMyPrize',
      method: 'POST',
      headers: {
        'User-Agent': CONFIG.UA,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        id: 12,
        type: 0,
        page: 1,
        limit: 100
      }
    };

    try {
      const { data } = await this.request(options);
      const json = JSON.parse(data);
      return json.data?.list || [];
    } catch (error) {
      $.log(`❌ 查询待领奖品失败: ${error}`);
      return [];
    }
  }

  // ======================
  // 领取奖品
  // ======================
  async grantPrize(userToken, recordId, prizeName) {
    const options = {
      url: 'https://backward.bol.wo.cn/prod-api/promotion/home/raffleActivity/grantPrize?activityId=12',
      method: 'POST',
      headers: {
        'User-Agent': CONFIG.UA,
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: { recordId }
    };

    try {
      const { data } = await this.request(options);
      const json = JSON.parse(data);
      
      if (json.code === 200) {
        $.log(`🎉 奖品领取成功：${prizeName}`);
      } else {
        $.log(`❌ 领奖失败：${prizeName}`);
      }
    } catch (error) {
      $.log(`❌ 领奖异常：${prizeName}`);
    }
  }

  // ======================
  // 单账号完整流程
  // ======================
  async runAccount(phone, ecsToken = null, tokenOnline = null, appId = null) {
    $.log(`\n========== 开始处理账号：${phone} ==========`);

    // 登录
    let finalToken = ecsToken;
    if (!finalToken) {
      finalToken = await this.loginWithTokenOnline(phone, tokenOnline, appId);
      if (!finalToken) return;
    }

    // 获取 ticket
    const ticket = await this.getTicket(finalToken);
    if (!ticket) {
      $.log('❌ 获取 ticket 失败');
      return;
    }

    // 获取 userToken
    const userToken = await this.getUserToken(ticket);
    if (!userToken) {
      $.log('❌ 获取 userToken 失败');
      return;
    }

    // 执行任务
    $.log('\n--- 开始执行任务 ---');
    const tasks = await this.getTasks(finalToken, userToken);
    for (const task of tasks) {
      await this.runTask(task, userToken);
    }

    // 检查抽奖池
    $.log('\n--- 检查抽奖池 ---');
    const hasLive = await this.checkRaffle(userToken);
    if (hasLive) {
      $.log('✔ 抽奖池已放水，开始抽奖');
      await this.raffle(userToken);
    } else {
      $.log('❌ 今日未放水，跳过抽奖');
    }

    // 领取奖品
    $.log('\n--- 领取奖品 ---');
    const pending = await this.getPendingPrizes(userToken);
    if (pending.length > 0) {
      $.log(`发现 ${pending.length} 个待领取奖品`);
      for (const item of pending) {
        await this.grantPrize(userToken, item.id, item.prizesName);
        await $.wait(500);
      }
    } else {
      $.log('暂无待领取奖品');
    }

    $.log(`========== 账号 ${phone} 处理完成 ==========\n`);
  }

  // ======================
  // 主程序
  // ======================
  async run() {
    for (const account of this.accounts) {
      const parts = account.split('#');
      const phone = parts[0];

      if (parts.length === 2) {
        await this.runAccount(phone, parts[1]);
      } else if (parts.length >= 3) {
        await this.runAccount(phone, null, parts[1], parts[2]);
      }

      await $.wait(3000);
    }

    $.done();
  }
}

// ======================
// 环境适配层
// ======================
function Env(name) {
  return new class {
    constructor(name) {
      this.name = name;
      this.logs = [];
      this.startTime = Date.now();
      
      this.isNode = typeof module !== 'undefined' && !!module.exports;
      this.isQuanX = typeof $task !== 'undefined';
      this.isSurge = typeof $httpClient !== 'undefined' && !this.isQuanX;
      this.isLoon = typeof $loon !== 'undefined';
    }

    log(...args) {
      const msg = args.join(' ');
      console.log(msg);
      this.logs.push(msg);
    }

    get(options, callback = () => {}) {
      if (this.isNode) {
        const https = require('https');
        const url = require('url');
        const urlObj = typeof options === 'string' ? url.parse(options) : url.parse(options.url);
        
        const req = https.request({
          hostname: urlObj.hostname,
          port: urlObj.port || 443,
          path: urlObj.path,
          method: 'GET',
          headers: options.headers || {}
        }, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => callback(null, res, data));
        });
        
        req.on('error', err => callback(err));
        req.end();
      } else if (this.isSurge || this.isLoon) {
        $httpClient.get(options, callback);
      } else if (this.isQuanX) {
        options.method = 'GET';
        $task.fetch(options).then(
          resp => callback(null, resp, resp.body),
          err => callback(err)
        );
      }
    }

    post(options, callback = () => {}) {
      if (this.isNode) {
        const https = require('https');
        const url = require('url');
        const urlObj = url.parse(options.url);
        
        const req = https.request({
          hostname: urlObj.hostname,
          port: urlObj.port || 443,
          path: urlObj.path,
          method: 'POST',
          headers: options.headers || {}
        }, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => callback(null, res, data));
        });
        
        req.on('error', err => callback(err));
        if (options.body) req.write(options.body);
        req.end();
      } else if (this.isSurge || this.isLoon) {
        $httpClient.post(options, callback);
      } else if (this.isQuanX) {
        options.method = 'POST';
        $task.fetch(options).then(
          resp => callback(null, resp, resp.body),
          err => callback(err)
        );
      }
    }

    wait(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    done(value = {}) {
      const endTime = Date.now();
      const duration = (endTime - this.startTime) / 1000;
      this.log(`\n⏱ 脚本运行时长: ${duration.toFixed(2)} 秒`);
      
      if (this.isNode) {
        process.exit(0);
      } else if (this.isQuanX || this.isSurge || this.isLoon) {
        $done(value);
      }
    }
  }(name);
}

// ======================
// 读取配置文件
// ======================
function loadConfig() {
  const fs = require('fs');
  const path = require('path');
  const configPath = path.join(__dirname, 'config.json');
  
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (config.accounts && config.accounts.length > 0) {
        $.log(`✔ 从 config.json 读取到 ${config.accounts.length} 个账号`);
        
        // 转换为脚本需要的格式
        const accounts = config.accounts.map(acc => {
          if (acc.ecs_token) {
            return `${acc.phone}#${acc.ecs_token}`;
          } else if (acc.token_online && acc.appId) {
            return `${acc.phone}#${acc.token_online}#${acc.appId}`;
          }
          return null;
        }).filter(Boolean);
        
        return accounts;
      }
    }
  } catch (error) {
    $.log(`⚠ 读取 config.json 失败: ${error.message}`);
  }
  
  return null;
}

// ======================
// 主程序入口
// ======================
(async () => {
  let accounts = [];
  
  // 优先从 config.json 读取
  const configAccounts = loadConfig();
  if (configAccounts && configAccounts.length > 0) {
    accounts = configAccounts;
  } else {
    // 从环境变量读取
    const accountsStr = process.env.UNICOM_ACCOUNTS || '';
    
    if (!accountsStr) {
      $.log('❌ 未找到账号配置');
      $.log('');
      $.log('请使用以下任一方式配置账号：');
      $.log('');
      $.log('方式1: 编辑 config.json 文件');
      $.log('  {');
      $.log('    "accounts": [');
      $.log('      {');
      $.log('        "phone": "手机号",');
      $.log('        "ecs_token": "你的ecs_token"');
      $.log('      }');
      $.log('    ]');
      $.log('  }');
      $.log('');
      $.log('方式2: 设置环境变量 UNICOM_ACCOUNTS');
      $.log('  格式: 手机号#ecs_token');
      $.log('  或: 手机号#token_online#appid');
      $.done();
      return;
    }
    
    accounts = accountsStr.split('\n').filter(line => line.trim());
  }

  const api = new ChinaUnicomAPI(accounts);
  await api.run();
})();