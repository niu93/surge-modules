# 高德统一测试版八：v0.1.5-test8

## 固定地址与基线

所有测试版继续使用同一个安装地址，不新增测试订阅文件名：

https://raw.githubusercontent.com/niu93/surge-modules/main/Amap-Rebuild-Test.sgmodule

基于统一测试版七，原有9条原生jq、天气/旧开屏Map Local和首页SSE脚本全部保留；本次只做工程性修订：增加 Body Rewrite 核心版本要求、修正开屏 URL 查询边界、更新过时的基线注释和脚本名称。正式版及历史测试文件不改。

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

MITM在原来的 `m5.amap.com,m5-zb.amap.com` 基础上只新增 `ai.amap.com`。解密按主机生效，所以该主机其他HTTPS请求也会进入解密范围，尽管脚本只匹配home_qs；不改CA、不关闭服务端证书验证。

## 使用与验收

更新已装的统一测试模块，确认版本为 **v0.1.5-test8**。只启用一个高德模块，停用重复高德规则后单独对照。需要 Surge iOS5.14+；本版增加 `#!requirement=CORE_VERSION>=20`，需同时开启 **重写、脚本、MITM**；首次加载脚本需能访问GitHub Raw。

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

## 本版工程性修订

- 增加 `#!requirement=CORE_VERSION>=20`，让不满足 Body Rewrite 核心要求的客户端明确拒绝或提示，而不是静默无效；目标是 Surge iOS 6，仍需实际导入确认。
- 开屏 Map Local 从“必须带查询参数”改为匹配精确路径及可选查询参数：`(?:\?|$)`。
- 将内部脚本名从 `amap-home-sse-test7` 改为 `amap-home-sse`，不改变固定源码、匹配 URL、大小上限、超时或响应逻辑。
- 没有加入 Loon 插件中尚未由当前设备新抓包确认的 `frogserver`、搜索详情、附近页、榜单等扩展规则；这些仍是后续候选，不代表本版已实现。

## 备份回滚

修改前已完整备份统一测试版七及当前仓库文件，正式版和历史文件不改。若工程性修订导致导入或命中异常，先停用测试版八，再使用固定测试版七回滚地址，不同时启用：

https://raw.githubusercontent.com/niu93/surge-modules/b32832437edf076113f21ac9b0d5270ebb43fc3e/Amap-Rebuild-Test.sgmodule

后续新测试仍只更新统一路径；固定提交链接仅用于回滚。正式版 `Amap.sgmodule` 本次不变。

没有上传HAR、头像、账号、令牌、坐标、出行信息或CA私钥，未重放任何业务请求。所有真实响应测试在本地进行。
