/*
小黑盒 Cookie
变量名：xiaoheihe
变量值格式：cookie&os_version&x_os_type&hkey&_time&x_client_type&device_info&version&lang&x_app&nonce&heybox_id&dw&os_type&device_id&x_xhh_tokenid&pkey
*/

const $ = new Env('xiaoheihe');
const cookieName = "xiaoheihe";

console.log('脚本开始执行');

!(async () => {
    if (typeof $request !== 'undefined') {
        console.log('检测到请求:', $request.url);
        
        if ($request.url.indexOf('/account/home_v2') > -1) {
            await GetCookie();
        }
    }
})()
    .catch((e) => {
        console.log('脚本执行出错:', e);
        $.msg($.name, '❌执行失败', e.message || e);
    })
    .finally(() => $done());

function GetCookie() {
    try {
        if ($request && $request.headers) {
            // 获取Cookie
            const cookie = $request.headers['Cookie'] || $request.headers['cookie'];
            console.log('获取到的Cookie:', cookie);

            // 解析Cookie中的关键参数
            const getCookieValue = (name) => {
                const match = cookie.match(new RegExp(`${name}=([^;]+)`));
                return match ? match[1] : null;
            };

            const pkey = getCookieValue('pkey');
            const x_xhh_tokenid = getCookieValue('x_xhh_tokenid');

            // 从URL中获取参数
            const urlParams = {};
            const queryString = $request.url.split('?')[1];
            if (queryString) {
                queryString.split('&').forEach(item => {
                    const [key, value] = item.split('=');
                    urlParams[key] = decodeURIComponent(value);
                });
            }
            console.log('URL参数:', JSON.stringify(urlParams));

            // 获取所有必要参数
            const os_version = urlParams['os_version'];
            const x_os_type = urlParams['x_os_type'];
            const hkey = urlParams['hkey'];
            const _time = urlParams['_time'];
            const x_client_type = urlParams['x_client_type'];
            const device_info = urlParams['device_info'];
            const version = urlParams['version'];
            const lang = urlParams['lang'];
            const x_app = urlParams['x_app'];
            const nonce = urlParams['nonce'];
            const heybox_id = urlParams['heybox_id'];
            const dw = urlParams['dw'];
            const os_type = urlParams['os_type'];
            const device_id = urlParams['device_id'];

            // 检查所有参数是否都存在
            const allParams = {
                cookie, os_version, x_os_type, hkey, _time, x_client_type,
                device_info, version, lang, x_app, nonce, heybox_id,
                dw, os_type, device_id, x_xhh_tokenid, pkey
            };

            const missingParams = Object.entries(allParams)
                .filter(([key, value]) => !value)
                .map(([key]) => key);

            if (missingParams.length === 0) {
                // 按照指定格式组合
                const cookieValue = `${cookie}&${os_version}&${x_os_type}&${hkey}&${_time}&${x_client_type}&${device_info}&${version}&${lang}&${x_app}&${nonce}&${heybox_id}&${dw}&${os_type}&${device_id}&${x_xhh_tokenid}&${pkey}`;
                
                // 使用 $persistentStore 存储
                if ($persistentStore.write(cookieValue, cookieName)) {
                    console.log("✅ Cookie获取/更新成功！");
                    $.msg($.name, "", "✅ Cookie获取/更新成功！");
                } else {
                    console.log("❌ Cookie写入失败，请重试！");
                    $.msg($.name, "", "❌ Cookie写入失败，请重试！");
                }

                // 打印详细日志
                console.log(`
🎯 触发URL: ${$request.url}
🍪 Cookie: ${cookie}
📱 设备信息:
- OS版本: ${os_version}
- OS类型: ${os_type}
- X-OS类型: ${x_os_type}
- 设备ID: ${device_id}
- 设备信息: ${device_info}
- 分辨率: ${dw}
🔑 认证信息:
- HKey: ${hkey}
- PKey: ${pkey}
- Token: ${x_xhh_tokenid}
- Nonce: ${nonce}
📦 应用信息:
- 版本: ${version}
- 语言: ${lang}
- 应用标识: ${x_app}
- 客户端类型: ${x_client_type}
👤 用户信息:
- HeyboxID: ${heybox_id}
⏰ 时间戳: ${_time}
                `);
            } else {
                console.log("❌ 参数不完整，缺少:", missingParams.join(', '));
                $.msg($.name, "", `❌ 参数不完整，缺少: ${missingParams.join(', ')}`);
            }
        }
    } catch (e) {
        console.log(`❌ Cookie获取失败！原因: ${e}`);
        $.msg($.name, "", "❌ Cookie获取失败，请查看日志！");
    }
}

// prettier-ignore
function Env(t,s){return new class{constructor(t,s){this.name=t,this.data=null,this.dataFile="box.dat",this.logs=[],this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,s),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}msg(s=t,e="",i="",o){const r=t=>!t||!this.isLoon()&&this.isSurge()?t:"string"==typeof t?this.isLoon()?t:this.isQuanX()?{"open-url":t}:void 0:"object"==typeof t&&(t["open-url"]||t["media-url"])?this.isLoon()?t["open-url"]:this.isQuanX()?t:void 0:void 0;this.isSurge()||this.isLoon()?$notification.post(s,e,i,r(o)):this.isQuanX()&&$notify(s,e,i,r(o)),this.logs.push("","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="),this.logs.push(s),e&&this.logs.push(e),i&&this.logs.push(i)}log(...t){t.length>0?this.logs=[...this.logs,...t]:console.log(this.logs.join(this.logSeparator))}logErr(t,s){const e=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();e?$.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):$.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(s=>setTimeout(s,t))}done(t={}){const s=(new Date).getTime(),e=(s-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${e} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,s)}
