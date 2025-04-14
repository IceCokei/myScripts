
// 删除指定策略名称的条目
let body = $response.body;
body = body.replace(/"strategyName": "(邮件追踪|替身邮箱|看广告扩容|皮肤设置|好运签)"/g, '"strategyName": "FILTERED"');
body = body.replace(/"mainTitle": {"cn": "(邮件追踪|替身邮箱|看广告扩容|皮肤设置|好运签)"}/g, '"mainTitle": {"cn": "FILTERED"}');

$done({ body });
