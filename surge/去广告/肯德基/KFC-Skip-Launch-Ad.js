/* KFC launch ad remover. Confirmed from Surge capture on 2026-11-25. */
(function () {
  try {
    if (!$response || typeof $response.body !== "string") return $done({});
    var data = JSON.parse($response.body);
    if (!data || !data.body || !Array.isArray(data.body.bootStrapAd)) return $done({});
    if (data.body.bootStrapAd.length === 0) return $done({});
    data.body.bootStrapAd = [];
    console.log("[KFC] Cleared bootStrapAd.");
    $done({ body: JSON.stringify(data) });
  } catch (e) {
    console.log("[KFC] Invalid response; unchanged.");
    $done({});
  }
})();
