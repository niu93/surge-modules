# 高德首页内容精简测试：v0.1.3-test6

基于已成功的测试版五 `v0.1.2-test5`，新增尝试移除首页快捷条“回家／去单位／地点”以下的天气和图文信息流。独立测试文件，不覆盖正式版、test5 或其他测试文件。

## 保留

- 搜索框
- 驾车、公交地铁、打车、酒店等功能入口
- “回家／去单位／地点”快捷条
- 底部导航
- test5 原有个人页与打车页规则

## 新增处理

1. 对 `m5.amap.com/ws/valueadded/weather/v2` 使用本地空 JSON 响应，尝试移除天气卡。
2. 对以下两个首页图文信息流响应，只清空 `data.modules.waterfall.data.list`，保留响应外壳、标题、header 和其他模块：

```text
https://m5.amap.com/ws/info_bff/contentFeed
https://m5.amap.com/ws/info_bff/ContentCenter
```

这用于移除截图下方的推荐图片和图文信息流，不封锁整个高德域名，也不改快捷条。

## 打车优惠券卡说明

旧抓包中“打车惊喜优惠券”相关文案主要出现在打车营销接口；当前首页截图的优惠卡是否由同一接口下发，现有样本没有完全确认。因此 test6 不把所有优惠接口整段拒绝，避免影响打车页面。天气和图文流移除后，优惠卡可能仍显示；如果它仍在，需要新的当前首页响应证据再定向处理。

## 安装

```text
https://raw.githubusercontent.com/niu93/surge-modules/main/Amap-Rebuild-Test-v3.sgmodule
```

在 Surge 模块管理中安装或更新，确认描述为 `v0.1.3-test6`。先停用正式版、test5 和其他重复高德模块，只启用 test6。完全退出高德后重新打开首页。

需要 Surge iOS 5.14+、重写和 MITM。test6 不使用远程 JS；MITM 主机沿用 test5，不新增主机。不关闭服务端证书验证。

## 验证与限制

- 保留 test5 的有效执行规则逐字一致。
- 17 项 jq 结构测试、7 组 URL 测试通过。
- 旧抓包中 contentFeed 和 ContentCenter 的真实响应均只清空 waterfall 列表，其他字段保留。
- **未验证**当前首页真实响应、Surge TF 实时命中、天气卡是否完全收起、优惠券卡是否同源、缓存、空占位和业务回归。

如果出现空白区域、首页异常、搜索/导航问题，立即停用 test6，回滚到 test5：

```text
https://raw.githubusercontent.com/niu93/surge-modules/b21a9d38d2014824f2c3b85052e498402eb3706d/Amap-Rebuild-Test-v2.sgmodule
```

正式版仍保持：

```text
https://raw.githubusercontent.com/niu93/surge-modules/main/Amap.sgmodule
```
