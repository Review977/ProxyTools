/**
 * 九号出行单账号签到脚本（含盲盒显示）
 * 适用平台：Loon
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

const now = Date.now();
const today = new Date().toISOString().split("T")[0];
const url_base = "https://cn-cbu-gateway.ninebot.com/portal/api/user-sign/v2";

function httpGet(url) {
  return new Promise(resolve => {
    $httpClient.get({ url, headers }, (err, resp, body) => {
      resolve({ err, status: resp?.status, body });
    });
  });
}

function httpPost(url, data) {
  return new Promise(resolve => {
    $httpClient.post({ url, headers, body: JSON.stringify(data) }, (err, resp, body) => {
      resolve({ err, status: resp?.status, body });
    });
  });
}

(async () => {
  let output = [`账号 [${deviceId}]`];

  // 获取签到状态
  const cal = await httpGet(`${url_base}/calendar?t=${now}`);
  let signed = false;
  let days = "未知";

  try {
    const calData = JSON.parse(cal.body);
    const list = calData.data?.calendar || [];
    const todayData = list.find(i => i.day === today) || {};
    signed = todayData.signed || false;
    days = calData.data?.consecutiveDays ?? "未知";
  } catch {
    output.push("⚠️ 签到状态获取失败");
  }

  // 若未签到则执行签到
  if (!signed) {
    const res = await httpPost(`${url_base}/sign`, { deviceId });
    try {
      const json = JSON.parse(res.body);
      if (json.code === 0) {
        output.push("✨ 签到成功");
        // 重新拉取状态
        const cal2 = await httpGet(`${url_base}/calendar?t=${Date.now()}`);
        const calData2 = JSON.parse(cal2.body);
        const list2 = calData2.data?.calendar || [];
        const today2 = list2.find(i => i.day === today) || {};
        signed = today2.signed || false;
        days = calData2.data?.consecutiveDays ?? "未知";
      } else {
        output.push(`❌ 签到失败：${json.msg || "未知"}`);
      }
    } catch {
      output.push("❌ 签到接口异常");
    }
  }

  // 最终状态
  output.push(signed ? "✅ 今日已签到" : "⚠️ 今日未签到");
  output.push(`连续签到：${days} 天`);

  // 获取盲盒数据
  const box = await httpGet(`${url_base}/blind-box/list?t=${now}`);
  try {
    const boxData = JSON.parse(box.body);
    const current = boxData.data?.[0];
    if (current) {
      const stage = current.phase ?? "?";
      const nowDays = current.currentSignDays ?? "?";
      const targetDays = current.targetSignDays ?? "?";
      const status = current.rewardReceived ? "🎁 已领取" : "📦 未领取";
      output.push(`盲盒阶段 ${stage}：${nowDays}/${targetDays} 天｜${status}`);
    } else {
      output.push("📦 无盲盒数据");
    }
  } catch {
    output.push("📦 盲盒数据解析失败");
  }

  $notification.post("九号出行签到 ✅", "", output.join("\n"));
  $done();
})();
