// Home-only Emby split routing. No network requests, credentials or persistent state.
function isEmbyHome(network) {
  var n = network || {}, wifi = n.wifi || {}, v4 = n.v4 || {};
  var ssid = String(wifi.ssid || "");
  var router = String(v4.primaryRouter || "");
  var ip = String(v4.primaryAddress || "");
  // Require the known gateway and Wi-Fi subnet; a known other SSID fails closed.
  return router === "192.168.31.185" && /^192\.168\.31\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])$/.test(ip)
    && (ssid === "701" || ssid === "");
}
var home = isEmbyHome(typeof $network === "undefined" ? {} : $network);
var domain = String(typeof $domain === "undefined" ? "" : $domain).toLowerCase().replace(/\.$/, "");
if (domain !== "emby.cole.best") {
  $done({});
} else if (home) {
  // No ttl: do not request caching of a private answer across network changes.
  $done({address: "192.168.1.3"});
} else {
  // Never ask the private home DNS while away.
  $done({server: "1.1.1.1"});
}
