/**
 * 伊利每日签到 + 抽奖
 * 支持多账户，自动签到并抽奖
 * 
 * 使用方法：
 * 1. 提取 Token：配置重写规则，访问小程序自动获取
 * 2. 签到执行：配置定时任务，每日自动运行
 * 
 * 作者: IceCokei
 * 更新: 2025-05-15
 */

// 判断当前是否为 Token 提取模式
const isTokenExtraction = typeof $response !== 'undefined' && $response.body;

if (isTokenExtraction) {
    // ================ Token 提取模式 ================
    const body = $response.body;
    let obj;
    try {
        obj = JSON.parse(body || "{}");
    } catch (e) {
        console.log("❌ 解析响应失败");
        $notify("❌ 伊利 Token", "提取失败", "响应数据解析错误");
        $done({});
        return;
    }

    const token = obj.token;

    if (!token) {
        console.log("❌ 未获取到 Token");
        $notify("❌ 伊利 Token", "提取失败", "未找到 token 字段");
        $done({});
        return;
    }

    // 获取现有的 tokens
    let tokens = $prefs.valueForKey("Yili_tokens");
    let tokenList = [];

    try {
        if (tokens) {
            tokenList = JSON.parse(tokens);
            if (!Array.isArray(tokenList)) tokenList = [];
        }
    } catch (e) {
        tokenList = [];
    }

    // 检查是否已存在相同 token
    const existingIndex = tokenList.findIndex(t => t.token === token);

    if (existingIndex !== -1) {
        // 更新已存在的 token
        tokenList[existingIndex].token = token;
        tokenList[existingIndex].updateTime = new Date().toLocaleString();
        console.log(`✅ 更新第 ${existingIndex + 1} 个账号 Token 成功`);
        $notify("🔄 伊利 Token", `账号 ${existingIndex + 1} 更新成功`, `Token: ${token.substring(0, 10)}...`);
    } else {
        // 添加新 token
        tokenList.push({
            token: token,
            updateTime: new Date().toLocaleString()
        });
        console.log(`✅ 添加第 ${tokenList.length} 个账号 Token 成功`);
        $notify("➕ 伊利 Token", `账号 ${tokenList.length} 添加成功`, `Token: ${token.substring(0, 10)}...`);
    }

    // 保存 token 列表
    $prefs.setValueForKey(JSON.stringify(tokenList), "Yili_tokens");

    // 同时保存单个 token 以兼容旧版本
    $prefs.setValueForKey(token, "Yili_token");

    $done({});
} else {
    // ================ 签到执行模式 ================
    // 获取所有账号的 tokens
    let tokens = $prefs.valueForKey("Yili_tokens");
    let tokenList = [];

    try {
        if (tokens) {
            tokenList = JSON.parse(tokens);
            if (!Array.isArray(tokenList)) tokenList = [];
        }
    } catch (e) {
        tokenList = [];
    }

    // 如果没有多账号配置，尝试获取单个 token
    if (tokenList.length === 0) {
        const singleToken = $prefs.valueForKey("Yili_token");
        if (singleToken) {
            tokenList.push({ token: singleToken });
        }
    }

    if (tokenList.length === 0) {
        console.log("❌ 未配置任何 Yili_token，请先获取");
        $notify("❌ 伊利签到失败", "未获取到 Token", "请先登录并获取 Token");
        $done();
        return;
    }

    console.log(`🔍 共发现 ${tokenList.length} 个账号`);

    // 处理所有账号
    processAccounts(tokenList);
}

// 处理所有账号
async function processAccounts(tokenList) {
    // 当前处理的账号索引
    let currentIndex = 0;

    // 处理下一个账号
    function processNext() {
        if (currentIndex < tokenList.length) {
            const accountInfo = tokenList[currentIndex];
            console.log(`\n⭐ 开始处理账号 ${currentIndex + 1}`);
            processAccount(accountInfo.token, currentIndex + 1, () => {
                currentIndex++;
                processNext();
            });
        } else {
            // 所有账号处理完毕
            console.log("\n✅ 所有账号处理完毕");
            $done();
        }
    }

    // 开始处理第一个账号
    processNext();
}

