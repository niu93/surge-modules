# 高德个人页重写测试：v0.1.2-test5

这是基于正式版 test3 执行规则的独立个人页测试，不覆盖正式 `Amap.sgmodule`，也不覆盖原测试 `Amap-Rebuild-Test.sgmodule`。

测试地址：

```text
https://raw.githubusercontent.com/niu93/surge-modules/main/Amap-Rebuild-Test-v2.sgmodule
```

## 与 test4 的区别

- URL 匹配从固定 `nodefaasv3?` 放宽为 `https?://*.amap.com/ws/shield/dsp/profile/index/nodefaas...`，兼容不同 `nodefaas` 后缀。
- 卡片同时识别 `.dataKey` 和历史公开实现中使用的 `.dataType`。
- 同时支持 `cardList` 为数组或对象的响应结构。
- 继续保留订单、收藏、待评价、钱包卡券、借钱五入口，以及足迹、语音包、车标、徽章和未知卡片。
- 继续清空下方 `entranceList_2`，清空待评价入口的展示提示，并移除已确认的下方卡片。

它不会修改订单、收藏、钱包、评价或账户字段，也不拦截共用内容流接口。

## 重要限制

你此前的实时抓包没有出现任何 `profile/index/nodefaas...` 请求，所以这版即使规则写得更兼容，也可能完全没有命中。它不能处理已经存在的本地页面数据，也不能直接刷新高德私有缓存。

公开历史脚本只证明有人使用过 `dataType=MyOrderCard/GdRecommendCard` 方案，不证明当前高德版本使用该结构；本版只把它作为兼容读取方式，不执行远程脚本。

## 使用方法

1. 停用正式版及其他重复高德模块，只启用这个测试文件。
2. 确认 Surge 的重写和 MITM 开启。
3. 完全退出高德，再进入“我的”；如页面支持下拉刷新，只刷新一次。
4. 查看是否出现 `profile/index/nodefaas` 请求及 jq 命中说明。
5. 若没有该请求，直接说明“没有请求”，不要继续重复添加字段。

正式版保持不变：

```text
https://raw.githubusercontent.com/niu93/surge-modules/main/Amap.sgmodule
```

test3 固定回滚：

```text
https://raw.githubusercontent.com/niu93/surge-modules/2caab5ce4e5e0bf540eca572271229cb2857b7e2/Amap-Rebuild-Test.sgmodule
```

已完成本地数组/对象两种结构、未知字段及旧个人页样本测试；未完成当前客户端实时命中、缓存刷新、UI实际收起和业务回归。异常时先停用本测试，不要同时运行多个版本。
