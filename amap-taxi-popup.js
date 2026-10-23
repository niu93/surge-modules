/*
 * Amap taxi promotions filter, v0.4.0.
 * Retains v0.3 popup handling; filters two verified marketing badge assets.
 * Does not remove the unverified blue chauffeur banner or business input fields.
 * No network calls and no sensitive logging.
 */
(function () {
  var result = {};
  try {
    var target = /^https:\/\/m5-zb\.amap\.com\/ws\/promotion-web\/resource(?:\/home)?(?:\?|$)/i;
    var main = /^https:\/\/m5-zb\.amap\.com\/ws\/promotion-web\/resource(?:\?|$)/i;
    var home = /^https:\/\/m5-zb\.amap\.com\/ws\/promotion-web\/resource\/home(?:\?|$)/i;
    var isObject = function (v) {
      return v !== null && typeof v === "object" && !Array.isArray(v);
    };
    var assetKey = function (value) {
      if (typeof value !== "string") return "";
      var match = /^https?:\/\/([^/?#]+)(\/[^?#]*)/i.exec(value);
      return match ? match[1].toLowerCase() + match[2] : "";
    };
    var couponAsset = "img.alicdn.com/imgextra/i4/O1CN01gvP17X27N81yQCzPh_!!6000000007784-2-tps-132-143.png";
    var commuteAsset = "img.alicdn.com/imgextra/i3/O1CN01lvJGh21gdAKDpXHVc_!!6000000004164-1-tps-240-320.gif";
    if (typeof $request !== "undefined" && target.test($request.url || "") &&
        typeof $response !== "undefined" && $response.status === 200 &&
        typeof $response.body === "string" && $response.body.length > 0) {
      var obj = JSON.parse($response.body);
      if (isObject(obj) && isObject(obj.data)) {
        var changed = false;
        if (main.test($request.url || "")) {
          var popup = obj.data.popup;
          if (isObject(popup)) {
            if (Array.isArray(popup.popup_list) && popup.popup_list.length > 0) {
              popup.popup_list = [];
              changed = true;
            }
            if (Array.isArray(popup.dataList)) {
              popup.dataList = popup.dataList.filter(function (item) {
                if (!isObject(item) || !isObject(item.protocol) ||
                    !Array.isArray(item.protocol.popup_list)) return true;
                if (item.protocol.popup_list.length === 0) return true;
                item.protocol.popup_list = [];
                changed = true;
                return Object.keys(item.protocol).some(function (key) {
                  return key !== "popup_list";
                });
              });
            }
          }
          // Only the verified destination-side coupon, not all bubbles.
          if (isObject(obj.data.bubble) && Array.isArray(obj.data.bubble["5303"])) {
            var originalCoupons = obj.data.bubble["5303"];
            var keptCoupons = originalCoupons.filter(function (item) {
              if (!isObject(item) || assetKey(item.background) !== couponAsset ||
                  !Array.isArray(item.award_list)) return true;
              return !item.award_list.some(function (award) {
                return isObject(award) && award.award_title === "当单立减";
              });
            });
            if (keptCoupons.length !== originalCoupons.length) {
              obj.data.bubble["5303"] = keptCoupons;
              changed = true;
            }
          }
        }
        if (home.test($request.url || "")) {
          var other = obj.data.other;
          var icon = isObject(other) && isObject(other.data) ? other.data.icon : null;
          if (isObject(icon) && Array.isArray(icon.icon_list)) {
            var originalIcons = icon.icon_list;
            var keptIcons = originalIcons.filter(function (item) {
              return !isObject(item) || String(item.inner_type) !== "5601" ||
                assetKey(item.pic_url) !== commuteAsset;
            });
            if (keptIcons.length !== originalIcons.length) {
              icon.icon_list = keptIcons;
              changed = true;
            }
          }
        }
        if (changed) result = {body: JSON.stringify(obj)};
      }
    }
  } catch (_) {
    result = {};
  }
  $done(result);
})();
