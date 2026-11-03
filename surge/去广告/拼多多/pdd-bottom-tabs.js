/* Surge http-response script. Scope: /api/alexa/homepage/hub only.
 * Keeps Home, Chat and Personal; other bottom tabs are removed.
 * Derived from the provided PDD iOS 8.29.0 HAR; not device-verified.
 */
(function () {
  try {
    if (!$response || typeof $response.body !== "string") return $done({});
    var obj = JSON.parse($response.body);
    var result = obj && obj.result;
    if (!result || typeof result !== "object") return $done({});
    var changed = false;
    var removed = 0;
    var expected = { "26": "index.html", "29": "chat_list.html", "30": "personal.html" };
    ["bottom_tabs", "buffer_bottom_tabs"].forEach(function (key) {
      var tabs = result[key];
      if (!Array.isArray(tabs)) return;
      var seen = {};
      var keep = tabs.filter(function (tab) {
        if (!tab || typeof tab !== "object") return false;
        var id = String(tab.id);
        if (!Object.prototype.hasOwnProperty.call(expected, id)) return false;
        if (typeof tab.link !== "string" || tab.link.split(/[?#]/)[0] !== expected[id]) return false;
        seen[id] = (seen[id] || 0) + 1;
        return true;
      });
      // Fail open if the schema changes or any essential tab is absent/duplicated.
      if (seen["26"] !== 1 || seen["29"] !== 1 || seen["30"] !== 1 || String(keep[0].id) !== "26") return;
      if (keep.length < tabs.length) {
        removed += tabs.length - keep.length;
        result[key] = keep;
        changed = true;
      }
    });
    if (!changed) return $done({});
    console.log("[PDD Bottom Tabs] Removed " + removed + " tab entries across bottom arrays.");
    $done({ body: JSON.stringify(obj) });
  } catch (error) {
    console.log("[PDD Bottom Tabs] Unchanged: parse/schema error.");
    $done({});
  }
})();
