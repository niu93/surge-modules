/* PDD bottom tabs v0.2.0: FOUR-TAB COMPATIBILITY EXPERIMENT.
 * Not device-verified. Reuses complete existing tab objects only.
 * Scope: result.bottom_tabs and result.buffer_bottom_tabs, homepage/hub.
 */
(function () {
  try {
    var data = JSON.parse($response.body);
    var r = data && data.result;
    if (!r || !Array.isArray(r.bottom_tabs) || !Array.isArray(r.buffer_bottom_tabs)) return $done({});
    var specs = [[26, 0, "index.html"], [31, 5, "classification.html"], [29, 3, "chat_list.html"], [30, 4, "personal.html"]];
    var arrays = [r.bottom_tabs, r.buffer_bottom_tabs];
    var selected = [];
    for (var i = 0; i < specs.length; i++) {
      var spec = specs[i];
      var matches = arrays.map(function (tabs) {
        return tabs.filter(function (t) {
          return t && String(t.id) === String(spec[0]) && Number(t.group) === spec[1] && typeof t.link === "string" && t.link.split(/[?#]/)[0] === spec[2];
        });
      });
      // Repetition across arrays is normal; duplicates within either array are not.
      if (matches[0].length > 1 || matches[1].length > 1) return $done({});
      var tab = matches[0][0] || matches[1][0];
      if (!tab) return $done({});
      selected.push(tab);
    }
    var encoded = JSON.stringify(selected);
    if (JSON.stringify(r.bottom_tabs) === encoded && JSON.stringify(r.buffer_bottom_tabs) === encoded) return $done({});
    // Commit only after every identity check passes; leave skins and all other fields intact.
    r.bottom_tabs = selected;
    r.buffer_bottom_tabs = JSON.parse(encoded);
    console.log("[PDD v0.2.0] Four-tab experiment applied: Home, Categories, Chat, Personal.");
    $done({ body: JSON.stringify(data) });
  } catch (e) {
    console.log("[PDD v0.2.0] Invalid response; unchanged.");
    $done({});
  }
})();
