# 高德统一测试版十：v0.1.7-test10

## 固定地址与基线

所有测试版继续使用同一个安装地址，不新增测试订阅文件名：

https://raw.githubusercontent.com/niu93/surge-modules/main/Amap-Rebuild-Test.sgmodule

基于统一测试版九，原有10条原生jq、frogserver实验、天气/旧开屏Map Local、首页SSE脚本和工程修订全部保留；本次新增真实 `splash_screen_rt` 开屏广告精确拒绝及必要 MITM 主机。正式版及历史测试文件不改。

## 新抓包确认的残留来源

用户提供的331条HAR中，`ai.amap.com/v1/ai_rec/home_qs` 返回的是 **text/event-stream（SSE事件流）**，而不是单个JSON。天气、打车惊喜优惠券、榜单图片及问问AI卡片位于其中的PMT瀑布流；测试版六只清理普通JSON信息流，未处理这个来源。

同一SSE也包含“回家/去单位/地点”快捷条、导航接续和正常打车QS，不能整体拒绝或全清modules。

`m5.amap.com/ws/info_bff/ContentCenter` 的 `HeaderTab` 模块确实含“关注、推荐、附近、周末出游、美食、休闲玩乐”六个分类，来源已在新HAR中确认。

## 本次精确处理

### 1. SSE推荐卡

只处理HTTPS主机 `ai.amap.com` 的精确 `/v1/ai_rec/home_qs` 响应：

- 仅在PMT `aiPmtGenerate` 布局的已见 `WaterfallContainer.data.list` 中，过滤首页 `NestCard/sceneId=home_qs` 推荐项和明确标识的“打车惊喜优惠券”卡。
- 列表变空时同步清空该容器已见标题，避免留下“精选榜单”标题。
- 原样保留含 `freqSpot` 或 `scrollButton.list` 的整个快捷条布局及其路由、事件数据，不只保留两条文字。
- 原样保留 `QSLocalCardContainer` 导航接续信号、正常打车QS、地图业务与未知卡片。不整体封锁home_qs、main-page-aiqs或地图渲染接口。
- 如未来明确优惠券以独立PMT模块出现，仅在同一首页上下文与确切卡片标题匹配时删除，并协调对应布局引用；不删除未知用途的独立打车QS。
- 保留事件顺序、seq、结束/分页字段及COMPLETE结束帧。非法JSON、未知或不完整事件透传，不执行响应内任何代码。

这不会清除App已保存的私有缓存，也不能保证所有未来未知卡片均消失。保留导航接续意味着用户截图中快捷条上方的行程提示不在删除范围。

### 2. 图文六分类栏

只在ContentCenter的 `header.card_id=HeaderTab` 列表内，按已见的六个 `explore_page_tab_rec_*` key过滤。若只剩空列表，删除HeaderTab外壳并移除区域中指向header的引用；未知分类与其他模块保留。

这是图文的内容分类栏，不是底部“首页/探索/长按说话/打车/我的”导航。本版没有实现底部导航或右上“企”隐藏。ContentCenter是共用内容接口，同一分类头在其他内容页面出现时也可能被过滤，不修改账户或地图功能。

## 新增脚本与解密范围

SSE不是单一JSON，无法直接用原生http-response-jq读取；因此本次为这一精确路径新增响应脚本。源码见 `amap-home-sse.js`，模块引用已核验的固定GitHub提交，不随main源码自动漂移。脚本无网络请求、存储、通知或敏感日志。

使用 `requires-body=true`，缓冲上限512KiB；响应超限Surge会跳过脚本透传。流式响应需等正文完成才能处理，可能影响首屏到达时间或内存占用；当前实现尚未在Surge内核验证，持续流或缓存可能导致无效。

MITM在 test9 基础上新增 `amap-aos-info-nogw.amap.com`。解密按主机生效，所以该主机其他HTTPS请求也会进入解密范围，尽管 URL Rewrite 只匹配 `splash_screen_rt`；不改CA、不关闭服务端证书验证。

## 使用与验收

更新已装的统一测试模块，确认版本为 **v0.1.7-test10**。只启用一个高德模块，停用重复高德规则后单独对照。需要 Surge iOS5.14+；继承 `#!requirement=CORE_VERSION>=20`，需同时开启 **重写、脚本、MITM**；首次加载脚本需能访问GitHub Raw。

完全退出高德再进入首页，检查：

