/**
 * @fileoverview 九号出行 token 抓取脚本
 * @target https://cn-cbu-gateway.ninebot.com/portal/api/user-sign/v2/calendar
 * @cron 不需要，作为 HTTP-REQUEST 脚本使用
 * @env NINEBOT
 * @format deviceId#Bearer token
 */

const headers = $request.headers || {};
let token = "";
let deviceId = "";

// 提取 authorization 字段
if (headers["authorization"]) {
  token = headers["authorization"].trim();
  if (!token.startsWith("Bearer ")) {
    token = "Bearer " + token;
  }
}

// 提取 device_id 字段
if (headers["device_id"]) {
  deviceId = headers["device_id"].trim();
}

if (token && deviceId) {
  const newToken = `${deviceId}#${token}`;
  const old = $persistentStore.read("NINEBOT") || "";
  let updated = old;

  if (!old.includes(newToken)) {
    updated = old ? old + "&" + newToken : newToken;
    $persistentStore.write(updated, "NINEBOT");
    $notification.post("✅ 九号出行 token 抓取成功", "", `${deviceId}\n${token.slice(0, 30)}...`);
    console.log("✅ Token 更新成功:", newToken);
  } else {
    console.log("✅ 已存在，无需更新:", newToken);
  }
} else {
  $notification.post("❌ 抓取失败", "", "未能获取 token 或 device_id");
  console.log("❌ headers:", JSON.stringify(headers));
}

$done({});
