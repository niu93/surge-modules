# 高德地图去广告正式版 v0.1.2

固定正式地址：

```text
https://raw.githubusercontent.com/niu93/surge-modules/main/Amap.sgmodule
```

本正式版由测试版七转发布，执行规则保持一致，仅调整模块名称和说明。

## 当前处理范围

- 高德首页 `home_qs` 流式响应中的已确认推荐卡、天气/优惠推荐卡及榜单卡；保留回家/去单位快捷条、导航接续卡和正常打车QS。
- ContentCenter 的已确认六分类 HeaderTab：关注、推荐、附近、周末出游、美食、休闲玩乐。
- 既有打车活动弹窗、优惠气泡、通勤浮标和打车页面展示精简。
- 保留搜索、功能入口、地图和正常业务数据。

包含测试版五成功后继承的个人页精简：保留订单至借钱五入口及上方足迹、语音包/车标，过滤已确认的下方展示卡片。右上“企”和底部“探索/长按说话”未实现隐藏。正式版不修改账户权益、订单、付款、安全、会员余额或里程资产。

## 要求和风险

需要 Surge iOS 5.14+，开启重写、脚本、MITM，并信任自己的 CA。首页 SSE 由固定版本的 `amap-home-sse.js` 脚本处理，脚本需从 GitHub Raw 下载；响应超过512KiB或结构未知时会透传。MITM追加 `m5.amap.com`、`m5-zb.amap.com`、`ai.amap.com`，按主机解密，不只覆盖广告路径。

流式响应可能存在缓冲延迟、空位、缓存或后续补卡；离线测试不等于真机效果。更新后完全退出高德再打开，确认搜索、快捷条、导航和打车正常。出现异常先停用正式版回滚。

## 验证状态

用户已反馈测试版七成功去除本次目标首页内容，个人页精简此前也已有用户成功反馈。测试版七已通过27项SSE逻辑测试、19项原生jq检查和12组脚本URL边界测试；已对新HAR的4份SSE和242个可解析JSON做离线检查。用户反馈不等于完整的实时命中记录、流缓冲性能或全部业务回归，也不保证其他设备/版本效果相同。

## 回滚

正式版上一版本 v0.1.1 固定回滚：

```text
https://raw.githubusercontent.com/niu93/surge-modules/29489d4db3c21044d444eebdc5827cac98397788/Amap.sgmodule
```

统一测试地址继续保持测试版七，不要与正式版同时启用：

```text
https://raw.githubusercontent.com/niu93/surge-modules/main/Amap-Rebuild-Test.sgmodule
```

本仓库不上传 HAR、Token、位置、账号或 CA 私钥。
