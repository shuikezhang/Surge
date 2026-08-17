// 菜鸟 iOS 去广告：Surge http-request 脚本
// 将可莉 Loon 中的 reject-dict 改为 Surge 原生 mock response：
// HTTP 200 + 合法空 JSON 对象，避免直接断连引发 App 重试或报错。

(function () {
  var url = ($request && $request.url) || "";
  var headers = ($request && $request.headers) || {};
  var userAgent = "";

  Object.keys(headers).some(function (key) {
    if (String(key).toLowerCase() === "user-agent") {
      userAgent = String(headers[key] || "");
      return true;
    }
    return false;
  });

  var cainiaoDispatch = /^https?:\/\/amdc\.m\.taobao\.com\/amdc\/mobileDispatch/i.test(url);
  var cainiaoUA = /^Cainiao4iPhone/i.test(userAgent);

  var mockEndpoints = [
    "mtop.cainiao.app.home.tabbar.marketing.get",
    "mtop.cainiao.adkeyword.get",
    "mtop.cainiao.cncommunity.my.station.query",
    "mtop.cainiao.guoguo.nbnetflow.ads.batch.show.v2",
    "mtop.cainiao.guoguo.nbnetflow.ads.expose.mreply",
    "mtop.cainiao.guoguo.nbnetflow.ads.index",
    "mtop.cainiao.nbopen.miniapp.recommend.cpc",
    "mtop.cainiao.nbmensa.research.researchservice.acquire",
    "mtop.cainiao.nbmensa.research.researchservice.event",
    "mtop.cainiao.nbmensa.research.researchservice.close",
    "mtop.cainiao.nbpresentation.homepage.merge",
    "mtop.cainiao.nbpresentation.tabbar.marketing",
    "mtop.com.cainiao.cnactivitycenter",
    "mtop.com.cainiao.cncreditmarket.hit.getactivityhit",
    "mtop.com.cainiao.longquan.place.getpageresourcecontent",
    "mtop.cainiao.adx.flyad.getad"
  ];

  var shouldMock = (cainiaoDispatch && cainiaoUA) || mockEndpoints.some(function (endpoint) {
    return url.indexOf(endpoint) !== -1;
  });

  if (!shouldMock) {
    $done({});
    return;
  }

  $done({
    response: {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: "{}"
    }
  });
})();
