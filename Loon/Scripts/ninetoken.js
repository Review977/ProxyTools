/**
 * @script 九号出行 Token 抓取脚本（适配 Loon）
 * @type HTTP-REQUEST
 * @match ^https:\/\/cn-cbu-gateway\.ninebot\.com\/portal\/api\/user-sign\/v2\/calendar
 */

const ENV_KEY = "NINEBOT";
const name = "九号出行 token 抓取";

try {
  const headers = $request.headers || {};
  const token = headers["authorization"] || "";
  const deviceId = headers["device_id"] || "";

  if (!token || !deviceId) {
    console.log("❌ token 或 deviceId 缺失");
    $done({});
    return;
  }

  const newAccount = `${deviceId}#${token}`;
  const raw = $persistentStore.read(ENV_KEY) || "";
  const list = raw.split("&").filter(Boolean);

  if (list.includes(newAccount)) {
    console.log("✅ token 已存在，无需重复写入");
    $done({});
    return;
  }

  list.push(newAccount);
  const final = list.join("&");
  const ok = $persistentStore.write(final, ENV_KEY);

  if (ok) {
    console.log(`✅ token 写入成功：${deviceId}`);
    $notification.post(name, "", `✅ token 写入成功：\n${deviceId}`);
  } else {
    console.log("❌ token 写入失败");
    $notification.post(name, "", "❌ token 写入失败");
  }
} catch (e) {
  console.log("❌ 脚本异常：" + e.message);
} finally {
  $done({});
}
