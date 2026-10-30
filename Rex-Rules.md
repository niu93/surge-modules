# Rex：Surge 远程分流规则集

版本：v1.0.0。25 条去重规则按原始分流意图分为：通用代理 21 条、日本 JP 3 条、台湾 TW 1 条。

这不是去广告模块，也不是节点订阅。它只规定域名如何选择出口，不提供代理服务器，不修改网页或 App 内容，不需要 MITM、重写或脚本。

## 添加方法

在 Surge 主配置的 `[Rule]` 区段最前面加入以下三行。如果已经有 `[Rule]`，只粘贴三行规则，不要重复新建区段：

```ini
[Rule]
RULE-SET,https://raw.githubusercontent.com/niu93/surge-modules/main/Rex-TW.list,TW
RULE-SET,https://raw.githubusercontent.com/niu93/surge-modules/main/Rex-JP.list,JP
RULE-SET,https://raw.githubusercontent.com/niu93/surge-modules/main/Rex-Proxy.list,代理
```

`TW`、`JP`、`代理` 必须是你主配置中实际存在的策略或策略组名称；名称不同就只修改上述三行最后一项。这里按来源文件保留默认名称，没有读取、创建或修改个人节点/配置。若主配置托管且不可编辑，请在可编辑副本中处理，注意副本是否继续获得原托管更新。

规则表通常从上往下首次匹配决定策略，所以把这三行放在宽泛直连、GEOIP 和 FINAL 前。官方 `pre-matching` 拒绝规则有更高优先级，本规则集不承诺覆盖它们。需要使用“规则模式”；全局/直连模式可能不按普通规则列表分流。

## 固定远程地址

- [Rex-Proxy.list](https://raw.githubusercontent.com/niu93/surge-modules/main/Rex-Proxy.list)
- [Rex-JP.list](https://raw.githubusercontent.com/niu93/surge-modules/main/Rex-JP.list)
- [Rex-TW.list](https://raw.githubusercontent.com/niu93/surge-modules/main/Rex-TW.list)

后续保持这三个路径更新，不用更换主配置中的链接。外部规则集会被下载并缓存，可在 Surge 对应资源/规则集详情中更新；当前手册默认更新间隔为 86400 秒，具体以版本和配置为准。Raw 可访问不表示节点或目标站点一定可用。

## 为什么不是 .sgmodule

根据 Surge 官方模块文档，模块 `[Rule]` 只能使用内置策略，不能直接引用本配置的 `代理`、`JP`、`TW`，也不能定义或修改 `[Proxy]` / `[Proxy Group]`。因此本项目使用三份不含策略字段的 RULE-SET 文件，由主配置为每组绑定出口；不要将这些 `.list` 地址填入“模块安装”。

## 作用范围提醒

所有域名均来自提供的规则文件，未扩充或探测网站。`github.com`、`githubusercontent.com`、`workers.dev`、`wsrv.nl` 等 DOMAIN-SUFFIX 会影响这些域名及其子域名的所有匹配流量，不只影响某一个应用；`DOMAIN-KEYWORD,surrit` 是域名包含关键词匹配。若不希望影响其他流量，可删去相关远程规则行，或在主配置中先写更精确的例外，但要自行确认优先级。

本仓库是公开的，域名清单可被所有人查看；文件只包含规则与说明，不含个人账号、访问记录、节点、订阅凭证、Cookie、Token、密码或 CA 私钥。

## 验证和撤销

已完成来源去重、分类数量、字段格式、策略去除和域名映射一致性检查；尚未验证个人 Surge 主配置中的策略名称或真机出口命中。

加载后查看最近请求中的命中 RULE-SET 和策略。故障时先停用/注释新增三行，原有规则会继续决定出口；不删除节点、主配置或证书。每次更新保留 Git 提交，使用固定提交 Raw 地址可以回到旧规则。

官方参考：[Module](https://manual.nssurge.com/profile/module.html)、[Rule Set](https://manual.nssurge.com/rules/ruleset.html)。
