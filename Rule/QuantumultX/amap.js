// 2023-01-06 22:42

if (!$response.body) $done({});
const url = $request.url;
let obj = JSON.parse($response.body);

if (url.includes("/ws/faas/amap-navigation/main-page")) {
  // 高德地图-首页卡片
  if (obj.data && obj.data.cardList) {
    obj.data.cardList = obj.data.cardList.filter((item) => {
      return item.dataKey === "LoginCard";
    });
  }
} else if (url.includes("/ws/msgbox/pull")) {
  // 高德地图-首页消息
  if (obj.msgs) {
    obj.msgs = [];
  } 
} else if (url.includes("/ws/faas/amap-navigation/main-page-assets")) {
  // 高德地图-首页消息
  if (obj.data.pull3 && obj.data.pull3.msgs) {
    obj.data.pull3.msgs = [];
  }
} else if (url.includes("/ws/shield/dsp/profile/index/nodefaasv3")) {
  if (obj.data && obj.data.cardList) {
    obj.data.cardList = obj.data.cardList.filter((item) => {
      return (
        // item.dataKey === "AnnualBillCardV2" || // 年度报告
        item.dataKey === "MyOrderCard" || // 我的订单
        item.dataKey === "GdRecommendCard" // 高德推荐
        // item.dataKey === "SceneVehicleCard_recommend" || // 我的车辆
        // item.dataKey === "SceneVehicleCard_function" // 我的车辆
        // item.dataKey === "PopularActivitiesCard" // 热门活动
        // item.dataKey === "GameExcitation" || // 小德爱消除
        // item.dataKey === "GoodsShelvesCard" || // 精选服务
        // item.dataKey === "DiyMap_function" || // DIY 地图
      );
    });
  }
}

body = JSON.stringify(obj);
$done({ body });