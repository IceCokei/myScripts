/**
 * 伊利每日签到 + 抽奖
 * 支持多账户，自动签到并抽奖
 * 
 * 使用方法：
 * 1. 提取 Token：配置重写规则，访问小程序自动获取
 * 2. 签到执行：配置定时任务，每日自动运行
 * 
 * 支持平台：Quantumult X, Loon, Surge
 * 
 * 作者: IceCokei
 * 更新: 2025-05-15
 */

// 跨平台兼容处理
const $ = new Env('伊利安慕希签到');

// 判断当前是否为 Token 提取模式
const isTokenExtraction = typeof $response !== 'undefined' && $response.body;

if (isTokenExtraction) {
    // ================ Token 提取模式 ================
    const body = $response.body;
    let obj;
    try {
        obj = JSON.parse(body || "{}");
    } catch (e) {
        $.log("❌ 解析响应失败");
        $.msg("❌ 伊利 Token", "提取失败", "响应数据解析错误");
        $.done({});
        return;
    }

    const token = obj.token;

    if (!token) {
        $.log("❌ 未获取到 Token");
        $.msg("❌ 伊利 Token", "提取失败", "未找到 token 字段");
        $.done({});
        return;
    }

    // 获取现有的 tokens
    let tokens = $.getdata("Yili_tokens");
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
        $.log(`✅ 更新第 ${existingIndex + 1} 个账号 Token 成功`);
        $.msg("🔄 伊利 Token", `账号 ${existingIndex + 1} 更新成功`, `Token: ${token.substring(0, 10)}...`);
    } else {
        // 添加新 token
        tokenList.push({
            token: token,
            updateTime: new Date().toLocaleString()
        });
        $.log(`✅ 添加第 ${tokenList.length} 个账号 Token 成功`);
        $.msg("➕ 伊利 Token", `账号 ${tokenList.length} 添加成功`, `Token: ${token.substring(0, 10)}...`);
    }

    // 保存 token 列表
    $.setdata(JSON.stringify(tokenList), "Yili_tokens");

    // 同时保存单个 token 以兼容旧版本
    $.setdata(token, "Yili_token");

    $.done({});
} else {
    // ================ 签到执行模式 ================
    // 获取所有账号的 tokens
    let tokens = $.getdata("Yili_tokens");
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
        const singleToken = $.getdata("Yili_token");
        if (singleToken) {
            tokenList.push({ token: singleToken });
        }
    }

    if (tokenList.length === 0) {
        $.log("❌ 未配置任何 Yili_token，请先获取");
        $.msg("❌ 伊利签到失败", "未获取到 Token", "请先登录并获取 Token");
        $.done();
        return;
    }

    $.log(`🔍 共发现 ${tokenList.length} 个账号`);

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
            $.log(`\n⭐ 开始处理账号 ${currentIndex + 1}`);
            processAccount(accountInfo.token, currentIndex + 1, () => {
                currentIndex++;
                processNext();
            });
        } else {
            // 所有账号处理完毕
            $.log("\n✅ 所有账号处理完毕");
            $.done();
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

        $.http.get({
            url: lotteryHistoryUrl,
            headers: headers
        }).then(response => {
            let lotteryHistory;
            try {
                lotteryHistory = JSON.parse(response.body);
            } catch (e) {
                $.log(`⚠️ 账号${accountIndex} 解析抽奖记录失败`);
                signIn(false, null);
                return;
            }

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
            $.log(`⚠️ 账号${accountIndex} 查询抽奖记录失败: ${error}`);
            // 如果查询失败，仍然继续签到流程
            signIn(false, null);
        });
    }

    function signIn(alreadyLotteryToday, todayPrize) {
        const signInUrl = `https://wx-camp-kj-amxapi.mscampapi.digitalyili.com/api/v1/AddSignIn?txstamp=${getTxstamp()}`;
        const signInBody = `code=runsign2025&date=${today}&isBackDate=0`;

        $.http.post({
            url: signInUrl,
            headers: headers,
            body: signInBody
        }).then(response => {
            let signInData;
            try {
                signInData = JSON.parse(response.body);
            } catch (e) {
                $.log(`⚠️ 账号${accountIndex} 解析签到结果失败`);
                callback();
                return;
            }

            if (signInData.code === -100) {
                $.log(`❌ 账号${accountIndex} Token 失效，请更新`);
                $.msg(`❌ 伊利账号${accountIndex}`, "签到失败", "Token 无效，请重新登录获取");
                callback(); // 处理下一个账号
                return;
            }

            // 显示签到结果
            $.log(`✅ 账号${accountIndex} 签到${signInData.code === 0 ? '成功' : '结果'}: ${JSON.stringify(signInData)}`);

            // 如果今天还没抽奖，则进行抽奖
            if (!alreadyLotteryToday) {
                drawLuck();
            } else if (todayPrize) {
                // 如果已经抽过奖，显示今日奖品信息
                $.log(`🎁 账号${accountIndex} 今日已抽奖 - 奖品: ${todayPrize.luckName}`);
                $.msg(`🎁 伊利账号${accountIndex}`, "今日已抽奖", `奖品: ${todayPrize.luckName}`);
                callback(); // 处理下一个账号
            } else {
                callback(); // 处理下一个账号
            }
        }, error => {
            $.log(`⚠️ 账号${accountIndex} 签到请求失败: ${error}`);
            $.msg(`❌ 伊利账号${accountIndex}`, "签到失败", `网络错误: ${error}`);
            callback(); // 处理下一个账号
        });
    }

    function drawLuck() {
        const lotteryUrl = `https://wx-camp-kj-amxapi.mscampapi.digitalyili.com/api/v1/GetBigLuck?txstamp=${getTxstamp()}`;
        const lotteryBody = 'code=runsign2025';

        $.http.post({
            url: lotteryUrl,
            headers: headers,
            body: lotteryBody
        }).then(response => {
            let lotteryData;
            try {
                lotteryData = JSON.parse(response.body);
            } catch (e) {
                $.log(`⚠️ 账号${accountIndex} 解析抽奖结果失败`);
                callback();
                return;
            }

            const prize = lotteryData.uLuck || {};

            $.log(`🎁 账号${accountIndex} 抽奖结果: ${JSON.stringify(lotteryData)}`);
            $.log(`🎉 账号${accountIndex} 伊利抽奖成功 - 奖品: ${prize.luckname || "未知奖品"}, 数量: ${prize.qty || 0}, 概率: ${prize.percentage || "?"}`);

            $.msg(`🎁 伊利账号${accountIndex}`, prize.luckname || "未知奖品", `数量: ${prize.qty || 0}, 概率: ${prize.percentage || "?"}`);
            callback(); // 处理下一个账号
        }, error => {
            $.log(`⚠️ 账号${accountIndex} 抽奖请求失败: ${error}`);
            $.msg(`❌ 伊利账号${accountIndex}`, "抽奖失败", `网络错误: ${error}`);
            callback(); // 处理下一个账号
        });
    }

    // 开始处理当前账号
    checkLotteryHistory();
}

