/* Remove chat recommendation goods without touching the home goods feed. */
(function () {
  try {
    if (!$response || typeof $response.body !== "string") return $done({});
    var data = JSON.parse($response.body), changed = false;

    function isGoods(value) {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      var hasId = ["goods_id", "goodsId", "goodsID", "item_id", "itemId"].some(function (key) {
        return value[key] !== undefined && value[key] !== null && String(value[key]) !== "";
      });
      var hasImage = ["image", "image_url", "imageUrl", "thumb_url", "thumbUrl", "hd_url", "hd_thumb_url"].some(function (key) {
        return typeof value[key] === "string" && value[key] !== "";
      });
      return hasId && hasImage && (value.ad !== undefined || value.link_url !== undefined || value.goods_name !== undefined || value.price !== undefined);
    }

    function visit(value) {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        for (var i = value.length - 1; i >= 0; i--) {
          if (isGoods(value[i])) {
            value.splice(i, 1);
            changed = true;
          } else {
            visit(value[i]);
          }
        }
        return;
      }
      Object.keys(value).forEach(function (key) {
        if (key === "goods_list" && Array.isArray(value[key]) && value[key].length) {
          value[key] = [];
          changed = true;
          return;
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
