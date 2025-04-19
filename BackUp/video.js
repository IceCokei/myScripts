if (typeof $response !== "undefined") {
    try {
        const data = JSON.parse($response.body);
        const videoInfo = data?.vl?.vi?.[0];
        const videoUrl = videoInfo?.ul?.ui?.[0]?.url;

        if (!videoUrl) {
            $notify("腾讯视频解析失败", "", "未找到视频地址");
            $done({});
        }

        let notifyMsg = `视频地址:\n${videoUrl}`;

        if (videoInfo.audio && videoInfo.audio.url) {
            notifyMsg += `\n音频地址:\n${videoInfo.audio.url}`;
        }

        $notify("腾讯视频解析成功", "", notifyMsg);
    } catch (err) {
        $notify("腾讯视频解析异常", "", err.message || String(err));
    }
    $done({});
} else {
    $notify("脚本错误", "", "$response 未定义，请检查类型是否为 script-response-body");
    $done({});
}