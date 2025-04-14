
// 删除指定策略名称的条目
const filterKeywords = ["邮件追踪", "替身邮箱", "看视频扩容", "皮肤设置", "好运签"];

function parseJson(jsonStr) {
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("JSON解析失败:", e);
    return null;
  }
}

function cleanObject(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  // 删除包含关键词的字段
  if (
    obj.strategyName &&
    filterKeywords.some(keyword => obj.strategyName.includes(keyword))
  ) {
    return null;
  }

  if (
    obj.mainTitle &&
    obj.mainTitle.cn &&
    filterKeywords.some(keyword => obj.mainTitle.cn.includes(keyword))
  ) {
    return null;
  }

  for (const key in obj) {
    const value = cleanObject(obj[key]);
    if (value === null) {
      delete obj[key];
    } else {
      obj[key] = value;
    }
  }

  return Object.keys(obj).length > 0 ? obj : null;
}

function onResponse(context, flow) {
  if (flow.request.url.includes("/mailmaster/api/page/v2/conf.do")) {
    const body = flow.response.body.toString();
    let data = parseJson(body);

    if (data) {
      // 清理数据
      data = cleanObject(data);

      // 重新生成响应体
      flow.response.body = Buffer.from(JSON.stringify(data));
    }
  }
}

// 如果环境支持 module.exports，则导出 onResponse 函数；否则不做处理
if (typeof module !== "undefined") {
  module.exports = { onResponse };
}
