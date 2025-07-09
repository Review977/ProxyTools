/**
 * @file 九号出行自动签到
 * @env NINEBOT
 * @cron 0 9 * * *
 * @version 20240709
 */

const accounts = ($persistentStore.read("NINEBOT") || "").split("&").filter(Boolean);

function notify(title, msg) {
  console.log(`${title}\n${msg}`);
  $notification.post(title, "", msg);
}

function httpGet(url, headers) {
  return new Promise((resolve, reject) => {
    $httpClient.get({ url, headers }, (err, resp, body) => {
      if (err) reject(err);
      else resolve({ status: resp.status, body });
    });
  });
}

function httpPost(url, headers, data) {
  return new Promise((resolve, reject) => {
    $httpClient.post({ url, headers, body: JSON.stringify(data) }, (err, resp, body) => {
      if (err) reject(err);
      else resolve({ status: resp.status, body });
    });
  });
}

async function sign(account) {
  const [deviceId, token] = account.split("#");
  if (!deviceId || !token) {
    return `账号格式错误 ❌：${account}`;
  }

  const headers = {
    "Authorization": token.trim(),
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Segway v6 C 609053420",
    "Origin": "https://h5-bj.ninebot.com",
    "Referer": "https://h5-bj.ninebot.com/",
    "Host": "cn-cbu-gateway.ninebot.com",
    "from_platform_1": "1",
    "language": "zh"
  };

  const t = Date.now();
  const statusUrl = `https://cn-cbu-gateway.ninebot.com/portal/api/user-sign/v2/status?t=${t}`;
  const signUrl = "https://cn-cbu-gateway.ninebot.com/portal/api/user-sign/v2/sign";

  try {
    const statusResp = await httpGet(statusUrl, headers);
    const statusData = JSON.parse(statusResp.body);

    if (statusData.code !== 0) {
      return `账号 [${deviceId}] 查询状态失败 ❌：${statusData.msg || "未知错误"}`;
    }

    const signed = statusData.data.currentSignStatus === 1;
    const days = statusData.data.consecutiveDays || 0;

    if (signed) {
      return `账号 [${deviceId}] ✅ 已签到，连续 ${days} 天`;
    } else {
      const signResp = await httpPost(signUrl, headers, { deviceId });
      const signData = JSON.parse(signResp.body);

      if (signData.code === 0) {
        return `账号 [${deviceId}] ✨ 签到成功，连续 ${days + 1} 天`;
      } else {
        return `账号 [${deviceId}] ❌ 签到失败：${signData.msg || "未知错误"}`;
      }
    }
  } catch (e) {
    return `账号 [${deviceId}] ❌ 异常：${e}`;
  }
}

(async () => {
  if (accounts.length === 0) {
    notify("九号出行 ❌", "未配置 NINEBOT 变量");
    $done();
    return;
  }

  const results = await Promise.all(accounts.map(sign));
  notify("九号出行签到结果 ✅", results.join("\n"));
  $done();
})();
