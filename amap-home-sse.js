/* Amap home SSE presentation filter v0.1.4-test7.
 * Exact home_qs response only. No network, storage, notifications or logging.
 * Preserve navigation/local cards and home/work shortcut layouts.
 */
(function () {
  var result = {};
  try {
    var object = function (x) { return x !== null && typeof x === "object" && !Array.isArray(x); };
    var target = /^https:\/\/ai\.amap\.com\/v1\/ai_rec\/home_qs(?:\?|$)/i;
    // Protect the whole layout, not only the visible shortcut labels.
    var protectedCard = function (x, depth) {
      if (depth > 40 || x === null || typeof x !== "object") return false;
      if (object(x)) {
        if (x.card_id === "QSLocalCardContainer" || x.localCard === true) return true;
        if (object(x.bizData) && object(x.bizData.data) && Array.isArray(x.bizData.data.freqSpot)) return true;
        if (object(x.scrollButton) && Array.isArray(x.scrollButton.list)) return true;
      }
      var keys = Object.keys(x);
      for (var i = 0; i < keys.length; i++) if (protectedCard(x[keys[i]], depth + 1)) return true;
      return false;
    };
    var couponCard = function (x) {
      if (!object(x) || x.card_id !== "C2TaxiBizContainer" || !object(x.data)) return false;
      var cd = x.data.cardData;
      return object(cd) && Array.isArray(cd.dataList) && cd.dataList.some(function (item) {
        var info = object(item) && object(item.protocol) ? item.protocol.cardInfo : null;
        return object(info) && info.title === "打车惊喜优惠券";
      });
    };
    var recommendation = function (item) {
      if (!object(item) || protectedCard(item, 0)) return false;
      if (couponCard(item)) return true;
      return item.card_id === "NestCard" && object(item.data) &&
        object(item.data.sceneConfig) && item.data.sceneConfig.sceneId === "home_qs";
    };
    var clean = function (event) {
      if (!object(event) || !object(event.component) || event.component.type !== "container") return false;
      var comp = event.component.data;
      if (!object(comp) || comp.type !== "pmt" || !object(comp.data)) return false;
      var payload = comp.data;
      if (payload.template !== "aiPmtGenerate" || !object(payload.modules)) return false;
      var changed = false;
      Object.keys(payload.modules).forEach(function (key) {
        var module = payload.modules[key];
        if (!object(module) || !object(module.data)) return;
        if (module.card_id === "QSLocalCardContainer" || module.data.localCard === true) return;
        if (module.card_id !== "WaterfallContainer" && protectedCard(module, 0)) return;
        if (module.card_id === "WaterfallContainer" && Array.isArray(module.data.list)) {
          var before = module.data.list;
          var after = before.filter(function (item) { return !recommendation(item); });
          if (after.length !== before.length) {
            module.data.list = after;
            if (after.length === 0 && typeof module.data.title === "string") module.data.title = "";
            changed = true;
          }
        }
        // Only a directly identified coupon may be removed as a standalone PMT.
        // Functional taxi QS without this coupon title stays untouched.
        if (couponCard(module)) {
          delete payload.modules[key];
          if (object(payload.regions)) Object.keys(payload.regions).forEach(function (region) {
            if (Array.isArray(payload.regions[region])) {
              payload.regions[region] = payload.regions[region].filter(function (name) { return name !== key; });
            }
          });
          changed = true;
        }
      });
      return changed;
    };
    if (typeof $request !== "undefined" && target.test($request.url || "") &&
        typeof $response !== "undefined" && $response.status === 200 && typeof $response.body === "string") {
      var chunks = $response.body.split(/(\r\n\r\n|\n\n|\r\r)/);
      var changed = false;
      for (var c = 0; c < chunks.length; c += 2) {
        var lines = chunks[c].split(/(\r\n|\n|\r)/);
        var indexes = [], values = [];
        for (var j = 0; j < lines.length; j += 2) {
          var m = /^data(?:: ?(.*))?$/.exec(lines[j]);
          if (m) { indexes.push(j); values.push(m[1] || ""); }
        }
        if (indexes.length === 0) continue;
        try {
          var event = JSON.parse(values.join("\n"));
          if (!clean(event)) continue;
          lines[indexes[0]] = "data: " + JSON.stringify(event);
          for (var k = 1; k < indexes.length; k++) lines[indexes[k]] = ": filtered multiline data continuation";
          chunks[c] = lines.join("");
          changed = true;
        } catch (_) { /* Preserve invalid, empty, non-JSON or incomplete frames byte-for-byte. */ }
      }
      if (changed) result = {body: chunks.join("")};
    }
  } catch (_) { result = {}; }
  $done(result);
})();
