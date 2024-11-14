/*
健达福利社小程序 Cookie 获取
*/

const cookieName = "JDFLS";
const urlPattern = /^https:\/\/mole\.ferrero\.com\.cn\/boss\/(mp\/login\/taobao\/verify|boss\/hammond\/theme\/page\/get)$/;

!(async () => {
    if (typeof $response !== 'undefined') {
        await ParseResponse();
    }
})()
    .catch((e) => console.log(e))
    .finally(() => $done());

function ParseResponse() {
    try {
        if ($response && $response.body) {
            const body = $response.body;
            const data = JSON.parse(body);

            const memberId = data.data && data.data.memberId;
            const token = $request.headers['KUMI-TOKEN'] || $request.headers['kumi-token'];
            const projectId = $request.headers['PROJECT-ID'] || $request.headers['project-id'];

            console.log(`📝 Token: ${token}`);
            console.log(`📝 ProjectId: ${projectId}`);
            console.log(`📝 MemberId: ${memberId}`);

            if (memberId && token && projectId) {
                const newCookie = `${token}#${projectId}#${memberId}`;
                if ($persistentStore.write(newCookie, cookieName)) {
                    $notification.post("健达福利社", "", "✅ Cookie和memberId获取/更新成功！");
                } else {
                    $notification.post("健达福利社", "", "❌ Cookie写入失败，请重试！");
                }
            } else {
                $notification.post("健达福利社", "", "❌ 未找到有效的token、projectId或memberId，请重试！");
            }
        }
    } catch (e) {
        console.log(`❌ 解析响应失败: ${e}`);
        $notification.post("健达福利社", "", "❌ 响应解析失败，请查看日志！");
    }
}


// prettier-ignore
function Env(t, s) { return new class { constructor(t, s) { this.name = t, this.logs = [], this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, s), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, s) { const e = !this.isSurge() && !this.isQuanX() && !this.isLoon(); e ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(s => setTimeout(s, t)) } done(t = {}) { const s = (new Date).getTime(), e = (s - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, s) }
