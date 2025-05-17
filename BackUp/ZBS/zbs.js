/*植白说官方商城 
token 抓取及签到脚本

[rewrite_local]
^https:\/\/www\.kozbs\.com\/demo\/wx\/user\/getUserIntegral url script-request-header=zbs.js
^https:\/\/www\.kozbs\.com\/demo\/wx\/home\/sign url script-request-header=zbs.js

[task_local]
15 9 * * * zbs.js, tag=植白说签到, enabled=true

[mitm]
hostname = www.kozbs.com
*/

const $ = new Env('植白说官方商城');
$.version = '1.5';

// 判断是否为 HTTP 请求（抓取 token）
const isRequest = typeof $request !== 'undefined';

if (isRequest) {
    // 抓取 token 逻辑
    if ($request && $request.headers) {
        const token = $request.headers['X-Dts-Token'] || $request.headers['x-dts-token'];
        if (token) {
            let tokens = $.getdata('KOZBS_TOKEN') || '';
            if (!tokens.includes(token)) {
                tokens = tokens ? tokens + '\n' + token : token;
                $.setdata(tokens, 'KOZBS_TOKEN');
                $.msg('植白说', '🎉 恭喜您', '获取 KOZBS_TOKEN 成功');
            }
        }
    }
    $.done({});
} else {
    // 签到逻辑
    !(async () => {
        try {

            $.log(`\n版本号: v${$.version}`);

            // ==== 环境读取
            let kozbsList = $.getdata('KOZBS_TOKEN');
            if (typeof process !== "undefined" && process.env && process.env.KOZBS_TOKEN) {
                kozbsList = process.env.KOZBS_TOKEN;
            }
            kozbsList = kozbsList ? kozbsList.split(/\n|&/) : [];

            const baseUrl = 'https://www.kozbs.com';
            let message = "";

            if (!kozbsList.length) {
                $.log(`❌ 未获取到KOZBS_TOKEN，请先获取Token`);
                $.msg($.name, '❌ 执行失败', '未获取到KOZBS_TOKEN，请先获取Token');
                return $.done();
            }

            $.log(`\n👉 共找到${kozbsList.length}个账号`);

            for (let i = 0; i < kozbsList.length; i++) {
                const currentToken = kozbsList[i];
                $.log(`\n----------- 账号[${i + 1}]开始处理 -----------`);

                // 获取用户信息
                const userInfo = await getUserInfo(baseUrl, currentToken);
                if (userInfo.success) {
                    // 合并账号信息和用户信息到一行
                    message += `🐬 账号${i + 1} | 🐼 ${userInfo.userName} | 🧋 ${userInfo.integer}积分`;
                } else {
                    message += `🐬 账号${i + 1} | ❌ ${userInfo.message}\n`;
                    continue;
                }

                await $.wait(getRandomWait(2000, 2500));

                // 检查签到状态并签到
                const signResult = await signDay(baseUrl, currentToken);
                if (signResult.success) {
                    message += `🎉 ${signResult.message}\n`;
                } else {
                    message += `❌ ${signResult.message}\n`;
                }
            }

            $.msg($.name, '', message);
        } catch (e) {
            $.log(`❌ 执行异常：${e.message}`);
            $.msg($.name, '❌ 执行异常', e.message);
        } finally {
            $.done();
        }
    })();
}

// ===== 工具函数
function getRandomUserAgent() {
    const iosVersions = ['14_0', '14_1', '14_2', '14_3', '14_4', '14_5', '14_6', '14_7', '14_8',
        '15_0', '15_1', '15_2', '15_3', '15_4', '15_5', '15_6',
        '16_0', '16_1', '16_2', '16_3', '16_4', '16_5'];
    const iosVersion = iosVersions[Math.floor(Math.random() * iosVersions.length)];

    const wxVersions = ['7.0.1', '7.0.2', '7.0.3', '7.0.4', '7.0.5', '7.0.6', '7.0.7', '7.0.8', '7.0.9',
        '8.0.1', '8.0.2', '8.0.3', '8.0.4', '8.0.5', '8.0.6', '8.0.7'];
    const wxVersion = wxVersions[Math.floor(Math.random() * wxVersions.length)];

    const wxWorkVersions = ['3.0.16', '3.0.27', '3.0.31', '3.1.0', '3.1.2', '3.1.6', '3.1.10', '3.1.16', '3.1.20'];
    const wxWorkVersion = wxWorkVersions[Math.floor(Math.random() * wxWorkVersions.length)];

    return `Mozilla/5.0 (iPhone; CPU iPhone OS ${iosVersion} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 wxwork/${wxWorkVersion} MicroMessenger/${wxVersion} Language/zh`;
}

