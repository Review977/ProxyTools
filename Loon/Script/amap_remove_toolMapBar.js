const url = $request.url;
if (!$response.body) $done({});
let obj = JSON.parse($response.body);

if (url.includes("/car/order/content_info")) {
  if (obj?.data?.lubanData?.toolMapBar?.dataList?.length > 0) {
    obj.data.lubanData.toolMapBar.dataList = [];
  }
}

$done({ body: JSON.stringify(obj) });
