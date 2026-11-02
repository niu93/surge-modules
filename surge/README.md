# Surge 模块、分流与教程

仓库按去广告、分流、教程分类；最外层只保留本surge目录。目录迁移只更换资源路径，不改模块执行规则。

## 去广告

| 项目 | 当前版本/阶段 | 说明 |
|---|---|---|
| [高德正式版](%E5%8E%BB%E5%B9%BF%E5%91%8A/%E9%AB%98%E5%BE%B7/Amap.sgmodule) | v0.1.3 | [简洁说明](%E5%8E%BB%E5%B9%BF%E5%91%8A/%E9%AB%98%E5%BE%B7/README.md) |
| [高德统一测试版](%E5%8E%BB%E5%B9%BF%E5%91%8A/%E9%AB%98%E5%BE%B7/Amap-Rebuild-Test.sgmodule) | v0.1.7-test10 | [测试说明](%E5%8E%BB%E5%B9%BF%E5%91%8A/%E9%AB%98%E5%BE%B7/Amap-Rebuild-Test.md) |
| [拼多多统一测试版](%E5%8E%BB%E5%B9%BF%E5%91%8A/%E6%8B%BC%E5%A4%9A%E5%A4%9A/Pinduoduo-Rebuild-Test.sgmodule) | v0.2.4-test7，单主机回退实验（可能影响聊天） | [阶段说明](%E5%8E%BB%E5%B9%BF%E5%91%8A/%E6%8B%BC%E5%A4%9A%E5%A4%9A/README.md) |

同一个App不要同时启用正式版、测试版或其他重复模块。拼多多底栏test5已获用户可见隐藏确认；test7保留原规则，仅试验阻断xg主机能否触发HTTP回退；推荐效果及聊天/推送兼容性均未确认。
高德[历史测试文件](%E5%8E%BB%E5%B9%BF%E5%91%8A/%E9%AB%98%E5%BE%B7/%E5%8E%86%E5%8F%B2/)及[脚本源码](%E5%8E%BB%E5%B9%BF%E5%91%8A/%E9%AB%98%E5%BE%B7/%E8%84%9A%E6%9C%AC/)保留，不把归档版称作最新版本。

### 固定安装地址

```text
https://raw.githubusercontent.com/niu93/surge-modules/main/surge/%E5%8E%BB%E5%B9%BF%E5%91%8A/%E9%AB%98%E5%BE%B7/Amap.sgmodule
https://raw.githubusercontent.com/niu93/surge-modules/main/surge/%E5%8E%BB%E5%B9%BF%E5%91%8A/%E9%AB%98%E5%BE%B7/Amap-Rebuild-Test.sgmodule
https://raw.githubusercontent.com/niu93/surge-modules/main/surge/%E5%8E%BB%E5%B9%BF%E5%91%8A/%E6%8B%BC%E5%A4%9A%E5%A4%9A/Pinduoduo-Rebuild-Test.sgmodule
```

以后每个App的测试版继续更新各自同一地址，不为版本递增新增订阅路径。

## Rex 分流

[规则与接入说明](%E5%88%86%E6%B5%81/Rex/README.md)。这是分流规则集，不是去广告模块或节点订阅。

Rabbit模板常见策略名的接入示例：

```ini
RULE-SET,https://raw.githubusercontent.com/niu93/surge-modules/main/surge/%E5%88%86%E6%B5%81/Rex/Rex-Proxy.list,Proxy
RULE-SET,https://raw.githubusercontent.com/niu93/surge-modules/main/surge/%E5%88%86%E6%B5%81/Rex/Rex-JP.list,日本节点
RULE-SET,https://raw.githubusercontent.com/niu93/surge-modules/main/surge/%E5%88%86%E6%B5%81/Rex/Rex-TW.list,台湾节点
```

放在主配置已有[Rule]内的合适优先位置，FINAL之前；策略名称按实际配置调整。

## 教程

[Surge 去广告模块编写指南](%E6%95%99%E7%A8%8B/README.md)：原理、jq、脚本、SSE/二进制、MITM、跨客户端适配、验证、发布和隐私。

## 本次目录迁移

旧main分支根路径安装地址和Rex资源地址不再保留。已有Surge订阅应统一改为上面的新路径一次；GitHub网页重命名提示不保证Raw订阅自动跟随。仓库以前的固定commit回滚和固定脚本依赖仍在历史中，不改成移动分支。

只发布公开模块、规则和匿名教程，不上传私人配置、订阅、HAR、截图、账号、位置或CA私钥。

## 致敬与来源

[致敬与感谢](THANKS.md)。第三方作者、来源与许可证以各文件及上游声明为准。
