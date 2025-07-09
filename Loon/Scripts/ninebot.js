/**
 * 九号出行签到脚本（单账号版2）
 * cron: 0 9 * * *
 * 环境变量 NINEBOT = deviceId#Bearer token
 */

const ENV = $persistentStore.read("NINEBOT");
if (!ENV || !ENV.includes("#")) {
  $notification.post("九号出行 ❌", "", "未配置 NINEBOT 环境变量");
  $done();
}

const [deviceId, token] = ENV.split("#");
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

function get(url) {
  return new Promise(resolve =>
    $httpClient.get({ url, headers }, (err, resp, body) =>
      resolve({ err, status: resp?.status || 0, body })
    )
  );
}

function post(url, data) {
  return new Promise(resolve =>
    $httpClient.post({ url, headers, body: JSON.stringify(data) }, (err, resp, body) =>
      resolve({ err, status: resp?.status || 0, body })
    )
  );
}

(async () => {
  const now = Date.now();
  let log = [`账号 [${deviceId}]`];

  // 查询日历
  const calResp = await get(`https://cn-cbu-gateway.ninebot.com/portal/api/user-sign/v2/calendar?t=${now}`);
  let signed = false, consecutive = 0, rewardInfo = null;

  try {
    const json = JSON.parse(calResp.body);
    const cal = json.data?.calendarInfo || [];
    const currentTs = json.data?.currentTimestamp;

    const today = cal.find(i => i.timestamp === currentTs);
    signed = today?.sign === 1;
    rewardInfo = today?.rewardInfo;

    // 连续签到计算
    const oneDay = 86400000;
    let ts = currentTs;
    while (cal.some(i => i.timestamp === ts && i.sign === 1)) {
      consecutive++;
      ts -= oneDay;
    }

    log.push(signed ? "✅ 今日已签到" : "⚠️ 今日未签到");

  } catch {
    log.push("⚠️ 签到状态获取失败");
  }

  // 执行签到（如果未签）
  if (!signed) {
    const signRes = await post("https://cn-cbu-gateway.ninebot.com/portal/api/user-sign/v2/sign", { deviceId });
    try {
      const res = JSON.parse(signRes.body);
      if (res.code === 0) {
        log.push("✨ 签到成功");
        signed = true;
      } else {
        log.push(`❌ 签到失败：${res.msg || "未知错误"}`);
      }
    } catch {
      log.push("❌ 签到失败（解析错误）");
    }
  }

  // 查询盲盒
  const boxRes = await get(`https://cn-cbu-gateway.ninebot.com/portal/api/user-sign/v2/blind-box/list?t=${now}`);
  try {
    const boxData = JSON.parse(boxRes.body);
    const unopened = boxData.data?.notOpenedBoxes?.[0];
    const opened = boxData.data?.openedBoxes?.length || 0;
    if (unopened) {
      log.push(`📦 盲盒：${unopened.leftDaysToOpen} 天后可领（目标${unopened.awardDays}天）`);
    } else {
      log.push("📦 无盲盒数据");
    }
  } catch {
    log.push("📦 盲盒数据解析失败");
  }

  log.push(`连续签到：${consecutive || "未知"} 天`);

  $notification.post("九号出行签到 ✅", "", log.join("\n"));
  $done();
})();
