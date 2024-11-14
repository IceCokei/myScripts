/*
七彩虹商城小程序 Cookie
*/

const cookieName = "COLORFUL";
const $ = new Env('七彩虹商城CK');

!(async () => {
    if (typeof $request !== 'undefined') {
        await GetCookie();
    }
})()
    .catch((e) => $.logErr(e))
    .finally(() => $.done());

function GetCookie() {
    try {
        if ($request && $request.headers) {
            // 获取认证信息
            const auth = $request.headers['Authorization'] || $request.headers['authorization'];
            const xAuth = $request.headers['X-Authorization'] || $request.headers['x-authorization'];
            
            if (!auth || !xAuth) {
                $.msg("七彩虹商城", "", "❌ 未找到有效的Authorization信息");
                return;
            }

            // 提取token
            const token = auth.replace('Bearer ', '');
            const refreshToken = xAuth.replace('Bearer ', '');
            
            // 获取现有配置
            let accounts = $.getjson(cookieName) || [];
            
            // 解析JWT获取用户信息
            const userInfo = parseJwt(token);
            const userId = userInfo?.jti || '未知ID';
            const userName = userInfo?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '未知用户';

            // 构建账号数据
            const accountData = {
                id: userName,
                token: token,
                refreshToken: refreshToken,
                body: JSON.stringify({"phone": ""})  // 预留手机号字段
            };

            // 检查是否已存在该账号
            const existingIndex = accounts.findIndex(acc => acc.id === accountData.id);
            
            if (existingIndex !== -1) {
                accounts[existingIndex] = accountData;
                $.msg("七彩虹商城", "", `✅ ${userName} 更新Cookie成功！`);
            } else {
                accounts.push(accountData);
                $.msg("七彩虹商城", "", `✅ ${userName} 添加Cookie成功！`);
            }

            // 保存更新后的配置
            if ($.setjson(accounts, cookieName)) {
                $.log(`🎉 账号数据保存成功`);
            } else {
                $.msg("七彩虹商城", "", "❌ 账号数据保存失败！");
            }

            // 调试信息
            $.log(`🎯 触发URL: ${$request.url}`);
            $.log(`👤 用户信息: ${userName}(${userId})`);
            $.log(`📝 Token: ${token}`);
            $.log(`📝 RefreshToken: ${refreshToken}`);
        }
    } catch (e) {
        $.logErr(`❌ Cookie获取失败！原因: ${e}`);
        $.msg("七彩虹商城", "", "❌ Cookie获取失败，请查看日志！");
    }
}

// JWT解析函数
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        $.logErr(`JWT解析失败: ${e}`);
        return null;
    }
}

// prettier-ignore
function Env(t, s) { return new class { constructor(t, s) { this.name = t, this.logs = [], this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, s), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, s) { const e = !this.isSurge() && !this.isQuanX() && !this.isLoon(); e ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(s => setTimeout(s, t)) } done(t = {}) { const s = (new Date).getTime(), e = (s - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, s) } 