- 搜索、功能宫格、回家/去单位快捷条仍在且可点击；
- 天气、优惠券、排行榜、问问AI等已知下方推荐卡减少/消失；
- 六分类栏是否收起，有无空位、持续加载或卡顿；
- 已成功的个人页精简、正常打车/导航是否仍正常。

页面可能受本地缓存、增量更新或未知模板影响。只对已见结构负责，不承诺所有内容必定消失；没有真机验证前不得把离线通过称作去除成功。不要求卸载、清空高德数据或重复上传同样整份HAR。不要驾驶时测试。

## 已完成的离线核验

- 27项JavaScript检查通过：换行格式、多行data帧、异常/不完整帧、单次done、未知卡保留、快捷条/导航保护及4份真实SSE。
- 两份真实SSE分别过滤5项榜单/AI推荐、2项天气/券推荐；另外两份SSE完全透传，真实快捷条、导航和独立正常打车QS事件未变。
- 19项分类栏jq检查通过；新HAR的242个可解析JSON无新增jq错误。13条ContentCenter响应中6条有已知header/空壳变化，其余保持。
- 12组脚本URL边界检查通过。未验证Surge实际加载/脚本缓冲、实时解密/命中、UI收起、私有缓存及真实业务回归。

## 本次真实开屏修复

本次 HAR 重新确认真实开屏请求为：

```text
https://amap-aos-info-nogw.amap.com/ws/aos/alimama/splash_screen_rt
```

响应为 `multipart/form-data`，包含图片素材和广告元数据；元数据中确认 `media.is_ad=1`、`display_type=full`、`creative_type=static_image`、`display_time=5`。由于它不是可安全替换成 `{}` 的普通 JSON，本版采用精确 URL Rewrite `reject`，不拒绝整个域名、不修改图片 CDN，也不处理其他开屏路径。

拒绝行为可能表现为跳过、留白、重试或回退，必须以 Surge 请求详情和真机页面确认。新增 MITM 主机后，该主机的其他 HTTPS 请求也可能被解密，但重写只匹配这一条路径。

## 本次 frogserver 实验

本次 HAR 中确认 `m5.amap.com/ws/shield/frogserver/aocs/updatable/1` 出现4次，其中有一份较大的 JSON 配置。结构里出现了 `adCustomerRetainArchitecture`、`marketing_resource_config`、`taxi_activity` 和 `tel_retention_popup` 等明确偏营销/弹窗的顶层配置。

test9 只在根节点 `.data` 为对象时删除这4个已确认字段；字段不存在、`.data` 类型不符或 jq 异常时保留原响应。没有删除 `TrainOrderBanner`、`commonCouponSceneLog`、`giftEntryConfig` 或整个 `.data`，也没有处理 `scene/recommend` 和 POI 详情，避免把正常业务、日志或交通功能一起删除。

这只是字段级实验：HAR 字段出现不证明它一定渲染了用户看到的广告，也不证明删除后 UI 一定改变。需要在 Surge 请求详情中确认该规则命中，再观察首页/打车相关页面是否变化及正常功能是否保持。


## 继承的 test8 工程修订

- 增加 `#!requirement=CORE_VERSION>=20`，让不满足 Body Rewrite 核心要求的客户端明确拒绝或提示，而不是静默无效；目标是 Surge iOS 6，仍需实际导入确认。
- 开屏 Map Local 从“必须带查询参数”改为匹配精确路径及可选查询参数：`(?:\?|$)`。
- 将内部脚本名从 `amap-home-sse-test7` 改为 `amap-home-sse`，不改变固定源码、匹配 URL、大小上限、超时或响应逻辑。
- test9 的 frogserver 最小字段实验和 test10 的真实开屏路径修复分别独立，均未扩展到搜索详情、附近页或榜单接口。

## 备份回滚

修改前已完整备份统一测试版九及当前仓库文件，正式版和历史文件不改。若开屏拒绝导致导入、命中或业务异常，先停用测试版十，再使用固定测试版九回滚地址，不同时启用：

https://raw.githubusercontent.com/niu93/surge-modules/f8425ea10fabe6c03c1974a3f0461d1a91f2a307/Amap-Rebuild-Test.sgmodule

后续新测试仍只更新统一路径；固定提交链接仅用于回滚。正式版 `Amap.sgmodule` 本次不变。

没有上传HAR、头像、账号、令牌、坐标、出行信息或CA私钥，未重放任何业务请求。所有真实响应测试在本地进行。
