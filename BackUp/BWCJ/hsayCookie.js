/*
沪上阿姨小程序 Cookie
*/

const cookieName = "hsay";

!(async () => {
    if (typeof $request !== 'undefined') {
        await GetCookie();
    }
})()
    .catch((e) => console.log(e))
    .finally(() => $done());

function GetCookie() {
    try {
        if ($request && $request.headers) {
            const token = $request.headers['Qm-User-Token'] || $request.headers['qm-user-token'];

            if (token) {
                if ($persistentStore.write(token, cookieName)) {
                    $notification.post("沪上阿姨", "", "✅ Cookie获取/更新成功！");
                } else {
                    $notification.post("沪上阿姨", "", "❌ Cookie写入失败，请重试！");
                }
            } else {
                $notification.post("沪上阿姨", "", "❌ 未找到有效的Qm-User-Token，请重试！");
            }

            console.log(`🎯 触发URL: ${$request.url}`);
            console.log(`📝 Token: ${token}`);
        }
    } catch (e) {
        console.log(`❌ Cookie获取失败！原因: ${e}`);
        $notification.post("沪上阿姨", "", "❌ Cookie获取失败，请查看日志！");
    }
}

// prettier-ignore
function Env(t, s) { return new class { constructor(t, s) { this.name = t, this.logs = [], this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, s), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, s) { const e = !this.isSurge() && !this.isQuanX() && !this.isLoon(); e ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(s => setTimeout(s, t)) } done(t = {}) { const s = (new Date).getTime(), e = (s - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, s) }
