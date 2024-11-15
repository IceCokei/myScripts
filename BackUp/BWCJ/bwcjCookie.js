const cookieName = "bwcj";

!(async () => {
    if (typeof $response !== 'undefined') {
        await ParseResponse();
    }
})()
    .catch((e) => console.log(e))
    .finally(() => $done());

async function ParseResponse() {
    try {
        if ($response && $response.headers) {
            const token = $response.headers['Qm-User-Token'] || $response.headers['qm-user-token'];

            console.log(`📝 Token: ${token}`);

            if (token) {
                if ($persistentStore.write(token, cookieName)) {
                    $notification.post("霸王茶姬", "", "🎉 Cookie获取/更新成功！");
                } else {
                    $notification.post("霸王茶姬", "", "❌ Cookie写入失败，请重试！");
                }
            } else {
                $notification.post("霸王茶姬", "", "❌ 未找到token，请重新登录！");
            }
        }
    } catch (e) {
        console.log(`❌ 解析响应失败: ${e}`);
        $notification.post("霸王茶姬", "", "❌ 响应解析失败，请查看日志！");
    }
}