function getRandomWait(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 获取用户信息
async function getUserInfo(baseUrl, token) {
    return new Promise((resolve) => {
        const url = `${baseUrl}/demo/wx/user/getUserIntegral`;
        const headers = {
            "xweb_xhr": 1,
            "User-Agent": getRandomUserAgent(),
            "Content-Type": "application/json",
            "Accept": "*/*",
            "Referer": "https://servicewechat.com/wx6b6c5243359fe265/153/page-frame.html",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "x-dts-token": token
        };

        $.get({ url, headers }, (err, resp, data) => {
            try {
                if (err) {
                    $.log(`❌ 获取用户信息异常: ${err}`);
                    resolve({ success: false, message: `获取用户信息异常: ${err}` });
                    return;
                }

                const result = JSON.parse(data);
                if (result.errno !== 0) {
                    $.log(`❌ 用户信息获取失败：${result.errmsg}`);
                    resolve({ success: false, message: `用户信息获取失败：${result.errmsg}` });
                    return;
                }

                const integer = result.data.integer;
                const userName = result.data.list && result.data.list[0] ? result.data.list[0].userName : "未知用户";
                $.log(`✅ 用户：${userName}，当前积分：${integer}`);
                resolve({
                    success: true,
                    userName: userName,
                    integer: integer
                });
            } catch (e) {
                $.log(`❌ 用户信息解析异常: ${e.message}`);
                resolve({ success: false, message: `用户信息解析异常` });
            }
        });
    });
}

// 检查签到状态
async function signDay(baseUrl, token) {
    return new Promise((resolve) => {
        const url = `${baseUrl}/demo/wx/home/signDay`;
        const headers = {
            "xweb_xhr": 1,
            "User-Agent": getRandomUserAgent(),
            "Content-Type": "application/json",
            "Accept": "*/*",
            "Referer": "https://servicewechat.com/wx6b6c5243359fe265/153/page-frame.html",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-CN,zh;q=0.9",
            "x-dts-token": token
        };

        $.get({ url, headers }, async (err, resp, data) => {
            try {
                if (err) {
                    $.log(`❌ 签到状态异常：${err}`);
                    resolve({ success: false, message: `签到状态异常：${err}` });
                    return;
                }

                const result = JSON.parse(data);
                if (result.errno !== 0) {
                    $.log(`❌ 签到状态检查失败：${result.errmsg}`);
                    resolve({ success: false, message: `签到状态检查失败：${result.errmsg}` });
                    return;
                }

                if (result.data.isSign === 1) {
                    $.log(`🎉 今天已经签到过了`);
                    resolve({ success: true, message: `今天已经签到过了` });
                    return;
                }

                // 执行签到
                await $.wait(getRandomWait(2000, 2500));
                const signResult = await sign(baseUrl, headers);
                resolve(signResult);
            } catch (e) {
                $.log(`❌ 签到状态解析异常: ${e.message}`);
                resolve({ success: false, message: `签到状态解析异常` });
            }
        });
    });
}

// 执行签到
async function sign(baseUrl, headers) {
    return new Promise((resolve) => {
        const url = `${baseUrl}/demo/wx/home/sign`;
        // 重新生成随机UA，确保每个请求都有不同的UA
        headers["User-Agent"] = getRandomUserAgent();

        $.get({ url, headers }, (err, resp, data) => {
            try {
                if (err) {
                    $.log(`❌ 签到异常: ${err}`);
                    resolve({ success: false, message: `签到异常: ${err}` });
                    return;
                }

                const result = JSON.parse(data);
                if (result.errno !== 0) {
                    $.log(`❌ 签到失败：${result.errmsg}`);
                    resolve({ success: false, message: `签到失败：${result.errmsg}` });
                } else {
                    $.log(`✅ 签到成功`);
                    resolve({ success: true, message: `签到成功` });
                }
            } catch (e) {
                $.log(`❌ 签到结果解析异常: ${e.message}`);
                resolve({ success: false, message: `签到结果解析异常` });
            }
        });
    });
}

// 环境兼容函数
function Env(t, e) { "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0); class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }