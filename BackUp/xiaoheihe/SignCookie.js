/*
小黑盒 Cookie
变量名：xiaoheihe
变量值格式：cookie&device_id&heybox_id&version
*/

const cookieName = "xiaoheihe";

!(async () => {
    if (typeof $request !== 'undefined') {
        // 只在特定接口获取Cookie
        if ($request.url.indexOf('account/get_async_js') > -1 || 
            $request.url.indexOf('account/ad/get_overall_ad_info') > -1) {
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
            
            // 从URL参数中获取其他信息
            const url = new URL($request.url);
            const params = url.searchParams;
            
            // 获取必要参数
            const heybox_id = params.get('heybox_id') || '';
            const version = params.get('version') || '';
            const device_id = params.get('device_id') || '';
            
            if (cookie && heybox_id && version && device_id) {
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
            } else {
                console.log("❌ 未获取到完整信息，请重试！");
                $notification.post("小黑盒", "", "❌ 未获取到完整信息，请重试！");
            }

            console.log(`🎯 触发URL: ${$request.url}`);
            console.log(`📝 Cookie: ${cookie}`);
            console.log(`📱 DeviceID: ${device_id}`);
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
