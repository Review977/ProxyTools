const TOKEN_KEY = "NINEBOT";

const headers = $request.headers || {};
const token = headers["access_token"] || headers["Access_Token"] || "";
let deviceId = "";

// 尝试从 body 中提取 deviceId
try {
  if ($request.body) {
    const body = JSON.parse($request.body);
    deviceId = body.deviceId || "";
  }
} catch (e) {
  console.log("请求体解析失败:", e);
}

if (!token || !deviceId) {
  console.log("抓取失败 ❌：token 或 deviceId 缺失");
  $notification.post("九号出行抓取失败", "", "未获取到 token 或 deviceId");
  $done();
} else {
  const result = `${deviceId}#Bearer ${token}`;
  const old = $persistentStore.read(TOKEN_KEY);
  const merged = old && !old.includes(result) ? `${old}&${result}` : result;

  const success = $persistentStore.write(merged, TOKEN_KEY);
  if (success) {
    $notification.post("✅ 九号账号抓取成功", "", result);
  } else {
    $notification.post("❌ 变量写入失败", "", "请检查权限");
  }
  $done();
}
