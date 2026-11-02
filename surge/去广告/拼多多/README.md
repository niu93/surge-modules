# 拼多多统一测试版

## v0.2.4-test7：单主机网络回退实验

**当前不是已经验证的推荐区修复。** test6的三个推荐接口在两份相关抓包中均未出现，也没有Map Local匹配记录，因此没能处理圈选区域。本版按用户选择，只尝试源插件已有的一个主机拒绝规则，观察App是否改走普通HTTP接口。

唯一安装地址不变：

```text
https://raw.githubusercontent.com/niu93/surge-modules/main/surge/%E5%8E%BB%E5%B9%BF%E5%91%8A/%E6%8B%BC%E5%A4%9A%E5%A4%9A/Pinduoduo-Rebuild-Test.sgmodule
```

## 唯一新增规则

```ini
[Rule]
DOMAIN,xg.pinduoduo.com,REJECT,extended-matching
```

源插件包含xg主机阻断；本次抓包观察到该authority的`/ngrtt/zqog` WebSocket连接，内容为二进制，不能直接用JSON/jq处理。`extended-matching`用于扩大到可识别的HTTP Host/TLS SNI等主机信息，**不意味着已经解析长连接协议**。

验证假设是“拒绝这一通道后，App可能回退到可处理的HTTP接口”。目前没有证据证明圈选推荐必定由该通道提供，也没有证明App必定回退。

**风险：可能影响即时聊天、推送、页面加载或其他业务。** 不扩大到titan、IP列表、api整域或图片CDN，不主动重放请求、不修改二进制。单个主机也可能共享业务，不能称为广告专用域名。

## 保持不变

- 用户已反馈底栏成功的开屏/底栏两条原生jq逐字保留。
- test6的三个200/JSON空对象映射保留：
  - `/api/caterham/v3/query/personal`
  - `/api/caterham/v3/query/new_chat_group`
  - `/api/zaire_biz/chat/resource/get_list_data`
- 仍只追加MITM主机api.pinduoduo.com，不新增xg MITM，不更换CA、不关闭上游证书校验。
- 不改订单、钱包、优惠券、客服、通知或聊天会话数据；但阻断的实际业务影响仍需验收，不能保证这些功能无损。

## 测试顺序

1. 更新同一模块，确认v0.2.4-test7；只启用一份拼多多模块，保持重写/MITM及自己的CA信任。
2. 完全结束拼多多后重开，先验证聊天、客服入口、物流/交易通知、个人中心和首页加载。
3. 若任一项异常或一直转圈，立即停用本模块，不要等待它自动恢复；反馈后通过同一地址回退test6。不在紧急沟通、取件或付款时首次测试。
4. 正常后再看个人页的9块9横幅/商品推荐、聊天顶部秒杀横幅和底部商品是否消失。
5. 如需记录，仅短时捕获这次打开个人中心和聊天页的过程，检查xg拒绝记录与三个HTTP接口是否出现。不要把“没有请求”或“页面没加载”当作广告消失。

## 验证状态

本地核对只有一条新主机规则，既有jq和映射完全不变；相同19文件目录不新增安装地址。没有目标HTTP响应样本可用于证明推荐区业务合同，尚未Surge运行验证网络回退、UI去除或聊天兼容性。

最新小抓包104条约20秒，含相关页面遥测和两次xg WebSocket握手；test6目标接口0次、Map Local0次。首页重写仍可见，不能因为推荐无效就改已成功底栏。

## 回滚、来源及隐私

发布前已固定备份test6和全仓库。异常先停用本模块；维护时回退也更新同一测试地址，不要求再装第二个订阅。原插件署名：[ZenmoFeiShi](https://github.com/ZenmoFeiShi)、[可莉](https://github.com/luestr/ProxyResource)。

本仓库只发布模块和匿名说明，不上传HAR、截图、私人配置、订阅、账号、订单、位置、专属DNS或CA材料。无远程JS。
