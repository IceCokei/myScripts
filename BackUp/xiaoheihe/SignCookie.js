/*
小黑盒 Cookie
变量名：xiaoheihe
变量值格式：cookie&device_id&heybox_id&version
*/

const cookieName = "xiaoheihe";

!(async () => {
    if (typeof $request !== 'undefined') {
        // 修改为只匹配 home_v2 接口
        if ($request.url.indexOf('/account/home_v2') > -1) {
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
            
            // 解析Cookie中的关键参数
            const getCookieValue = (name) => {
                const match = cookie.match(new RegExp(`${name}=([^;]+)`));
                return match ? match[1] : null;
            };

            const pkey = getCookieValue('pkey');
            const x_xhh_tokenid = getCookieValue('x_xhh_tokenid');

            // 检查必要的Cookie项
            if (!cookie || !pkey || !x_xhh_tokenid) {
                console.log("❌ Cookie 缺少必要项");
                $.notify("小黑盒", "", "❌ Cookie 缺少必要项(pkey或x_xhh_tokenid)，请重新获取");
                return;
            }

            // 从URL中获取参数
            const url = new URL($request.url);
            const params = url.searchParams;
            
            // 获取必要参数
            const time = params.get('_time');
            const nonce = params.get('nonce');
            const dw = params.get('dw');
            const x_app = params.get('x_app');
            const hkey = params.get('hkey');
            const os_version = params.get('os_version');
            const lang = params.get('lang');
            const device_id = params.get('device_id');
            const device_info = params.get('device_info');
            const heybox_id = params.get('heybox_id');
            const os_type = params.get('os_type');
            const version = params.get('version');
            const x_client_type = params.get('x_client_type');
            const x_os_type = params.get('x_os_type');

            // 检查必要参数是否都存在
            if (pkey && x_xhh_tokenid && device_id && heybox_id && version && os_type && lang) {
                // 组合所需参数
                const cookieValue = {
                    pkey: pkey,
                    x_xhh_tokenid: x_xhh_tokenid,
                    time: time,
                    nonce: nonce,
                    dw: dw,
                    x_app: x_app,
                    hkey: hkey,
                    os_version: os_version,
                    lang: lang,
                    device_id: device_id,
                    device_info: device_info,
                    heybox_id: heybox_id,
                    os_type: os_type,
                    version: version,
                    x_client_type: x_client_type,
                    x_os_type: x_os_type
                };

                // 获取已存储的Cookie
                const oldCookie = $.read(cookieName);

                if (oldCookie === JSON.stringify(cookieValue)) {
                    console.log("⚠️ Cookie没有变化，无需更新");
                    $.notify("小黑盒", "", "⚠️ Cookie没有变化，无需更新");
                } else {
                    if ($.write(JSON.stringify(cookieValue), cookieName)) {
                        console.log("✅ Cookie获取/更新成功！");
                        $.notify("小黑盒", "", "✅ Cookie获取/更新成功！");
                    } else {
                        console.log("❌ Cookie写入失败，请重试！");
                        $.notify("小黑盒", "", "❌ Cookie写入失败，请重试！");
                    }
                }

                // 打印详细日志
                console.log(`
🎯 触发URL: ${$request.url}
🔐 pkey: ${pkey}
🎫 x_xhh_tokenid: ${x_xhh_tokenid}
⏰ Time: ${time}
🔑 Nonce: ${nonce}
📱 Device Info: ${device_info}
👤 HeyboxID: ${heybox_id}
📦 Version: ${version}
                `);
            } else {
                console.log("❌ 参数不完整，请重试！");
                console.log(`
pkey: ${!!pkey}
x_xhh_tokenid: ${!!x_xhh_tokenid}
device_id: ${!!device_id}
heybox_id: ${!!heybox_id}
version: ${!!version}
os_type: ${!!os_type}
lang: ${!!lang}
                `);
                $.notify("小黑盒", "", "❌ 参数不完整，请重试！");
            }
        }
    } catch (e) {
        console.log(`❌ Cookie获取失败！原因: ${e}`);
        $.notify("小黑盒", "", "❌ Cookie获取失败，请查看日志！");
    }
}

// prettier-ignore
function Env(t, s) { return new class { constructor(t, s) { this.name = t, this.logs = [], this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, s), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, s) { const e = !this.isSurge() && !this.isQuanX() && !this.isLoon(); e ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(s => setTimeout(s, t)) } done(t = {}) { const s = (new Date).getTime(), e = (s - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, s) }
