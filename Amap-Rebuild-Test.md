# 高德：以第一版为基线的原生重写测试

版本：**v0.1.1-test1**。需要 Surge iOS **5.14.0+**（当前最新版 TF 支持该功能）。独立测试文件，不替换仍为 v0.1.0 的 `Amap.sgmodule`。

## 为什么重写

用户已反馈 v0.4 未达到去广告效果。失败原因尚未通过设备请求命中记录确认，不能断言是脚本、缓存、MITM、数据变化或其他因素。

本版以最初 v0.1 的旧开屏 Map Local 为底稿，新增 Surge 原生 jq Body Rewrite：

- 不下载、不执行远程 JavaScript，无脚本 CDN 和 JS 触发条件依赖。
- 不依赖上一版核验的具体图片文件名，改按已知栏位和营销项类型过滤，素材换图不影响这些条件。
- 不恢复 v0.2 新增的实时开屏拒绝，不拿第四版整个模块当基础。

这只是可验证的新实现方向，不是已确认根因的修复，更不代表手机上已经有效。

## 目标及处理边界

1. **活动弹窗**：在 `/ws/promotion-web/resource` 清空 `data.popup.popup_list` 及 `data.popup.dataList[].protocol.popup_list`；移除空的纯促销渲染项，保留未知/混合内容。
2. **目的地旁红包**：同接口的 `data.bubble["5303"]` 中，移除包含 `award_title="当单立减"` 的项。不再校验具体图片，因此会移除这个栏位里换了素材或金额的同类促销气泡，而不只限于原截图的 3 元项。其他栏位与未识别项保留。
3. **通勤浮标**：在 `/ws/promotion-web/resource/home` 的 `data.other.data.icon.icon_list` 中移除 `inner_type=5601` 的图标。按该类营销浮标处理，换图后仍可能命中；也可能影响该类型的其他活动图标。不清空整个图标区，不改 `data.banner`。

**不处理**未准确定位的蓝色“代驾低至6.6元”横幅，也不处理底栏“探索”“长按说话”。不匹配订单 `content_info`、协议/会员主题、付款或地图瓦片等接口。

未知 JSON 结构保留；jq 执行异常回退为原 JSON；非 JSON 由 Surge 按官方行为跳过。原生 Body Rewrite 同样需要缓冲正文（iOS 当前手册上限为 1 MB），不是无内存代价。

## 单独安装与回滚

测试模块地址：

https://raw.githubusercontent.com/niu93/surge-modules/main/Amap-Rebuild-Test.sgmodule

1. **先停用现有高德模块及重复高德脚本**，再从上面的 URL 安装测试版。不要与 v0.1 或 v0.4 同时启用，否则不容易判断生效来源。
2. 开启重写和 MITM，使用你自己生成并已完全信任的 CA。本版不需要远程脚本下载，不需要为它开启脚本功能。
3. 确认模块详情包含三条 `http-response-jq`。MITM 有 `m5.amap.com` 和 `m5-zb.amap.com`，无排除或禁用项覆盖它们。解密是主机级，不仅是广告路径。
4. 完全退出高德再进打车页，检查红包、通勤浮标及活动弹窗，留意是否留空位或影响其他功能。不要驾驶时操作，也不要求删除 App 或重置全部配置。
5. 若仍未生效，只需先看目标请求详情中的重写命中说明、实际返回数据及脚本/重写警告。截图遮住地址和账号信息即可，不必反复上传整份 HAR。
6. 回滚：停用测试模块，重新启用仍保持原样的 v0.1 模块。不删除节点或 CA，不关闭其他模块所需的功能。

原固定地址继续是 v0.1.0：

https://raw.githubusercontent.com/niu93/surge-modules/main/Amap.sgmodule

v0.1 固定提交回滚地址：

https://raw.githubusercontent.com/niu93/surge-modules/0bef50ffcfd0d73cf054b72bbc8337c1765e0f55/Amap.sgmodule

此前抓包未走第一版的旧开屏接口，因此本版继承的旧开屏规则也可能不生效；不将其说成全部开屏已拦截。

## 已验证与未验证

- 在本地 jq 1.7.1 运行 **57 项结构与过滤测试**，并检查 233 个可解析 HAR 响应的 jq 执行没有报错。
- **12 组 URL 边界测试**通过；388 条抓包中，规则分别匹配已分析的两条促销接口。
- 对真实促销响应核对：只产生预期的促销列表变化，其他数据保留。
- 核对第一版 Map Local 原文保留，无 URL Rewrite 或 Script 段。
- **未验证**目标 TF 内核加载、手机实时命中、UI 实际隐藏、缓存/空占位及真实业务回归。离线测试只验证算法，不保证真机效果。

无 HAR、凭证、位置、节点或 CA 私钥上传。

依据：[官方 Body Rewrite](https://manual.nssurge.com/http/body-rewrite.html)、[MITM](https://manual.nssurge.com/http/mitm.html)。
