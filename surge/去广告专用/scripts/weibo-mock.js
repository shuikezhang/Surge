// ==UserScript==
// @name         Weibo Adblock & Mock Script
// @description  微博国际版开屏决策与配置 Mock，避免广告 SDK 循环加载
// ==/UserScript==

(function () {
  const url = ($request && $request.url) || "";

  // 1. 开屏广告决策接口：置空广告物料与 waterfall，使客户端不展示广告且直接跳过竞价等待
  if (url.includes("/api/fortune/decisionMaker/")) {
    const mockDecision = {
      launch: {
        "1250852542": {
          cool_time: "86400",
          coldboot_time: "0",
          bidding_timeout: "0",
          floating_range: ["0", "0"],
          vip_enable: "1",
          data: [],
          waterfall: []
        }
      }
    };
    $done({
      response: {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        },
        body: JSON.stringify(mockDecision)
      }
    });
    return;
  }

  // 2. 穿山甲 / 聚合法纳秒级配置：返回合法但无有效广告位策略的 JSON
  if (url.includes("/sdk/v3/conf")) {
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
    return;
  }

  // 兜底放行
  $done({});
})();
