/*
海天美味馆小程序 Cookie
使用说明：打开小程序即可获取Cookie

[rewrite_local]
^https:\/\/cmallapi\.haday\.cn\/buyer-api\/members\/(pointTask|points\/current) url script-request-header https://raw.githubusercontent.com/IceCokei/myScripts/refs/heads/main/BackUp/htday/htcookie.js

[MITM]
hostname = cmallapi.haday.cn
*/

const $ = new Env("海天美味馆Cookie");
const cookieName = "htday";

!(async () => {
    if (typeof $request !== 'undefined') {
        await GetCookie();
    }
})()
.catch((e) => $.log(e))
.finally(() => $.done());

function GetCookie() {
    try {
        if ($request && $request.headers) {
            const auth = $request.headers['Authorization'] || $request.headers['authorization'];
            const deviceId = $request.headers['uuid'];
            
            if (auth && deviceId) {
                const oldCookie = $.read(cookieName);
                const newCookie = `${auth}#${deviceId}`;
                
                if (oldCookie !== newCookie) {
                    if ($.write(newCookie, cookieName)) {
                        $.notify("海天美味馆", "", "✅ Cookie获取/更新成功！");
                    } else {
                        $.notify("海天美味馆", "", "❌ Cookie写入失败，请重试！");
                    }
                } else {
                    $.notify("海天美味馆", "", "ℹ️ Cookie没有变化，无需更新");
                }
            } else {
                $.notify("海天美味馆", "", "❌ 未找到有效的Cookie信息，请重试！");
            }
            
            $.log(`🎯 触发URL: ${$request.url}`);
            $.log(`📝 Auth: ${auth}`);
            $.log(`📝 UUID: ${deviceId}`);
        }
    } catch (e) {
        $.log(`❌ Cookie获取失败！原因: ${e}`);
        $.notify("海天美味馆", "", "❌ Cookie获取失败，请查看日志！");
    }
}

// API部分代码保持不变...
