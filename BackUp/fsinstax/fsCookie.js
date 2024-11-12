/*
富士instax 小程序 Cookie
*/

const cookieName = "INSTAX";

!(async () => {
    if (typeof $response !== 'undefined') {
        await GetCookie();
    }
})()
    .catch((e) => console.log(e))
    .finally(() => $done());

function GetCookie() {
    try {
        if ($request && $request.headers) {
            const token = $request.headers['Authorization'] || $request.headers['authorization'];
            if (!token) {
                $notification.post("富士instax", "", "❌ 未找到Authorization");
                return;
            }

            const body = JSON.parse($response.body);
            if (!body?.data?.user) {
                $notification.post("富士instax", "", "❌ 未找到用户信息");
                return;
            }

            // 获取所需的三个字段
            const userData = {
                "id": body.data.user.phone_number,      // 手机号
                "userId": body.data.user.id,            // 用户ID
                "token": token.replace('Bearer ', '')   // 移除Bearer前缀
            };

            console.log(`获取到的数据: ${JSON.stringify(userData)}`);

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
                if (dataArray[index].token !== userData.token) {
                    dataArray[index] = userData;
                    if ($persistentStore.write(JSON.stringify(dataArray), cookieName)) {
                        $notification.post("富士instax", "", `✅ 更新成功！账号: ${userData.id}`);
                    }
                }
            } else {
                dataArray.push(userData);
                if ($persistentStore.write(JSON.stringify(dataArray), cookieName)) {
                    $notification.post("富士instax", "", `✅ 新增成功！账号: ${userData.id}`);
                }
            }

            console.log(`当前数据: ${JSON.stringify(dataArray)}`);
            console.log(`📝 当前共有${dataArray.length}个账号`);
        }
    } catch (e) {
        console.log(`❌ Cookie获取失败！原因: ${e}`);
        $notification.post("富士instax", "", "❌ Cookie获取失败，请查看日志！");
    }
}

// prettier-ignore
function Env(t,s){return new class{constructor(t,s){this.name=t,this.logs=[],this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,s),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,s){const e=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();e?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(s=>setTimeout(s,t))}done(t={}){const s=(new Date).getTime(),e=(s-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${e} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,s)}
