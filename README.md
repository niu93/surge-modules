# Surge 去广告模块

仅发布模块、脚本和说明，不包含个人 HAR、账户、节点、令牌或证书私钥。

## 高德地图：v0.4.0 测试版

保留 v0.3.0 的开屏和打车活动弹窗处理，新增两处**已核验素材的精准过滤**：

1. 目的地输入框旁的“当单立减 3 元”红包展示。
2. 地图右侧“50 元通勤超便宜”营销浮标。

**本次未处理顶部蓝色“代驾低至 6.6 元”横幅。** 现有样本未确认它的精确横版配置，不能用同活动弹窗或其他营销皮肤冒充已定位。底栏“探索”“长按说话”也仍未实现隐藏。

### 固定安装与更新地址

```text
https://raw.githubusercontent.com/niu93/surge-modules/main/Amap.sgmodule
```

首次在 Surge 模块管理中从 URL 安装；已经安装的远程模块执行更新即可，确认说明为 v0.4.0。停用旧本地版或其他重复模块。

需要 Surge iOS 5.9.1+，开启重写、脚本、MITM，并信任自己生成的 CA。首次下载或更新固定版本脚本需要可访问 GitHub Raw。远程托管本身不会自动生成新规则，手机端是否自动更新以当前 Surge 版本为准。

### 两处新增过滤的边界

- `/ws/promotion-web/resource`：只在 `data.bubble["5303"]` 中过滤匹配已核验橙色竖券背景、且包含“当单立减”奖项的条目；保留同列表未知项、其他气泡和回调字段。
- `/ws/promotion-web/resource/home`：只在 `data.other.data.icon.icon_list` 中过滤匹配已核验通勤图片、且 `inner_type` 为 5601 的条目。不会清空整个图标区，不改 `data.banner` 活动专区。
- 条件按素材而非数组序号匹配，图片变换 query 不影响匹配；素材路径更换后可能失效，不保证自动适配所有活动。
- 不修改目的地输入框、订单状态、报价、付款或安全接口，不以禁用业务功能代替移除营销展示。

相关图片只从无查询参数的公开 CDN 匿名核验，不重放带凭证的业务请求，不公开抓包正文。

### 保留的旧功能

- 实时开屏接口 `/ws/aos/alimama/splash_screen_rt` 精确拒绝。
- 旧开屏接口 `/ws/valueadded/alimama/splash_screen` 本地返回 HTTP 200 / `{}`。
- 打车促销 `/ws/promotion-web/resource` 的 `data.popup.popup_list` 与 `data.popup.dataList[].protocol.popup_list` 定向清空，移除已空的纯促销渲染项；未知结构和混合卡片其他内容保留。

不处理会员体验卡邀请、首次使用协议、订单、付款、安全提醒等其他接口。开屏拒绝可能引起重试、留白或备用接口回退。

### 脚本、MITM 与隐私

源码为 [`amap-taxi-popup.js`](./amap-taxi-popup.js)，模块引用已经校验的固定提交，避免 main 源码漂移。脚本只修改本地 JSON，不发网络请求，不记录敏感正文；非 200、非法 JSON、字段缺失或结构不符时透传。256 KiB 以上响应由 Surge 跳过脚本。

MITM 主机与 v0.3.0 相同：`m5.amap.com`、`amap-aos-info-nogw.amap.com`、`m5-zb.amap.com`。按主机解密意味着这些主机的其他 HTTPS 请求也可能被解密，不只是广告路径；不关闭服务端证书验证。

不公开 Cookie、Token、设备标识、坐标、手机号、订单号、出行数据或 CA 私钥。抓包结束后关闭“捕获流量”。

### 验证与回滚

已完成 39 项本地 JavaScript 逻辑测试，含真实促销响应及两处精准变化核对；其他图标、气泡、横幅与业务字段保持不变。另做模块、精确 URL 正反例、原规则不变及 HAR 离线匹配检查。

**未完成 Surge 内核运行及真机显示、空占位、业务回归测试。** 离线通过不等于手机上必然去掉。更新后重启高德进入打车页，若有空白占位、卡顿、脚本错误或业务异常，先停用回滚，不要驾驶时操作。

改动前已保存 v0.3.0 模块、说明、脚本及模块固定引用的源码依赖。旧版固定回滚地址：

```text
https://raw.githubusercontent.com/niu93/surge-modules/606a1810e257eeab710f9b4cba5e3742a7dcb152/Amap.sgmodule
```

回滚时停用新版，再安装该固定地址，避免新旧同时生效。

## 来源

旧开屏 Map Local 参考 [Repcz/Tool 中标注来源为可莉的模块](https://github.com/Repcz/Tool/blob/X/Surge/Module/Kelee/Amap_remove_ads.sgmodule)。本仓库未照搬其全部精简规则；其他新增规则依据本地脱敏分析与公开营销素材核验，不公开原始 HAR。
