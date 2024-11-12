/*
富士instax 小程序 Cookie
*/

const cookieName = "INSTAX";

!(async () => {
    if (typeof $request !== 'undefined') {
        await GetCookie();
    }
})()
    .catch((e) => console.log(e))
    .finally(() => $done());

// 获取Cookie
async function getCookie() {
    const token = $request.headers["authorization"] || $request.headers["Authorization"];
    if (!token) return;
    
    const body = JSON.parse($response.body);
    if (!body?.data) return;
    
    // 获取三个关键参数
    const id = body.data.user.phone_number;      // 手机号
    const userId = body.data.user_id;            // 用户ID
    const newData = { "id": id, "userId": userId, "token": token };  // 组装数据
    
    // 检查是否已存在
    const index = INSTAX.findIndex(e => e.id == newData.id);
    if (index !== -1) {
        if (INSTAX[index].token !== newData.token) {
            INSTAX[index] = newData;
            $.msg($.name, `🎉 用户${newData.id}更新token成功!`, '');
        }
    } else {
        INSTAX.push(newData);
        $.msg($.name, `🎉 新增用户${newData.id}成功!`, '');
    }
    $.setdata(JSON.stringify(INSTAX), "INSTAX");
}

// prettier-ignore
function Env(t, s) { return new class { constructor(t, s) { this.name = t, this.logs = [], this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, s), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, s) { const e = !this.isSurge() && !this.isQuanX() && !this.isLoon(); e ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(s => setTimeout(s, t)) } done(t = {}) { const s = (new Date).getTime(), e = (s - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, s) }