/*
小黑盒 Cookie
变量名：xiaoheihe
变量值格式：cookie&device_id&heybox_id&version
*/

const cookieName = "xiaoheihe";

!(async () => {
    if (typeof $request !== 'undefined') {
        // 匹配更多接口
        if ($request.url.indexOf('/account/tips_state') > -1 ||
            $request.url.indexOf('/task/sign_v3/get_sign_state') > -1 ||
            $request.url.indexOf('/task/get_sign_version') > -1) {
            await GetCookie();
        }
    }
})()
    .catch((e) => console.log(e))
    .finally(() => $done());

function GetCookie() {
    try {
        if ($request && $request.headers) {
            // 获取Cookie
            const cookie = $request.headers['Cookie'] || $request.headers['cookie'];

            // 检查必要的Cookie项
            if (!cookie || !cookie.includes('pkey=') || !cookie.includes('hkey=') || !cookie.includes('x_xhh_tokenid=')) {
                console.log("❌ Cookie 缺少必要项");
                $notification.post("小黑盒", "", "❌ Cookie 缺少必要项，请重新获取");
                return;
            }

            // 从URL参数中获取其他信息
            const url = new URL($request.url);
            const params = url.searchParams;

            // 获取必要参数
            const device_id = params.get('device_id');
            const heybox_id = params.get('heybox_id');
            const version = params.get('version');
            const build = params.get('build') || '';

            if (cookie && device_id && heybox_id && version) {
                // 组合所需参数
                const cookieValue = `${cookie}&${device_id}&${heybox_id}&${version}`;

                // 获取已存储的Cookie
                const oldCookie = $persistentStore.read(cookieName);

                if (oldCookie === cookieValue) {
                    console.log("⚠️ Cookie没有变化，无需更新");
                    $notification.post("小黑盒", "", "⚠️ Cookie没有变化，无需更新");
                } else {
                    if ($persistentStore.write(cookieValue, cookieName)) {
                        console.log("✅ Cookie获取/更新成功！");
                        $notification.post("小黑盒", "", "✅ Cookie获取/更新成功！");
                    } else {
                        console.log("❌ Cookie写入失败，请重试！");
                        $notification.post("小黑盒", "", "❌ Cookie写入失败，请重试！");
                    }
                }

                // 打印详细日志
                console.log(`
🎯 触发URL: ${$request.url}
📝 Cookie: ${cookie}
📱 DeviceID: ${device_id}
👤 HeyboxID: ${heybox_id}
📦 Version: ${version}
🔐 存储值: ${cookieValue}
                `);
            } else {
                console.log("❌ 参数不完整，请重试！");
                console.log(`
Cookie: ${!!cookie}
DeviceID: ${!!device_id}
HeyboxID: ${!!heybox_id}
Version: ${!!version}
                `);
                $notification.post("小黑盒", "", "❌ 参数不完整，请重试！");
            }
        }
    } catch (e) {
        console.log(`❌ Cookie获取失败！原因: ${e}`);
        $notification.post("小黑盒", "", "❌ Cookie获取失败，请查看日志！");
    }
}

// prettier-ignore
function Env(t, s) { return new class { constructor(t, s) { this.name = t, this.logs = [], this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, s), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, s) { const e = !this.isSurge() && !this.isQuanX() && !this.isLoon(); e ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(s => setTimeout(s, t)) } done(t = {}) { const s = (new Date).getTime(), e = (s - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, s) }
