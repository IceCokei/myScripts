/*
小黑盒 Cookie
变量名：xiaoheihe
变量值格式：cookie&imei&heybox_id&version
*/

const cookieName = "xiaoheihe";

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
            const cookie = $request.headers['Cookie'] || $request.headers['cookie'];
            const imei = $request.headers['imei'] || '';
            const heybox_id = $request.headers['heybox_id'] || '';
            const version = $request.headers['version'] || '';

            if (cookie) {
                // 组合所需参数
                const cookieValue = `${cookie}&${imei}&${heybox_id}&${version}`;

                // 获取已存储的Cookie
                const oldCookie = $persistentStore.read(cookieName);

                if (oldCookie === cookieValue) {
                    $notification.post("小黑盒", "", "⚠️ Cookie没有变化，无需更新");
                } else if ($persistentStore.write(cookieValue, cookieName)) {
                    $notification.post("小黑盒", "", "✅ Cookie获取/更新成功！");
                } else {
                    $notification.post("小黑盒", "", "❌ Cookie写入失败，请重试！");
                }
            } else {
                $notification.post("小黑盒", "", "❌ 未找到有效的Cookie，请重试！");
            }

            console.log(`🎯 触发URL: ${$request.url}`);
            console.log(`📝 Cookie: ${cookie}`);
            console.log(`📱 IMEI: ${imei}`);
            console.log(`👤 HeyboxID: ${heybox_id}`);
            console.log(`📦 Version: ${version}`);
        }
    } catch (e) {
        console.log(`❌ Cookie获取失败！原因: ${e}`);
        $notification.post("小黑盒", "", "❌ Cookie获取失败，请查看日志！");
    }
}

// prettier-ignore
function Env(t, s) { return new class { constructor(t, s) { this.name = t, this.logs = [], this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, s), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, s) { const e = !this.isSurge() && !this.isQuanX() && !this.isLoon(); e ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(s => setTimeout(s, t)) } done(t = {}) { const s = (new Date).getTime(), e = (s - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, s) }