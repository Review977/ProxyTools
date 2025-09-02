/*
 Delicloud 去广告脚本
 直接清空 banner 返回数据
*/

let body = $response.body;
if (body) {
  try {
    let obj = JSON.parse(body);
    if (obj.data && Array.isArray(obj.data)) {
      obj.data = [];  // 清空广告数组
    }
    body = JSON.stringify(obj);
  } catch (e) {
    console.log("Delicloud 去广告脚本错误: " + e);
  }
}

$done({ body });
