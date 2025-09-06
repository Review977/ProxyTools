/********************************
CCBLife Remove Splash Ad - Only
********************************/

const url = $request.url;
if (!$response.body) $done({});
let body = $response.body;

// 开屏广告的 key
const blockKeys = [
  "A3341A009",   // 开屏广告
];

if (containKey(url, blockKeys)) {
  // 直接返回 204，无内容
  $done({ body: "", headers: "", status: "HTTP/1.1 204 No Content" });
} else {
  $done({});
}

function containKey(url, keys) {
  return keys.some(key => url.includes(key));
}
