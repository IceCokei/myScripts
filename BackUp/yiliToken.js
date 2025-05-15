/**
 * Quantumult X 脚本：提取 伊利 token 并保存
 */

const body = $response.body;
const obj = JSON.parse(body || "{}");
const token = obj.token;

if (token) {
  $prefs.setValueForKey(token, "Yili_token");
  console.log("✅ 获取 Yili Token 成功: " + token);
  $notify("🔔 YiliToken", "获取成功", `Token: ${token}`);
} else {
  console.log("❌ 未获取到 Token");
  $notify("🔔 YiliToken", "获取失败", "未找到 token 字段");
}

$done({});
