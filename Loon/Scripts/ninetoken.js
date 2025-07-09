/**
 * @file 九号出行 token 抓取脚本（仅在成功提取后通知）
 * @type HTTP-REQUEST
 * @match ^https:\/\/cn-cbu-gateway\.ninebot\.com\/portal\/api\/user-sign\/v2\/calendar
 */

const name = "九号出行 Token";
const ENV_KEY = "NINEBOT";

function notify(title, msg) {
  $notification.post(title, "", msg);
}

function getHeaders($request) {
  const auth = $request.headers?.authorization || "";
  const deviceId = $request.headers?.device_id || "";
  return { auth, deviceId };
}

(function () {
  if (!$request?.headers) return $done();

  const { auth, deviceId } = getHeaders($request);

  if (!auth || !deviceId) {
    console.log(`❌ 抓取失败 → token: ${!!auth}, deviceId: ${!!deviceId}`);
    return $done();
  }

  const newAccount = `${deviceId}#${auth}`;
  const oldVal = $persistentStore.read(ENV_KEY) || "";
  const list = oldVal.split("&").filter(Boolean);

  // 是否已存在
  const exists = list.some(item => item === newAccount);
  if (exists) {
    console.log("⚠️ 当前账号 token 已存在，无需重复写入");
    return $done();
  }

  // 添加新账号
  list.push(newAccount);
  const finalVal = list.join("&");
  const saved = $persistentStore.write(finalVal, ENV_KEY);

  if (saved) {
    console.log("✅ Token 更新成功！");
    notify(name, `✅ 成功写入账号：\n${deviceId}`);
  } else {
    console.log("❌ 写入失败");
    notify(name, "❌ 写入失败");
  }

  $done();
})();
