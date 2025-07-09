const TOKEN_KEY = "NINEBOT";

const headers = $request.headers || {};
const rawBody = $request.body || "";

// ---- 打印日志以调试 ----
console.log("请求头 >>>", JSON.stringify(headers, null, 2));
console.log("请求体 >>>", rawBody);

// 🔍 提取 token
let token = "";

// 情况 1：access_token 在 headers 里（常规）
if (headers["access_token"]) {
  token = headers["access_token"];
}

// 情况 2：access_token 在 cookie 里
if (!token && headers["cookie"]?.includes("access_token")) {
  const match = headers["cookie"].match(/access_token=([^;\s]+)/);
  if (match) token = match[1];
}

// 🔍 提取 deviceId（从 HTML 或 raw text 中）
let deviceId = "";
const matchDev = rawBody.match(/"deviceId"\s*:\s*"([^"]+)"/) || rawBody.match(/deviceId["']?\s*[:=]\s*["']([^"']+)/);
if (matchDev) deviceId = matchDev[1];

// ✅ 写入变量
if (!token || !deviceId) {
  console.log(`❌ 抓取失败 → token: ${token ? '✔️' : '❌'}, deviceId: ${deviceId ? '✔️' : '❌'}`);
  $notification.post("九号出行抓取失败", "", `token: ${token ? '✔️' : '❌'} | deviceId: ${deviceId ? '✔️' : '❌'}`);
  $done();
} else {
  const result = `${deviceId}#Bearer ${token}`;
  const old = $persistentStore.read(TOKEN_KEY);
  const merged = old && !old.includes(result) ? `${old}&${result}` : result;

  const success = $persistentStore.write(merged, TOKEN_KEY);
  if (success) {
    $notification.post("✅ 九号账号抓取成功", "", result);
  } else {
    $notification.post("❌ 写入失败", "", "请检查权限");
  }
  $done();
}
