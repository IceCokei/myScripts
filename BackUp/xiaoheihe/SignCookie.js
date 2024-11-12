/*
小黑盒 Cookie
变量名：xiaoheihe
变量值格式：cookie&device_id&heybox_id&version
*/

const cookieName = "xiaoheihe";

!(async () => {
    if (typeof $request !== 'undefined') {
        // 只匹配特定的请求路径
        if ($request.url.indexOf('/task/sign_v3/get_sign_state') > -1 ||
            $request.url.indexOf('/account/get_user_info') > -1) {
            await GetCookie();
        }
    }
})()
    .catch((e) => console.log(e))
    .finally(() => $done());

function GetCookie() {
    try {
        if ($request && $request.headers) {
            const cookie = $request.headers['Cookie'] || $request.headers['cookie'];

            // 检查Cookie格式
            if (!cookie) {
                console.log("❌ 未获取到Cookie");
                $notification.post("小黑盒", "", "❌ 未获取到Cookie，请重新登录");
                return;
            }

            // 检查必要的Cookie项
            const cookieObj = {};
            cookie.split(';').forEach(item => {
                const [key, value] = item.trim().split('=');
                cookieObj[key] = value;
            });

            if (!cookieObj.pkey || !cookieObj.hkey || !cookieObj.x_xhh_tokenid) {
                console.log("❌ Cookie缺少必要项");
                console.log(`pkey: ${!!cookieObj.pkey}`);
                console.log(`hkey: ${!!cookieObj.hkey}`);
                console.log(`x_xhh_tokenid: ${!!cookieObj.x_xhh_tokenid}`);
                $notification.post("小黑盒", "", "❌ Cookie缺少必要项，请重新登录");
                return;
            }

            // 从URL获取参数
            const url = new URL($request.url);
            const params = url.searchParams;

            const device_id = params.get('device_id');
            const heybox_id = params.get('heybox_id');
            const version = params.get('version');

            if (!device_id || !heybox_id || !version) {
                console.log("❌ URL参数不完整");
                console.log(`device_id: ${!!device_id}`);
                console.log(`heybox_id: ${!!heybox_id}`);
                console.log(`version: ${!!version}`);
                $notification.post("小黑盒", "", "❌ URL参数不完整，请重试");
                return;
            }

            // 组合新的Cookie值
            const cookieValue = `${cookie}&${device_id}&${heybox_id}&${version}`;

            // 保存Cookie
            if ($persistentStore.write(cookieValue, cookieName)) {
                console.log("✅ Cookie获取成功");
                console.log(`Cookie: ${cookie}`);
                console.log(`设备ID: ${device_id}`);
                console.log(`用户ID: ${heybox_id}`);
                console.log(`版本: ${version}`);
                $notification.post("小黑盒", "", "✅ Cookie获取成功！");
            } else {
                console.log("❌ Cookie保存失败");
                $notification.post("小黑盒", "", "❌ Cookie保存失败，请重试");
            }
        }
    } catch (e) {
        console.log(`❌ 错误: ${e.message}`);
        $notification.post("小黑盒", "", "❌ 出现错误，请查看日志");
    }
}

// prettier-ignore
function Env(t, s) { return new class { constructor(t, s) { this.name = t, this.logs = [], this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, s), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, s) { const e = !this.isSurge() && !this.isQuanX() && !this.isLoon(); e ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(s => setTimeout(s, t)) } done(t = {}) { const s = (new Date).getTime(), e = (s - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, s) }
