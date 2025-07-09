/**
 * @fileoverview 九号出行自动签到脚本
 * @cron 0 9 * * *
 * @env NINEBOT（支持格式：deviceId#Bearer token & deviceId#Bearer token）
 * @notify 签到结果
 */

const accounts = ($persistentStore.read("NINEBOT") || "").split("&").filter(Boolean);

function logNotify(title, msg) {
  console.log(`${title}\n${msg}`);
  $notification.post(title, "", msg);
}

async function sign(account) {
  const [deviceId, token] = account.split("#");
  const headers = {
    "Authorization": token,
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Segway v6 C 609033420",
    "Origin": "https://h5-bj.ninebot.com",
    "Referer": "https://h5-bj.ninebot.com/",
  };

  // 查询签到状态
  const statusUrl = `https://cn-cbu-gateway.ninebot.com/portal/api/user-sign/v2/status?t=${Date.now()}`;
  const signUrl = `https://cn-cbu-gateway.ninebot.com/portal/api/user-sign/v2/sign`;

  try {
    const statusResp = await httpGet(statusUrl, headers);
    const statusData = JSON.parse(statusResp.body);

    if (statusData.code !== 0) {
      return `账号 [${deviceId}] 查询状态失败 ❌：${statusData.msg}`;
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
        return `账号 [${deviceId}] ❌ 签到失败：${signData.msg}`;
      }
    }
  } catch (e) {
    return `账号 [${deviceId}] ❌ 异常：${e}`;
  }
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

(async () => {
  if (accounts.length === 0) {
    logNotify("九号出行 ❌", "未检测到 NINEBOT 变量");
    $done();
    return;
  }

  const results = await Promise.all(accounts.map(sign));
  const finalMsg = results.join("\n");
  logNotify("九号出行签到结果 ✅", finalMsg);
  $done();
})();
