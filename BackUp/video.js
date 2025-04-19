if (typeof $response !== "undefined") {
  try {
    const data = JSON.parse($response.body);
    const videoInfo = data?.vl?.vi?.[0];
    const videoName = videoInfo?.ti || '未知视频标题';
    const vid = videoInfo?.vid || '';
    const videoPageUrl = `https://v.qq.com/x/page/${vid}.html`;

    const videoUrls = videoInfo?.ul?.ui?.map(u => u.url) || [];

    let msg = `【腾讯视频解析】\n标题：${videoName}\nVID：${vid}\n\n`;
    msg += `▶️ 点我打开：${videoPageUrl}\n`;

    if (videoUrls.length > 0) {
      msg += `\n【原始片段路径】\n${videoUrls[0]}`;
    }

    $notify("腾讯视频资源", videoName, msg);
  } catch (e) {
    $notify("腾讯视频解析出错", "", e.message);
  }
  $done({});
} else {
  $done({});
}