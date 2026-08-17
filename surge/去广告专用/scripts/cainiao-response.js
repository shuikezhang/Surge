// 菜鸟 iOS 去广告：Surge http-response 脚本
//
// Adapted for Surge from the public Loon implementation by
// RuCu6 / Keywos / 可莉 (luestr/ProxyResource), with the endpoint
// set kept conservative and cross-checked against two iOS PCAPs.
// The script only changes known ad/promotion response payloads.

(function () {
  var url = ($request && $request.url) || "";
  var body = $response && $response.body;

  // Equivalent to Loon's reject-dict: return a valid empty JSON object
  // instead of closing the connection, which is less likely to trigger
  // an app error or retry loop.
  var returnEmptyObject = [
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

  function containsAny(value, list) {
    for (var i = 0; i < list.length; i++) {
      if (value.indexOf(list[i]) !== -1) return true;
    }
    return false;
  }

  if (containsAny(url, returnEmptyObject)) {
    $done({ status: 200, body: "{}" });
    return;
  }

  if (typeof body !== "string" || body.length === 0) {
    $done({});
    return;
  }

  var obj;
  try {
    obj = JSON.parse(body);
  } catch (e) {
    // Never damage a non-JSON business response.
    $done({});
    return;
  }

  var changed = false;

  // 首页/物流详情推广位：these numeric keys are promotion slots,
  // not package or tracking data.
  if (url.indexOf("mtop.cainiao.guoguo.nbnetflow.ads.mshow") !== -1) {
    if (obj && obj.data && typeof obj.data === "object") {
      var slots = [
        "10", "498", "328", "366", "369", "615", "616", "727",
        "793", "954", "1275", "1308", "1316", "1332", "1340",
        "1391", "1410", "1428", "1524", "1525", "1638", "1910"
      ];
      for (var s = 0; s < slots.length; s++) {
        if (Object.prototype.hasOwnProperty.call(obj.data, slots[s])) {
          delete obj.data[slots[s]];
          changed = true;
        }
      }
    }
  }

  // 我的页面推广列表与红点。
  if (url.indexOf("mtop.cainiao.guoguo.nbnetflow.ads.show") !== -1) {
    if (obj && obj.data && Array.isArray(obj.data.result)) {
      var oldResult = obj.data.result;
      var groupIds = ["common_header_banner", "entertainment", "interests", "kuaishou_banner"];
      var itemIds = ["29338", "29339", "32103", "33927", "36649"];
      var newResult = [];
      for (var r = 0; r < oldResult.length; r++) {
        var item = oldResult[r] || {};
        var mapper = item.materialContentMapper || {};
        var remove = false;
        if (mapper.adItemDetail) remove = true;
        if (mapper.bgImg && mapper.advRecGmtModifiedTime) remove = true;
        if (groupIds.indexOf(mapper.group_id) !== -1) remove = true;
        if (itemIds.indexOf(String(item.id)) !== -1) remove = true;
        if (!remove) {
          if (mapper.show_tips_content) {
            mapper.show_tips_content = "";
            changed = true;
          }
          newResult.push(item);
        } else {
          changed = true;
        }
      }
      obj.data.result = newResult;
    }
  }

  // 取件空页面中的推广/反馈辅助组件。
  if (url.indexOf("mtop.cainiao.nbpresentation.pickup.empty.page.get") !== -1) {
    var pickupNames = [
      "guoguo_pickup_empty_page_relation_add",
      "guoguo_pickup_helper_feedback",
      "guoguo_pickup_helper_tip_view"
    ];
    var content = obj && obj.data && obj.data.result && obj.data.result.content;
    if (content && Array.isArray(content.middle)) {
      var oldMiddle = content.middle;
      content.middle = oldMiddle.filter(function (entry) {
        var name = entry && entry.template && entry.template.name;
        var keep = pickupNames.indexOf(name) === -1;
        if (!keep) changed = true;
        return keep;
      });
    }
  }

  // 首页结构化组件：保留必要功能入口，移除 banner/promotion，
  // 同时清除金刚区气泡和图标角标。
  if (url.indexOf("mtop.cainiao.nbpresentation.protocol.homepage.get") !== -1) {
    var result = obj && obj.data && obj.data.result;
    if (result && Array.isArray(result.dataList)) {
      var allowIcons = ["appCentreMore", "dzb", "jdj", "kddh", "yfjsq"];
      var list = [];
      for (var d = 0; d < result.dataList.length; d++) {
        var section = result.dataList[d] || {};
        var type = String(section.type || "");
        if (type.indexOf("banner_area") !== -1 || type.indexOf("promotion") !== -1) {
          changed = true;
          continue;
        }
        if (type.indexOf("kingkong") !== -1 && section.bizData && Array.isArray(section.bizData.items)) {
          section.bizData.items.forEach(function (icon) {
            if (icon && (icon.rightIcon !== null || icon.bubbleText !== null)) changed = true;
            if (icon) {
              icon.rightIcon = null;
              icon.bubbleText = null;
            }
          });
        }
        if (type.indexOf("icons_scroll") !== -1 && section.bizData && Array.isArray(section.bizData.items)) {
          section.bizData.items = section.bizData.items.filter(function (icon) {
            var keep = icon && allowIcons.indexOf(icon.key) !== -1;
            if (!keep) changed = true;
            return keep;
          });
          section.bizData.items.forEach(function (icon) {
            if (icon) {
              icon.rightIcon = null;
              icon.bubbleText = null;
            }
          });
        }
        list.push(section);
      }
      result.dataList = list;
    }
  }

  // 消息中心：保留物流消息，过滤活动/营销会话。
  if (url.indexOf("mtop.nbfriend.message.conversation.list") !== -1) {
    if (obj && obj.data && Array.isArray(obj.data.data)) {
      var before = obj.data.data.length;
      obj.data.data = obj.data.data.filter(function (entry) {
        return entry && String(entry.conversationId || "").indexOf("logistic_message") !== -1;
      });
      if (obj.data.data.length !== before) changed = true;
    }
  }

  // 我的页面：移除活动、权益、横幅和推广内容，保留订单/包裹区。
  if (url.indexOf("mtop.cainiao.app.mine.main") !== -1) {
    if (obj && obj.data && typeof obj.data === "object") {
      ["activity", "asset", "banner", "content"].forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(obj.data, key)) {
          delete obj.data[key];
          changed = true;
        }
      });
    }
  }

  if (changed) {
    $done({ body: JSON.stringify(obj) });
  } else {
    $done({});
  }
})();
