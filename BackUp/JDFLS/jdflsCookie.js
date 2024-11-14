/*
健达福利社 Cookie
*/
const cookieName = "JDFLS";

function GetCookie() {
    try {
        if ($request && $request.headers) {
            const token = $request.headers['KUMI-TOKEN'];
            const projectId = $request.headers['PROJECT-ID'];

            if (token && projectId) {
                const newCookie = `${token}#${projectId}`;

                if ($persistentStore.write(newCookie, cookieName)) {
                    $notification.post("健达福利社", "", "✅ Cookie获取/更新成功！");
                } else {
                    $notification.post("健达福利社", "", "❌ Cookie写入失败，请重试！");
                }
            } else {
                $notification.post("健达福利社", "", "❌ 未找到有效的KUMI-TOKEN或PROJECT-ID，请重试！");
            }

            console.log(`\n🎯 触发URL: ${$request.url}`);
            console.log(`📝 Token: ${token}`);
            console.log(`📝 ProjectId: ${projectId}\n`);
        }
    } catch (e) {
        console.log(`\n❌ Cookie获取失败！原因: ${e}\n`);
        $notification.post("健达福利社", "", "❌ Cookie获取失败，请查看日志！");
    }
}

// prettier-ignore
function Env(t, s) { return new class { constructor(t, s) { this.name = t, this.logs = [], this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, s), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, s) { const e = !this.isSurge() && !this.isQuanX() && !this.isLoon(); e ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(s => setTimeout(s, t)) } done(t = {}) { const s = (new Date).getTime(), e = (s - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, s) }
