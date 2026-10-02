// 拼多多首页响应净化脚本
// 针对接口: https://api.pinduoduo.com/api/alexa/homepage/hub*

if ($response && $response.body) {
  try {
    let body = JSON.parse($response.body);
    if (body && body.result) {
      let res = body.result;

      // 1. 去除拼小圈入口
      res.timeline_visible = false;
      res.timeline_in_white = false;
      if (res.home_screen_skin && res.home_screen_skin.timeline) {
        delete res.home_screen_skin.timeline;
      }

      // 2. 清空金刚区（限时秒杀、多多买菜、现金大转盘、多多果园等宫格图标）
      res.icon_set = [];
      res.icon_fold_zone = {};

      // 3. 从模块渲染流中移除拼小圈与金刚区组件
      if (Array.isArray(res.module_order)) {
        res.module_order = res.module_order.filter(
          m => m && m.module_name !== "timeline" && m.module_name !== "icon_set"
        );
      }

      // 4. 去除底部 Tab 栏冗余标签（多多视频、国庆/大促立减等）
      const filterTabs = tabs => {
        if (!Array.isArray(tabs)) return [];
        return tabs.filter(t => {
          if (!t) return false;
          const title = t.title || "";
          const link = t.link || "";
          // 剔除多多视频
          if (title.includes("视频") || link.includes("pdd_live_tab_list") || link.includes("live")) {
            return false;
          }
          // 剔除立减/大促营销Tab
          if (title.includes("立减") || title.includes("大促") || link.includes("attendance")) {
            return false;
          }
          return true;
        });
      };

      if (res.bottom_tabs) {
        res.bottom_tabs = filterTabs(res.bottom_tabs);
      }
      if (res.buffer_bottom_tabs) {
        res.buffer_bottom_tabs = filterTabs(res.buffer_bottom_tabs);
      }
    }
    $done({ body: JSON.stringify(body) });
  } catch (e) {
    $done({});
  }
} else {
  $done({});
}
