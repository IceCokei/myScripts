if (typeof $response !== "undefined") {
    try {
        const data = JSON.parse($response.body);
        const videoInfo = data?.vl?.vi?.[0];
        const videoName = videoInfo?.ti || '未知视频标题';
        const vid = videoInfo?.vid || '';
        const videoPageUrl = `https://v.qq.com/x/page/${vid}.html`;
        const apiURL = `https://oklink.cokei.me/video.php?url=${videoPageUrl}`;

        // Quantumult X 只支持 $task.fetch
        if (typeof $task !== "undefined" && typeof $task.fetch === "function") {
            $task.fetch({ url: apiURL }).then(
                response => {
                    let notifyMsg;
                    try {
                        const result = JSON.parse(response.body);
                        let videoUrl = result?.video_url || result?.url || '获取失败';
                        // 替换域名
                        videoUrl = videoUrl.replace(
                            /^https:\/\/apd-ugcvlive\.apdcdn\.tc\.qq\.com\/om\.tc\.qq\.com\//,
                            'https://apd-vlive.apdcdn.tc.qq.com/om.tc.qq.com/'
                        );
                        notifyMsg =
                            `🎬【腾讯视频解析】\n` +
                            `📺 标题：${videoName}\n` +
                            `🆔 VID：${vid}\n\n` +
                            `🔗 视频页：${videoPageUrl}\n\n` +
                            `📥 视频地址：\n${videoUrl}`;
                    } catch (e) {
                        notifyMsg =
                            `❌【腾讯视频解析失败】\n` +
                            `📺 标题：${videoName}\n` +
                            `🆔 VID：${vid}\n\n` +
                            `🔗 视频页：${videoPageUrl}\n\n` +
                            `⚠️ 错误：${e.message}`;
                    }
                    $notify("🎬 腾讯视频资源", videoName, notifyMsg);
                    $done({});
                },
                reason => {
                    const notifyMsg =
                        `❌【腾讯视频解析失败】\n` +
                        `📺 标题：${videoName}\n` +
                        `🆔 VID：${vid}\n\n` +
                        `🔗 视频页：${videoPageUrl}\n\n` +
                        `⚠️ 错误：${reason.error || reason}`;
                    $notify("🎬 腾讯视频资源", videoName, notifyMsg);
                    $done({});
                }
            );
        } else {
            // 兼容 Surge
            const http = typeof $httpClient !== "undefined" ? $httpClient : undefined;
            if (http) {
                http.get(apiURL, (error, response, body) => {
                    let notifyMsg;
                    if (!error && response.status === 200) {
                        const result = JSON.parse(body);
                        let videoUrl = result?.video_url || result?.url || '获取失败';
                        // 替换域名
                        videoUrl = videoUrl.replace(
                            /^https:\/\/apd-ugcvlive\.apdcdn\.tc\.qq\.com\/om\.tc\.qq\.com\//,
                            'https://apd-vlive.apdcdn.tc.qq.com/om.tc.qq.com/'
                        );
                        notifyMsg =
                            `🎬【腾讯视频解析】\n` +
                            `📺 标题：${videoName}\n` +
                            `🆔 VID：${vid}\n\n` +
                            `🔗 视频页：${videoPageUrl}\n\n` +
                            `📥 视频地址：\n${videoUrl}`;
                    } else {
                        notifyMsg =
                            `❌【腾讯视频解析失败】\n` +
                            `📺 标题：${videoName}\n` +
                            `🆔 VID：${vid}\n\n` +
                            `🔗 视频页：${videoPageUrl}\n\n` +
                            `⚠️ 错误：${error || (response && response.status)}`;
                    }
                    $notify("🎬 腾讯视频资源", videoName, notifyMsg);
                    $done({});
                });
            } else {
                $notify("❌ 腾讯视频解析出错", "", "不支持的环境");
                $done({});
            }
        }
    } catch (e) {
        $notify("❌ 腾讯视频解析出错", "", e.message);
        $done({});
    }
} else {
    $done({});
}
