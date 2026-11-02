# 拼多多统一测试版

## v0.2.8-test11：仅首页请求编码的单变量对照

目标仍为保留首页、聊天、个人中心，隐藏多多视频与双11。当前不能称为已修复：已有多个HAR证明两数组已三项且有Body Rewrite修改日志，用户同次界面仍五项。重复删除数组、删皮肤、阻断长连接均未稳定实现目标，不再叠加这些做法。

本次仅让精确首页配置请求尝试使用不压缩响应，对照传输路径是否有关；原有两条jq保持逐字不变。

## 唯一安装链接

```text
https://raw.githubusercontent.com/niu93/surge-modules/main/surge/%E5%8E%BB%E5%B9%BF%E5%91%8A/%E6%8B%BC%E5%A4%9A%E5%A4%9A/Pinduoduo-Rebuild-Test.sgmodule
```

仍只更新同一个模块，不新增测试安装地址。

## 唯一新增规则

```ini
[Header Rewrite]
http-request (?i)^https://api\.pinduoduo\.com/api/alexa/homepage/hub(?:\?|$) header-replace Accept-Encoding identity
```

Surge官方文档规定header-replace仅替换已存在的头；已有12份该接口请求均带一份Accept-Encoding，因此这里不额外添加重复头。不作用于其他API、素材或App，不改变Cookie、账号、查询参数、请求正文、节点或分流。

服务器可能不接受该协商，是否实际返回identity必须看响应记录。取消压缩可让该单个配置响应占用更多流量，现有样本解码大小约100–127KB；不是全局禁压缩。不手工改Content-Length、Transfer-Encoding或响应Content-Encoding，避免制造头体不一致。

## 为什么检查传输，而不是继续加字段

- 对12份已抓首页响应离线对照，同一账号/安装/UA/能力参数一致，未发现能解释成功/失败的版本参数差异（不保存身份值）。
- 原始五项响应为gzip；改写后HAR显示identity和解码体积的Content-Length，但HAR bodySize仍像上游压缩大小。
- 后者**很可能只是记录层沿用上游统计**，不是已证明的线上错误；也不能由此宣称Surge存在bug。单变量对照只用于检验这一条尚未排除的执行路径，不保证能去掉底栏。
- 未发现Digest/Content-MD5等明确响应签名证据，不能随意删除pdd-config等未知头。
- 保留入口图标在这些短抓包里没有对应独立下载记录，无法据此断言图标加载失败导致回退。
- 相关实验开关虽存在，未取得当前客户端消费语义；不按名称猜值，不重新编号Tab或清空全局配置。

## 保持不变

- 开屏jq：`/api/cappuccino/splash`的已见空配置处理。
- 底栏jq：`/api/alexa/homepage/hub`中bottom_tabs、buffer_bottom_tabs三个公开路由白名单及类型保护。
- MITM只追加api.pinduoduo.com，使用自己的可信CA，不关闭服务器证书校验。
- 无selected_bottom_skin删除、xg/titan阻断、Map Local、订单/聊天/个人页精简或远程JS。个人/聊天圈选推荐目前仍未实现。

本地曾准备并执行自编的响应脚本候选29项合成检查及12份JSON内存回放，未执行任何第三方或HAR内JS；该脚本**本轮没有发布或启用**，避免同时改变编码与处理引擎而失去对照意义。

## 更新与验收

1. 更新同一模块，确认v0.2.8-test11；只启用这一份拼多多模块。
2. 保持重写、MITM和自己CA信任，完全结束拼多多后重开，观察底栏、聊天、个人中心是否正常。
3. 若愿意补充同次短抓包，优先记录主页请求的Accept-Encoding、响应Content-Encoding、重写日志和两数组安全摘要，不需要抓订单/聊天正文或提供账号参数。
4. 如无效或出现加载异常，通过同一测试地址回退test10；不继续堆更多未知字段，不要求卸载、退出账号或清除App数据。

本版为对照测试，不承诺已隐藏当前原生底栏，也不将“规则有日志”当真机成功。

## 验证、来源与隐私

新增正则6项边界检查通过，原两个jq逐字不变且编译检查通过；没有对拼多多发起重放。前序已做12份真实响应的本地比较，但这不能替代本轮真实传输/界面验证。

官方依据：[Header Rewrite](https://manual.nssurge.com/http/header-rewrite.html)、[Body Rewrite](https://manual.nssurge.com/http/body-rewrite.html)。原底栏思路参考ZenmoFeiShi、可莉，底栏成功仍以实际界面为准。建议Surge iOS6；原生jq最低iOS5.14+/Mac5.9+，CORE_VERSION>=20只是通用Body Rewrite门槛。

发布前完整备份test10和仓库；不修改高德/Rex，不上传HAR、截图、私人配置、凭证、账号、位置或专属DNS。
