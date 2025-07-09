/**
 * @script 九号出行自动签到（展示积分 + 盲盒）
 * @cron 0 9 * * *
 * @env NINEBOT
 */

const ENV_KEY = "NINEBOT";
const accounts = ($persistentStore.read(ENV_KEY) || "").split("&").filter(Boolean);

function notify(title, msg) {
  console.log(`${title}\n${msg}`);
  $notification.post(title, "", msg);
}

function httpGet(url, headers) {
  return new Promise((resolve) => {
    $httpClient.get({ url, headers }, (err, resp, body) => {
      if (err) resolve({ status: 500, body: "", error: err });
      else resolve({ status: resp.status, body });
    });
  });
}

function httpPost(url, headers, data) {
  return new Promise((resolve) => {
    $httpClient.post({ url, headers, body: JSON.stringify(data) }, (err, resp, body) => {
      if (err) resolve({ status: 500, body: "", error: err });
      else resolve({ status: resp.status, body });
    });
  });
}

async function run(account) {
  const [deviceId, token] = account.split("#");
  if (!deviceId || !token) {
    return `账号格式错误 ❌：${account}`;
  }

  const headers = {
    "Authorization": token.trim(),
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Segway v6 C 609053474",
    "Origin": "https://h5-bj.ninebot.com",
    "Referer": "https://h5-bj.ninebot.com/",
    "Host": "cn-cbu-gateway.ninebot.com",
    "from_platform_1": "1",
    "language": "zh"
  };

  const t = Date.now();
  const calendarURL = `https://cn-cbu-gateway.ninebot.com/portal/api/user-sign/v2/calendar?t=${t}`;
  const blindBoxURL = `https://cn-cbu-gateway.ninebot.com/portal/api/user-sign/v2/blind-box/list?t=${t}`;
  const signURL = `https://cn-cbu-gateway.ninebot.com/portal/api/user-sign/v2/sign`;

  try {
    const today = new Date().toISOString().split("T")[0];

    // 获取签到状态
    const calResp = await httpGet(calendarURL, headers);
    const calData = JSON.parse(calResp.body);
    if (calData.code !== 0) {
      return `账号 [${deviceId}] 查询失败 ❌：${calData.msg || "未知错误"}`;
    }

    const score = calData.data.score ?? "未知";
    const days = calData.data.consecutiveDays ?? "未知";
    const todayData = calData.data.calendar.find(x => x.day === today);
    const signed = todayData?.signed || false;

    let signResult = "";
    if (signed) {
      signResult = "✅ 今日已签到";
    } else {
      const signResp = await httpPost(signURL, headers, { deviceId });
      const signData = JSON.parse(signResp.body);
      if (signData.code === 0) {
        signResult = "✨ 签到成功";
      } else {
        signResult = `❌ 签到失败：${signData.msg || "未知错误"}`;
      }
    }

    // 获取盲盒进度
    const boxResp = await httpGet(blindBoxURL, headers);
    const boxData = JSON.parse(boxResp.body);
    let boxInfo = "";
    if (boxData.code === 0 && boxData.data?.length > 0) {
      const current = boxData.data[0];
      const stage = current.phase || "未知阶段";
      const currentDays = current.currentSignDays || 0;
      const targetDays = current.targetSignDays || "?";
      const received = current.rewardReceived ? "已领取" : "未领取";
      boxInfo = `盲盒进度：阶段 ${stage}（${currentDays}/${targetDays} 天）｜${received}`;
    }

    return [
      `账号 [${deviceId}]`,
      signResult,
      `连续签到：${days} 天`,
      `当前积分：${score} 分`,
      boxInfo
    ].filter(Boolean).join("\n");

  } catch (e) {
    return `账号 [${deviceId}] ❌ 异常：${e.message}`;
  }
}

(async () => {
  if (accounts.length === 0) {
    notify("九号出行 ❌", "未配置 NINEBOT 环境变量");
    return $done();
  }

  const results = await Promise.all(accounts.map(run));
  notify("九号出行签到结果 ✅", results.join("\n\n"));
  $done();
})();
