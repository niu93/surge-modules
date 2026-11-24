/* Surge http-response script for Pinduoduo iOS 8.29.0. */
(function () {
  try {
    if (!$response || typeof $response.body !== "string") return $done({});
    var data = JSON.parse($response.body);
    var result = data && data.result;
    if (!result || !Array.isArray(result.bottom_tabs) || !Array.isArray(result.buffer_bottom_tabs)) return $done({});
    var wanted = [{id:"26",link:"index.html"},{id:"29",link:"chat_list.html"},{id:"30",link:"personal.html"}];
    function canonicalFrom(tabs) {
      var out = [];
      for (var i=0; i<wanted.length; i++) {
        var spec = wanted[i];
        var matches = tabs.filter(function(tab) {
          return tab && typeof tab === "object" && String(tab.id) === spec.id && typeof tab.link === "string" && tab.link.split(/[?#]/)[0] === spec.link;
        });
        if (matches.length !== 1) return null;
        out.push(matches[0]);
      }
      return out;
    }
    var a = canonicalFrom(result.bottom_tabs);
    var b = canonicalFrom(result.buffer_bottom_tabs);
    if (!a || !b) return $done({});
    var after = JSON.stringify(a);
    if (JSON.stringify(result.bottom_tabs) === after && JSON.stringify(result.buffer_bottom_tabs) === after) return $done({});
    result.bottom_tabs = a;
    result.buffer_bottom_tabs = JSON.parse(after);
    console.log("[PDD v0.3.0] Canonicalized bottom tabs.");
    $done({body: JSON.stringify(data)});
  } catch (e) {
    $done({});
  }
})();
