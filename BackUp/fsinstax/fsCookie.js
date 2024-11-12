const $ = new Env('富士instax玩拍由我俱乐部');
let INSTAX = $persistentStore.read("INSTAX") || "[]";

!(async () => {
    if (typeof $request !== 'undefined') {
        await getCookie();
    }
})()
    .catch((e) => console.log(e))
    .finally(() => $done());

// 获取Cookie
async function getCookie() {
    try {
        // 获取 Authorization Token
        const token = $request.headers["Authorization"] || $request.headers["authorization"];
        if (!token) {
            $.log("❌ 未找到 Authorization");
            return;
        }
        
        // 解析响应体
        const body = JSON.parse($response.body);
        if (!body?.data?.user) {
            $.log("❌ 未找到用户信息数据");
            return;
        }

        // 从 JSON 响应中获取需要的字段
        const userData = {
            "id": body.data.user.phone_number,      // 手机号
            "userId": body.data.user.id,            // 用户ID
            "token": token                          // Bearer token
        };

        // 解析并更新存储的用户数据
        let INSTAX_ARR = [];
        try {
            INSTAX_ARR = JSON.parse(INSTAX);
            if (!Array.isArray(INSTAX_ARR)) INSTAX_ARR = [];
        } catch (e) {
            INSTAX_ARR = [];
        }

        // 检查是否已经存在该用户数据
        const index = INSTAX_ARR.findIndex(item => item.id === userData.id);
        if (index !== -1) {
            if (INSTAX_ARR[index].token !== userData.token) {
                INSTAX_ARR[index] = userData;
                $persistentStore.write(JSON.stringify(INSTAX_ARR), "INSTAX");
                $.msg($.name, `🔄 更新成功`, `用户：${userData.id}`);
            }
        } else {
            INSTAX_ARR.push(userData);
            $persistentStore.write(JSON.stringify(INSTAX_ARR), "INSTAX");
            $.msg($.name, `✅ 新增成功`, `用户：${userData.id}`);
        }
        
        $.log(`📝 当前共有 ${INSTAX_ARR.length} 个账号`);
        
    } catch (e) {
        $.logErr(e);
        $.msg($.name, `❌ 获取失败`, `请检查日志`);
    }
}

// prettier-ignore
function Env(t,s){return new class{constructor(t,s){this.name=t,this.logs=[],this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,s),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,s){const e=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();e?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(s=>setTimeout(s,t))}done(t={}){const s=(new Date).getTime(),e=(s-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${e} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,s)}
