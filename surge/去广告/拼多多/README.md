# 拼多多统一测试版

## v0.2.9-test12：基于Loon成功抓包的受限组合对照

用户提供Loon未启插件与启用可莉插件的两份抓包，并确认启用时底栏只剩首页/聊天/个人中心，个人页与聊天页圈选推荐均消失。这份成功基准表明原插件完整组合在用户设备上有效；不能把此前Surge失败简单归因于App不支持修改。

本版继续同一个安装地址：

```text
https://raw.githubusercontent.com/niu93/surge-modules/main/surge/%E5%8E%BB%E5%B9%BF%E5%91%8A/%E6%8B%BC%E5%A4%9A%E5%A4%9A/Pinduoduo-Rebuild-Test.sgmodule
```

## 本轮改动

1. 保留原开屏和双底栏数组jq逐字不变。
2. 撤下test11首页Accept-Encoding: identity对照，恢复原有编码协商，避免同时混入无结论的实验。
3. 按实际Loon拒绝记录接回单主机规则：

```ini
DOMAIN,xg.pinduoduo.com,REJECT,extended-matching
```

4. 对精确主机api.pinduoduo.com的以下三个路径（带查询分隔符）映射HTTP200、JSON `{}`，与成功包中的实际响应契约一致：

```text
/api/caterham/v3/query/personal
/api/caterham/v3/query/new_chat_group
/api/zaire_biz/chat/resource/get_list_data
```

不加入meta整域拒绝、其他IP/统计/QUIC规则，不删首页icon_set或顶部分类，不删除selected_bottom_skin，不重新编号Tab，不增加远程JS或MITM主机。仍只追加api.pinduoduo.com，使用自己的CA，不跳过上游证书校验。

## 这与test7的区别和限制

**大部分有效规则与之前test7相同，并非发现了新的隐藏开关。** 之前的失败反馈需要保留，本轮也不保证成功。新价值是：Loon成功包的专有日志首次明确证明xg实际被REJECT，三个推荐普通HTTP路径也真实出现并被改写，而先前Surge包没有三路径，重发旧包不能验证test7是否实际阻断或回退。

本轮必须核对Surge中这条链是否发生，不能仅凭模块文件存在或本地测试通过就声称运行等价：

```text
xg实际REJECT
→ 相关普通HTTP接口是否出现（因果尚未证明）
→ 三路径是否Map Local 200/{}
→ homepage/hub是否改写为三项
→ 原生界面是否改变、正常业务是否可用
```

Loon完整插件还有其他规则和同接口清理，本最小组合不保证完全复现其行为。开关前后操作次序/数量也不是完全受控，因此不能断言仅xg一项就引起HTTP回退。成功Loon仍保留底栏皮肤、请求接受gzip，不应把删皮肤或关压缩说成必要条件。

## 风险与回退

xg可能承载正常聊天、推送或其他业务，不是已证明的广告专用主机；阻断可能产生消息延迟、页面空白或启动重试。extended-matching仅扩大可识别主机信息的匹配，不会解密WebSocket二进制或保证覆盖全部替代通道。

- 只启用一份拼多多模块，更新后确认v0.2.9-test12，开启重写与MITM。
- 完全结束拼多多再重开，先检查聊天、物流/交易通知、客服、订单、个人中心和首页加载，再看底栏与圈选推荐。
- 若会话/通知/加载异常，立即停用该模块；反馈后通过同一地址回退test10，不继续加其他主机/IP来碰运气。不要首次在付款、取件或重要沟通期间测试。
- 若目标仍在，优先核对xg实际匹配和三个HTTP请求记录；没有这些证据就不能说回退已发生。
- 不要求卸载、退出账号或清空数据。停用补丁不保证清除App已保存状态。

## 验证级别

本地核对了三条Map Local的正反URL边界及成功Loon包的对应HTTP200空对象记录；以Loon未启插件五项原始JSON回放现有底栏jq，确认为三项。现有两条jq字节不变。尚未验证Surge实际执行链、HTTP回退、原生界面及业务无损；用户对Loon成功的确认不等于当前Surge版已验证。

备份了test11与整个仓库和固定脚本依赖。只发布模块与匿名说明，不上传HAR、截图、私有配置、账号、订单、位置、凭证或专属DNS；高德和Rex未改动。

底栏及推荐行为参考：ZenmoFeiShi、可莉原Loon插件，以及用户提供的Script Hub转换文件。未复制或执行不可审查的远程扫码脚本。
