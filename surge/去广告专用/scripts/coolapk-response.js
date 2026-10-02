// ==UserScript==
// @name         CoolApk Adblock Script
// @description  酷安客户端信息流去广告：精准移除 sponsorCard（GroMore/穿山甲广告）、清洗推广轮播卡片
// ==/UserScript==

(function () {
  if (typeof $response === "undefined" || !$response || !$response.body) {
    if (typeof $done !== "undefined") $done({});
    return;
  }

  try {
    var obj = JSON.parse($response.body);

    if (Array.isArray(obj.data)) {
      obj.data = obj.data.filter(function (item) {
        if (!item || typeof item !== "object") return true;

        var template = item.entityTemplate || "";
        var entityId = String(item.entityId || "");
        var extra = item.extraDataArr || {};

        // 1. 过滤 sponsorCard 广告模板或以 sponsorCard 命名的实体
        if (template === "sponsorCard" || entityId.toLowerCase().indexOf("sponsorcard") !== -1) {
          return false;
        }

        // 2. 过滤带有 sponsorType 或 reward_type 的广告卡片
        if (extra.sponsorType || extra.reward_type) {
          return false;
        }

        // 3. 轮播卡片清洗：移除电商返利导购外链；若清洗后无内容则移除整个卡片
        if (template === "imageCarouselCard_1" && Array.isArray(item.entities)) {
          item.entities = item.entities.filter(function (sub) {
            var u = (sub && sub.url) || "";
            return !/u\.jd\.com|s\.click\.taobao\.com|p\.pinduoduo\.com/i.test(u);
          });
          if (item.entities.length === 0) {
            return false;
          }
        }

        return true;
      });
    }

    if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
      ["splash", "splash_list", "ad", "ads"].forEach(function (k) {
        if (obj.data[k]) delete obj.data[k];
      });
    }

    $done({ body: JSON.stringify(obj) });
  } catch (e) {
    $done({});
  }
})();