// 环境兼容函数
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, a) => { s.call(this, t, (t, s, r) => { t ? a(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const a = this.getdata(t); if (a) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, a) => e(a)) }) } runScript(t, e) { return new Promise(s => { let a = this.getdata("@chavy_boxjs_userCfgs.httpapi"); a = a ? a.replace(/\n/g, "").trim() : a; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [i, o] = a.split("@"), n = { url: `http://${o}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": i, Accept: "*/*" }, timeout: r }; this.post(n, (t, e, a) => s(a)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), a = !s && this.fs.existsSync(e); if (!s && !a) return {}; { const a = s ? t : e; try { return JSON.parse(this.fs.readFileSync(a)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), a = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : a ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const a = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of a) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, a) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[a + 1]) >> 0 == +e[a + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, a] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, a, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, a, r] = /^@(.*?)\.(.*?)$/.exec(e), i = this.getval(a), o = a ? "null" === i ? null : i || "{}" : "{}"; try { const e = JSON.parse(o); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), a) } catch (e) { const i = {}; this.lodash_set(i, r, t), s = this.setval(JSON.stringify(i), a) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, a) => { !t && s && (s.body = a, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, a) }); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: a, headers: r, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: a, headers: r, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: a, statusCode: r, headers: i, rawBody: o } = t, n = s.decode(o, this.encoding); e(null, { status: a, statusCode: r, headers: i, rawBody: o, body: n }, n) }, t => { const { message: a, response: r } = t; e(a, r, r && s.decode(r.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, a) => { !t && s && (s.body = a, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, a) }); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: a, headers: r, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: a, headers: r, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let a = require("iconv-lite"); this.initGotEnv(t); const { url: r, ...i } = t; this.got[s](r, i).then(t => { const { statusCode: s, statusCode: r, headers: i, rawBody: o } = t, n = a.decode(o, this.encoding); e(null, { status: s, statusCode: r, headers: i, rawBody: o, body: n }, n) }, t => { const { message: s, response: r } = t; e(s, r, r && a.decode(r.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let a = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in a) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? a[e] : ("00" + a[e]).substr(("" + a[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let a = t[s]; null != a && "" !== a && ("object" == typeof a && (a = JSON.stringify(a)), e += `${s}=${a}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", a = "", r) { const i = t => { switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } case "Loon": { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } case "Quantumult X": { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, a = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": a } } case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, a, i(r)); break; case "Quantumult X": $notify(e, s, a, i(r)); break; case "Node.js": }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), a && t.push(a), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, t.stack) } } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; switch (this.log("", `🔔 ${this.name}, 结束! 🕛 ${s} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }
