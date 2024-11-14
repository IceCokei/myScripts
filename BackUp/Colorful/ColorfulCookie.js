/*
七彩虹商城小程序 Cookie
*/

const cookieName = "COLORFUL";
let COLORFUL = [];

!(async () => {
    if (typeof $request !== 'undefined') {
        await GetCookie();
    }
})()
    .catch((e) => console.log(e))
    .finally(() => $done());

async function GetCookie() {
    try {
        if ($request && $request.body) {
            const requestBody = $request.body;
            
            // Decrypt phone number and get tokens
            let login = await commonPost('/User/DecryptPhoneNumber', JSON.parse(requestBody));
            const token = login.Data.Token;
            const refreshToken = login.Data.RefreshToken;

            // Get user info
            let userInfo = await commonGet('/User/GetUserInfo');
            if (userInfo.Code === 401) {
                $notification.post("七彩虹商城", "", "❌ 获取用户信息失败！");
                return;
            }

            const id = userInfo.Data.Id;
            const newData = {
                "id": id,
                "token": token,
                "refreshToken": refreshToken,
                "body": requestBody
            };

            // Load existing data
            try {
                COLORFUL = JSON.parse($persistentStore.read(cookieName)) || [];
            } catch (e) {
                COLORFUL = [];
            }

            // Update or add new user data
            const index = COLORFUL.findIndex(e => e.id === newData.id);
            if (index !== -1) {
                if (COLORFUL[index].body === newData.body) {
                    return;
                }
                COLORFUL[index] = newData;
                $notification.post("七彩虹商城", "", `✅ 用户${newData.id}更新成功！`);
            } else {
                COLORFUL.push(newData);
                $notification.post("七彩虹商城", "", `✅ 新增用户${newData.id}成功！`);
            }

            // Save updated data
            if ($persistentStore.write(JSON.stringify(COLORFUL), cookieName)) {
                console.log(`📝 保存成功: ${JSON.stringify(newData)}`);
            } else {
                $notification.post("七彩虹商城", "", "❌ 数据保存失败！");
            }
        }
    } catch (e) {
        console.log(`❌ Cookie获取失败！原因: ${e}`);
        $notification.post("七彩虹商城", "", "❌ Cookie获取失败，请查看日志！");
    }
}

// prettier-ignore
function Env(t, s) { return new class { constructor(t, s) { this.name = t, this.logs = [], this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, s), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, s) { const e = !this.isSurge() && !this.isQuanX() && !this.isLoon(); e ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(s => setTimeout(s, t)) } done(t = {}) { const s = (new Date).getTime(), e = (s - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, s) }