# 高德原生重写测试：v0.1.1-test4

需 Surge iOS 5.14+。保留 test3 的全部五条原生 jq 规则，在同一测试模块新增“我的”页下方已确认展示项精简。无远程 JS，原固定 `Amap.sgmodule` 仍为 v0.1。

## 本次目标

用户指定：“订单到借钱这一栏下面的都去掉”。按截图边界处理：

**保留：**
- 头像、个人资料、设置与顶部入口；
- 足迹卡片、语音包／车标展示；
- 订单、收藏、待评价、钱包卡券、借钱这五个入口，保留原有路由、图标、红点等字段；
- 徽章/账户字段，以及现有规则尚未确认用途的未知卡片；
- 底部导航不动。

**新增过滤的已确认部分：**
- “待评价”入口关联的地点提示卡：仅清空此入口的展示 `tips` 数组，保留入口和待评价数据本身。
- 车辆服务、高德运动、家人地图、店铺入驻、地图共建等下方服务网格：清空入口卡的 `entranceList_2` 展示列表。
- 达人任务、好友动态、彩色活动入口和猜你喜欢信息流卡片：只从个人页 `cardList` 移除对应已核验 `dataKey`，不阻断共用信息流接口。

不删除真实订单、收藏、评价、钱包资产、账户或会员数据，不代为执行借款、支付或其他业务操作。隐藏服务入口意味着此页不能再点击这些快捷入口，但不等于注销或关闭功能。

## 证据与精确范围

最新 `2026-10-24-044027.har` 有88条请求，**没有录到个人页配置接口**，不能称已从本次抓包确认当前实时结构。已有旧抓包 `2026-10-23-134133.har` 的第116项（0基索引）包含完整个人页卡片列表，与截图中的上下两行入口和卡片标签可以对应。

新增规则只匹配：

`https://m5.amap.com/ws/shield/dsp/profile/index/nodefaasv3`

处理 `data.cardList`：

- 从列表移除 `UserCircleCard`、`UserCircleCardV3`、`MineMemberRecommendTaskCardV2`、`PopularActivitiesCardV2`、`PopularActivitiesCardV5`、`ContentCenterFeedCard`。
- 仅在 `MineNewBEntranceCardV4.content` 中将数组 `entranceList_2` 清空。
- 在 `entranceList_1` 中，仅对 id为10且title为“待评价”的入口，清空数组类型 `tips`；不删该入口，也不清空上方五入口一整行。
- 足迹 `MineNewFootprintCard`、语音包/车标 `MineNewVirtualAssetCardV3`、徽章 `MineUserEmblemCardV2` 原样保留。
- 未识别的卡片和结构保留，异常回原JSON。若当前版本新增了其他下方卡片，本版可能无法全部移除；不靠按位置截断未知数据来保证全空。

未单独拦截 `/ws/info_bff/contentFeed` 或 `/ws/info_bff/ContentCenter`，避免影响探索或其他共用内容页面。是否移除 `ContentCenterFeedCard` 后会完全停止显示推荐区，需实际客户端验证；不将“内容加载失败”称为“隐藏成功”。

## 保留的旧规则

test3 的五条 jq、Map Local 与 MITM 逐字不变：活动popup、目的地优惠气泡、通勤营销浮标、局部营销skin试验、打车下方五类活动/会员展示精简仍在。

此前尚未定位的顶部营销横幅来源、右上“企”及底栏“探索”“长按说话”仍不承诺隐藏。旧开屏Map Local保持，不恢复实时开屏reject。

## 更新测试

固定测试订阅：

https://raw.githubusercontent.com/niu93/surge-modules/main/Amap-Rebuild-Test.sgmodule

在 Surge 模块管理中更新当前测试实例，确认说明显示 `v0.1.1-test4`。只启用一个高德版本，关闭重复模块/旧脚本。保持重写与 MITM 开启，本版不增加解密域名（仍为 `m5.amap.com` 与 `m5-zb.amap.com`）。解密是主机级，不仅覆盖目标路径；使用自己生成且已完全信任的 CA，不关闭服务端证书验证。

完全退出高德，重新打开后进入“我的”查看。个人页卡片可能使用缓存，没有重新请求配置时不会立刻变化；无需清空App、删除订单或重置配置。若仍显示，先看是否出现上述配置路径、是否有 jq 命中/警告，不要反复提交相同整份抓包。

这次不能根据88条HAR中无匹配就证明失效根因，也不能承诺重启一定刷新。请只按手机实际效果验收：保留五入口及上方卡片，下方目标内容消失，且无异常大块空位。抓包后关闭捕获流量，分享截图遮住个人信息。

## 测试状态

- jq1.7.1 运行25项结构/过滤检查、11组URL边界测试通过。
- 对旧个人页真实响应精确对比：只删上述六类卡片、第二行入口和待评价展示提示；保留四类上方/徽章卡、第一行五入口以及原账户字段。
- 三份HAR共88/388/228条请求，分别57/233/162个可解析JSON执行新表达式无错误；新规则仅命中旧HAR的第116项，其余请求无新增改动。
- **未验证：**Surge TF加载/实时匹配、当前个人页协议与缓存刷新、全部UI收起及无空位、实际业务回归。离线测试不能代替真机效果。

## 备份及回滚

发布前完整备份test3的五个文件，提交 `2caab5ce4e5e0bf540eca572271229cb2857b7e2`。

异常时停用test4，再安装test3固定地址，不同时启用：

https://raw.githubusercontent.com/niu93/surge-modules/2caab5ce4e5e0bf540eca572271229cb2857b7e2/Amap-Rebuild-Test.sgmodule

原第一版订阅继续不变：

https://raw.githubusercontent.com/niu93/surge-modules/main/Amap.sgmodule

未上传HAR、凭证、位置、头像或CA私钥，未重放用户请求。参考：[Surge Body Rewrite](https://manual.nssurge.com/http/body-rewrite.html)。
