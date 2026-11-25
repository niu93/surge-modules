/* Pinduoduo 8.33 bottom-tab filter. */
(function () {
  try {
    if (!$response || typeof $response.body !== "string") return $done({});
    var data = JSON.parse($response.body), changed = false;
    var allowed = { "26": true, "29": true, "30": true };

    function visit(value) {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      Object.keys(value).forEach(function (key) {
        var child = value[key];
        if (key === "bottom_tabs" || key === "buffer_bottom_tabs" || key === "bottomTabs" || key === "bufferBottomTabs") {
          if (Array.isArray(child)) {
            var filtered = child.filter(function (tab) { return tab && allowed[String(tab.id)]; });
            if (filtered.length !== child.length) {
              value[key] = filtered;
              changed = true;
            }
          }
        } else if (key === "icon_set" || key === "slide_icon_set") {
          if (Array.isArray(child)) {
            var icons = child.filter(function (item) {
              return !(item && (String(item.id) === "473" || item.title === "限时秒杀"));
            });
            if (icons.length !== child.length) {
              value[key] = icons;
              changed = true;
            }
          }
        } else if (key === "selected_bottom_skin" || key === "selectedBottomSkin") {
          if (child && typeof child === "object") {
            ["11", "14"].forEach(function (skinId) {
              if (Object.prototype.hasOwnProperty.call(child, skinId)) {
                delete child[skinId];
                changed = true;
              }
            });
          }
        }
        visit(value[key]);
      });
    }

    visit(data);
    if (!changed) return $done({});
    $done({ body: JSON.stringify(data) });
  } catch (e) {
    $done({});
  }
})();