// 处理单个账号
function processAccount(token, accountIndex, callback) {
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': token,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        'Referer': 'https://servicewechat.com/wxf2a6206f7e2fd712/725/page-frame.html',
        'Host': 'wx-camp-kj-amxapi.mscampapi.digitalyili.com'
    };

    // 工具函数
    function getTxstamp() {
        return `${Date.now()}_${Math.ceil(Math.random() * 10000000)}`;
    }

    function getTodayDate() {
        const date = new Date();
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const d = date.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    const today = getTodayDate();

    // 先查询今日是否已经抽奖
    function checkLotteryHistory() {
        const lotteryHistoryUrl = `https://wx-camp-kj-amxapi.mscampapi.digitalyili.com/api/v1/GetMyLuckListV2?txstamp=${getTxstamp()}&actCode=runsign2025%2Crunsign2025-5&page=1&limit=100`;

        const req = {
            method: "GET",
            url: lotteryHistoryUrl,
            headers
        };

        $task.fetch(req).then(response => {
            const lotteryHistory = JSON.parse(response.body);

            // 检查是否有今天的抽奖记录
            let alreadyLotteryToday = false;
            let todayPrize = null;

            if (lotteryHistory.code === 0 && lotteryHistory.data && lotteryHistory.data.length > 0) {
                const todayLotteries = lotteryHistory.data.filter(item => {
                    const lotteryDate = item.createdOn.split(' ')[0];
                    return lotteryDate === today;
                });

                if (todayLotteries.length > 0) {
                    alreadyLotteryToday = true;
                    todayPrize = todayLotteries[0];
                }
            }

            // 继续签到流程，并传递抽奖状态
            signIn(alreadyLotteryToday, todayPrize);

        }, error => {
            console.log(`⚠️ 账号${accountIndex} 查询抽奖记录失败: ${error.error}`);
            // 如果查询失败，仍然继续签到流程
            signIn(false, null);
        });
    }

    function signIn(alreadyLotteryToday, todayPrize) {
        const signInUrl = `https://wx-camp-kj-amxapi.mscampapi.digitalyili.com/api/v1/AddSignIn?txstamp=${getTxstamp()}`;
        const signInBody = `code=runsign2025&date=${today}&isBackDate=0`;

        const req = {
            method: "POST",
            url: signInUrl,
            headers,
            body: signInBody
        };

        $task.fetch(req).then(response => {
            const signInData = JSON.parse(response.body);

            if (signInData.code === -100) {
                console.log(`❌ 账号${accountIndex} Token 失效，请更新`);
                $notify(`❌ 伊利账号${accountIndex}`, "签到失败", "Token 无效，请重新登录获取");
                callback(); // 处理下一个账号
                return;
            }

            // 显示签到结果
            console.log(`✅ 账号${accountIndex} 签到${signInData.code === 0 ? '成功' : '结果'}: ${JSON.stringify(signInData)}`);

            // 如果今天还没抽奖，则进行抽奖
            if (!alreadyLotteryToday) {
                drawLuck();
            } else if (todayPrize) {
                // 如果已经抽过奖，显示今日奖品信息
                console.log(`🎁 账号${accountIndex} 今日已抽奖 - 奖品: ${todayPrize.luckName}`);
                $notify(`🎁 伊利账号${accountIndex}`, "今日已抽奖", `奖品: ${todayPrize.luckName}`);
                callback(); // 处理下一个账号
            } else {
                callback(); // 处理下一个账号
            }
        }, error => {
            console.log(`⚠️ 账号${accountIndex} 签到请求失败: ${error.error}`);
            $notify(`❌ 伊利账号${accountIndex}`, "签到失败", `网络错误: ${error.error}`);
            callback(); // 处理下一个账号
        });
    }

    function drawLuck() {
        const lotteryUrl = `https://wx-camp-kj-amxapi.mscampapi.digitalyili.com/api/v1/GetBigLuck?txstamp=${getTxstamp()}`;
        const lotteryBody = 'code=runsign2025';

        const req = {
            method: "POST",
            url: lotteryUrl,
            headers,
            body: lotteryBody
        };

        $task.fetch(req).then(response => {
            const lotteryData = JSON.parse(response.body);
            const prize = lotteryData.uLuck || {};

            console.log(`🎁 账号${accountIndex} 抽奖结果: ${JSON.stringify(lotteryData)}`);
            console.log(`🎉 账号${accountIndex} 伊利抽奖成功 - 奖品: ${prize.luckname || "未知奖品"}, 数量: ${prize.qty || 0}, 概率: ${prize.percentage || "?"}`);

            $notify(`🎁 伊利账号${accountIndex}`, prize.luckname || "未知奖品", `数量: ${prize.qty || 0}, 概率: ${prize.percentage || "?"}`);
            callback(); // 处理下一个账号
        }, error => {
            console.log(`⚠️ 账号${accountIndex} 抽奖请求失败: ${error.error}`);
            $notify(`❌ 伊利账号${accountIndex}`, "抽奖失败", `网络错误: ${error.error}`);
            callback(); // 处理下一个账号
        });
    }

    // 开始处理当前账号
    checkLotteryHistory();
}
