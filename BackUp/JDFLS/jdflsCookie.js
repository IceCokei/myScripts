/*
健达福利社 Cookie 获取
*/
const cookieName = "JDFLS";
const urlPattern = /^https:\/\/mole\.ferrero\.com\.cn\/boss\/mp\/login\/taobao\/verify$/;

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
            const token = $request.headers['KUMI-TOKEN'] || $request.headers['kumi-token'];
            const projectId = $request.headers['PROJECT-ID'] || $request.headers['project-id'];

            // 将 token 和 projectId 写入日志
            console.log(`📝 Token: ${token}`);
            console.log(`📝 ProjectId: ${projectId}`);

            if (token && projectId) {
                $httpClient.post({
                    url: $request.url,
                    headers: $request.headers,
                    body: $request.body,
                }, (error, response, body) => {
                    if (error) {
                        console.log(`❌ 请求失败: ${error}`);
                        $notification.post("健达福利社", "", "❌ 请求失败，请查看日志！");
                    } else if (response.status === 200) {
                        try {
                            const data = JSON.parse(body);
                            const memberId = data.data && data.data.memberId;

                            if (memberId) {
                                // 将 token, projectId 和 memberId 组合并存储到 JDFLS
                                const newCookie = `${token}#${projectId}#${memberId}`;
                                if ($persistentStore.write(newCookie, cookieName)) {
                                    $notification.post("健达福利社", "", "✅ Cookie和memberId获取/更新成功！");
                                } else {
                                    $notification.post("健达福利社", "", "❌ Cookie写入失败，请重试！");
                                }
                                console.log(`📝 MemberId: ${memberId}`);
                            } else {
                                console.log("❌ 未找到有效的 memberId 字段");
                                $notification.post("健达福利社", "", "❌ 未找到有效的memberId字段，请重试！");
                            }
                        } catch (e) {
                            console.log(`❌ 解析响应失败: ${e}`);
                            $notification.post("健达福利社", "", "❌ 响应解析失败，请查看日志！");
                        }
                    } else {
                        console.log(`❌ 请求失败，状态码: ${response.status}`);
                        $notification.post("健达福利社", "", "❌ 请求失败，请查看日志！");
                    }
                });
            } else {
                $notification.post("健达福利社", "", "❌ 未找到有效的 token 或 projectId，请重试！");
            }

            console.log(`🎯 触发URL: ${$request.url}`);
        }
    } catch (e) {
        console.log(`❌ Cookie获取失败！原因: ${e}`);
        $notification.post("健达福利社", "", "❌ Cookie获取失败，请查看日志！");
    }
}

// prettier-ignore
function Env(t, s) { return new class { constructor(t, s) { this.name = t, this.logs = [], this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, s), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, s) { const e = !this.isSurge() && !this.isQuanX() && !this.isLoon(); e ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(s => setTimeout(s, t)) } done(t = {}) { const s = (new Date).getTime(), e = (s - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, s) }
