const cookieName = "bwcj";

!(async () => {
    if (typeof $request !== 'undefined') {
        await ParseRequest();
    }
})()
    .catch((e) => console.log(e))
    .finally(() => $done());

async function ParseRequest() {
    try {
        if ($request && $request.headers) {
            const token = $request.headers['Qm-User-Token'] || $request.headers['qm-user-token'];

            console.log(`📝 Token: ${token}`);

            if (token) {
                if ($persistentStore.write(token, cookieName)) {
                    $notification.post("霸王茶姬", "", "🎉 Cookie获取/更新成功！");
                } else {
                    $notification.post("霸王茶姬", "", "❌ Cookie写入失败，请重试！");
                }
            } else {
                $notification.post("霸王茶姬", "", "❌ 未找到token，请重新登录！");
            }
        }
    } catch (e) {
        console.log(`❌ 解析请求失败: ${e}`);
        $notification.post("霸王茶姬", "", "❌ 请求解析失败，请查看日志！");
    }
}

// prettier-ignore
function Env(t, s) { return new class { constructor(t, s) { this.name = t, this.logs = [], this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, s), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, s) { const e = !this.isSurge() && !this.isQuanX() && !this.isLoon(); e ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(s => setTimeout(s, t)) } done(t = {}) { const s = (new Date).getTime(), e = (s - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, s) }
