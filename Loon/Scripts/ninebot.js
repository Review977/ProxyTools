/**
 * 九号出行签到脚本
 * 配合 Loon 定时任务使用
 * 变量名：NINEBOT，格式：Bearer token1 & Bearer token2
 */

const ACC_KEY = "NINEBOT";
const BASE_URL = "https://cn-cbu-gateway.ninebot.com/portal/api/user-sign/v2";

const tokensEnv = typeof $argument !== "undefined" ? $argument : $persistentStore.read(ACC_KEY);

if (!tokensEnv) {
  console.log("未找到环境变量 NINEBOT");
  $done();
}

const tokens = tokensEnv.split("&").map(token => token.trim());
let resultMsg = "";

function sign(token, index, callback) {
  const headers = {
    "Authorization": token,
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Segway v6 C 609033420",
    "Origin": "https://h5-bj.ninebot.com",
    "Referer": "https://h5-bj.ninebot.com/"
  };

  // 先查询状态
  const checkUrl = `${BASE_URL}/status?t=${Date.now()}`;
  $httpClient.get({ url: checkUrl, headers }, (err, resp, data) => {
    if (err) {
      resultMsg += `账号${index + 1}：查询失败 ❌\n${err}\n`;
      callback();
      return;
    }

    const json = JSON.parse(data);
    if (json.code === 0 && json.data) {
      const signed = json.data.currentSignStatus === 1;
      const days = json.data.consecutiveDays || "未知";

      resultMsg += `账号${index + 1}：\n连续签到天数：${days}\n今日状态：${signed ? "✅ 已签到" : "❌ 未签到"}\n`;

      if (!signed) {
        // 发起签到
        const signUrl = `${BASE_URL}/sign`;
        $httpClient.post({ url: signUrl, headers, body: "{}" }, (err2, resp2, body2) => {
          if (err2) {
            resultMsg += `签到失败：${err2}\n\n`;
          } else {
            const res = JSON.parse(body2);
            resultMsg += res.code === 0 ? "签到成功 ✅\n\n" : `签到失败 ❌：${res.msg || "未知"}\n\n`;
          }
          callback();
        });
      } else {
        resultMsg += `\n`;
        callback();
      }
    } else {
      resultMsg += `账号${index + 1}：查询状态失败 ❌：${json.msg || "未知错误"}\n\n`;
      callback();
    }
  });
}

// 串行执行多账号签到
let i = 0;
function next() {
  if (i >= tokens.length) {
    $notification.post("九号出行签到完成", "", resultMsg.trim());
    console.log(resultMsg);
    $done();
    return;
  }
  sign(tokens[i], i, () => {
    i++;
    next();
  });
}

next();
