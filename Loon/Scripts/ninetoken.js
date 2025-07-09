/**
 * @fileoverview 九号出行抓取 deviceId 和 token
 * Loon 配置:
 *
 * [Script]
 * http-request ^https:\/\/cn-cbu-gateway\.ninebot\.com\/portal\/api\/user-sign\/v2\/status script-path=https://your.cdn.com/ninebot-capture.js,tag=抓取九号出行账号

 */

const TOKEN_KEY = "NINEBOT";

const authorization = $request.headers["Authorization"] || $request.headers["authorization"];
let body = $request.body || "";
let deviceId = "";

try {
  const json = JSON.parse(body);
  deviceId = json.deviceId || "";
} catch (e) {
  console.log("请求体解析失败:", e);
}

if (!authorization || !deviceId) {
  console.log("未成功获取 token 或 deviceId");
  $done();
} else {
  const current = `${deviceId}#${authorization}`;

  const old = $persistentStore.read(TOKEN_KEY);
  let merged = current;

  // 自动去重追加（可选）
  if (old && !old.includes(current)) {
    merged = `${old}&${current}`;
  }

  const success = $persistentStore.write(merged, TOKEN_KEY);
  if (success) {
    $notification.post("九号出行", "账号获取成功 ✅", `${deviceId}\n已写入变量 NINEBOT`);
  } else {
    $notification.post("九号出行", "写入变量失败 ❌", "请检查权限");
  }

  $done();
}
