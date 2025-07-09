const TOKEN_KEY = "NINEBOT";

const headers = $request.headers || {};
let token = "";

// 从 headers 或 cookie 中提取 token
if (headers["access_token"]) {
  token = headers["access_token"];
} else if (headers["cookie"]?.includes("access_token")) {
  const match = headers["cookie"].match(/access_token=([^;\s]+)/);
  if (match) token = match[1];
}

if (!token) {
  console.log("❌ 未获取到 token");
  $notification.post("抓取失败", "", "access_token 不存在");
  $done();
} else {
  const bearerToken = `Bearer ${token}`;
  const old = $persistentStore.read(TOKEN_KEY);
  const merged = old && !old.includes(bearerToken) ? `${old}&${bearerToken}` : bearerToken;

  const success = $persistentStore.write(merged, TOKEN_KEY);
  if (success) {
    $notification.post("✅ 抓取成功", "", bearerToken);
  } else {
    $notification.post("❌ 写入失败", "", "请检查权限");
  }
  $done();
}
