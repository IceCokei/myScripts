/*
七彩虹商城 小程序 Cookie
*/

const cookieName = "COLORFUL";

!(async () => {
    if (typeof $request !== 'undefined' && $request.method === 'GET') {
        console.log("🔍 请求URL:", $request.url);
        console.log("🔍 请求头:", JSON.stringify($request.headers));
        
        await GetCookie();
    } else {
        console.log("❌ 请求不满足条件");
    }
})()
    .catch((e) => console.log(e))
    .finally(() => $done());

function GetCookie() {
    try {
        if ($request && $request.headers) {
            console.log("🔍 开始获取Cookie");
            const token = $request.headers['Authorization'] || $request.headers['authorization'];
            const refreshToken = $request.headers['X-Authorization'];
            
            console.log("📝 获取到的token:", token);
            console.log("📝 获取到的refreshToken:", refreshToken);
            
            if (!token || !refreshToken) {
                $notification.post("七彩虹商城", "", "❌ 未找到必要的认证信息");
                return;
            }

            // 构建用户数据对象
            const userData = {
                "id": "1",
                "token": token,
                "refreshToken": refreshToken
            };

            // 读取现有数据
            let existingData = $persistentStore.read(cookieName);
            let dataArray = [];
            try {
                dataArray = JSON.parse(existingData || '[]');
                if (!Array.isArray(dataArray)) dataArray = [];
            } catch (e) {
                dataArray = [];
            }

            // 检查是否存在相同账号
            const index = dataArray.findIndex(item => item.id === userData.id);
            if (index !== -1) {
                if (dataArray[index].token !== userData.token || dataArray[index].refreshToken !== userData.refreshToken) {
                    dataArray[index] = userData;
                    if ($persistentStore.write(JSON.stringify(dataArray), cookieName)) {
                        $notification.post("七彩虹商城", "", `✅ 更新成功！\ntoken: ${userData.token}\nrefreshToken: ${userData.refreshToken}`);
                    }
                }
            } else {
                dataArray.push(userData);
                if ($persistentStore.write(JSON.stringify(dataArray), cookieName)) {
                    $notification.post("七彩虹商城", "", `✅ 新增成功！\ntoken: ${userData.token}\nrefreshToken: ${userData.refreshToken}`);
                }
            }

            // 控制台输出当前账户数量和详细信息
            console.log(`👥 当前共有${dataArray.length}个账号`);
            console.log(`📝 Token: ${token}`);
            console.log(`📝 RefreshToken: ${refreshToken}`);
        }
    } catch (e) {
        console.log(`❌ Cookie获取失败！原因: ${e}`);
        $notification.post("七彩虹商城", "", "❌ Cookie获取失败，请查看日志！");
    }
}

// prettier-ignore
function Env(t, s) { return new class { constructor(t, s) { this.name = t, this.logs = [], this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, s), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, s) { const e = !this.isSurge() && !this.isQuanX() && !this.isLoon(); e ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(s => setTimeout(s, t)) } done(t = {}) { const s = (new Date).getTime(), e = (s - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, s) } 
