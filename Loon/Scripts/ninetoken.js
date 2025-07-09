const TOKEN_KEY = "NINEBOT";

const headers = $request.headers || {};
const token = headers["access_token"] || headers["Access_Token"] || "";

let deviceId = "";
let rawBody = $request.body || "";

try {
  const jsonBody = JSON.parse(rawBody);
  console.log("请求体内容：", JSON.stringify(jsonBody, null, 2));
  deviceId = jsonBody.deviceId || jsonBody.data?.deviceId || "";
} catch (e) {
  console.log("请求体解析失败:", e);
}

if (!token || !deviceId) {
  console.log("抓取失败 ❌：token:", token ? "有" : "无", "deviceId:", deviceId ? "有" : "无");
  $notification.post("九号出行抓取失败", "", `token: ${!!token} | deviceId: ${!!deviceId}`);
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
