/*
 * Amap taxi coupon/activity popup filter, v0.3.0.
 * Scope: /ws/promotion-web/resource only. No network calls or sensitive logging.
 * Does not change order, payment, safety, consent, membership or navigation APIs.
 */
(function () {
  var result = {};
  try {
    var target = /^https:\/\/m5-zb\.amap\.com\/ws\/promotion-web\/resource(?:\?|$)/i;
    if (typeof $request !== "undefined" && target.test($request.url || "") &&
        typeof $response !== "undefined" && $response.status === 200 &&
        typeof $response.body === "string" && $response.body.length > 0) {
      var obj = JSON.parse($response.body);
      var isObject = function (v) {
        return v !== null && typeof v === "object" && !Array.isArray(v);
      };
      if (isObject(obj) && isObject(obj.data) && isObject(obj.data.popup)) {
        var popup = obj.data.popup;
        var changed = false;
        // Legacy popup list; preserve its container and all other response fields.
        if (Array.isArray(popup.popup_list) && popup.popup_list.length > 0) {
          popup.popup_list = [];
          changed = true;
        }
        // Schema-rendered version of the same promotion list.
        if (Array.isArray(popup.dataList)) {
          popup.dataList = popup.dataList.filter(function (item) {
            if (!isObject(item) || !isObject(item.protocol) ||
                !Array.isArray(item.protocol.popup_list)) return true;
            var list = item.protocol.popup_list;
            if (list.length === 0) return true;
            item.protocol.popup_list = [];
            changed = true;
            // Drop an emptied promotion-only renderer, not an unknown mixed card.
            return Object.keys(item.protocol).some(function (key) {
              return key !== "popup_list";
            });
          });
        }
        if (changed) result = {body: JSON.stringify(obj)};
      }
    }
  } catch (_) {
    // Invalid JSON or unknown structures: pass the original response through.
    result = {};
  }
  $done(result);
})();
