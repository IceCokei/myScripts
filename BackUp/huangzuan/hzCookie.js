/*
媓钻小程序 Cookie
*/

const cookieName = "huangzuan";

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
            const auth = $request.headers['Authorization'] || $request.headers['authorization'];

            if (auth) {
                // 移除Bearer前缀并去除空格
                const cleanAuth = auth.replace('Bearer', '').trim();

                if ($persistentStore.write(cleanAuth, cookieName)) {
                    $notification.post("媓钻", "", "✅ Cookie获取/更新成功！");
                } else {
                    $notification.post("媓钻", "", "❌ Cookie写入失败，请重试！");
                }
            } else {
                $notification.post("媓钻", "", "❌ 未找到有效的Authorization，请重试！");
            }

            console.log(`🎯 触发URL: ${$request.url}`);
            console.log(`📝 Auth: ${auth}`);
        }
    } catch (e) {
        console.log(`❌ Cookie获取失败！原因: ${e}`);
        $notification.post("媓钻", "", "❌ Cookie获取失败，请查看日志！");
    }
}

// prettier-ignore
function Env(t, s) { return new class { constructor(t, s) { this.name = t, this.logs = [], this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, s), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, s) { const e = !this.isSurge() && !this.isQuanX() && !this.isLoon(); e ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(s => setTimeout(s, t)) } done(t = {}) { const s = (new Date).getTime(), e = (s - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, s) }