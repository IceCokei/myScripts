
// 删除指定策略名称的条目
let body = $response.body;
const filterKeys = ["邮件追踪", "替身邮箱", "看广告扩容", "皮肤设置", "好运签"];

// 删除包含目标字段的完整对象（支持深层嵌套）
body = body.replace(
  new RegExp(`"strategyName":\\s*"(${filterKeys.join('|')})(?:-[^"]*)?"[^}]*}|` +
             `"mainTitle":\\s*{"cn":\\s*"(${filterKeys.join('|')})"}`, 'g'),
  ''
);

// 清理残留的空对象和逗号（防止JSON格式错误）
body = body.replace(/,\s*({}|""|\[\s*\])/g, '');
body = body.replace(/,\s*([\]}])/g, '$1');

$done({ body });
