# 高德原生重写测试：v0.1.1-test2

在 test1 基础上增加用户已选择的**局部营销皮肤过滤试验**。需要 Surge iOS 5.14+（用户使用最新版 TF）。不引用远程 JS，不替换仍为 v0.1.0 的 `Amap.sgmodule`。

## 本次做了什么

仅新增一条 `/ws/boss/car/order/content_info` 的原生 jq 响应规则：

- 当 `data.lubanData.skin` 为对象、`dataList` 为非空数组，且列表内每项都具有 `protocol.skin_list` 数组这一已见结构时，删除 `skin` 这个营销皮肤槽。
- 只删除该字段，不拒绝整个打车接口，不动并列的安全提示、协议链接、输入、订单与功能网格数据。
- 未识别或混合结构保留原 JSON；执行异常也回退原数据。

这会影响符合上述结构的**同槽营销皮肤**，不只是一张指定图片。用户已选择接受这一局部试验范围。

### 不把候选槽位当作已确定来源

截图中“周中省钱·周末撒野”同主题素材在旧抓包的活动专区广告列表里也存在；但这并不证明圈选的顶部横幅由该列表或 skin 槽直接显示。

`skin` 的旧样本实际是另一个券包活动。公开去广告模块确有删除此槽的规则，因此可以作为局部过滤候选，**仍不能据此保证截图横幅会消失**。若它依赖其他接口、客户端缓存或另一位置的配置，本版可能无效；也可能出现空占位。未做真机渲染验证，不称“已去掉”。

### 右上“企”：本轮没有实现

两份现有 HAR 未确认右上“企”的独立可见性字段。`enterpriseShowMode`、管家卡片配置、下方企业用车网格都不能直接等同于这个入口。

因此**不写“企”的猜测性隐藏规则**，不清空图标、不禁用企业功能，不删除头像、“券”或下方企业用车网格。圈选“企”仍可能显示，不代表本版承诺处理了它。

底栏“探索”“长按说话”仍未处理。

## 保留 test1 的全部功能

原三条 jq 规则、Map Local 和 MITM 均保持：

1. `/ws/promotion-web/resource` 中清理已知促销 `popup_list` 的两套渲染结构，保留未知/混合内容。
2. 仅在 `data.bubble["5303"]` 过滤包含 `award_title="当单立减"` 的促销气泡，不依赖具体图或金额。
3. `/ws/promotion-web/resource/home` 仅在 `data.other.data.icon.icon_list` 过滤 `inner_type=5601` 类营销图标，不清空整个图标区或活动专区。

保留 v0.1 的旧开屏 Map Local，不恢复后续实时开屏拒绝；此前抓包未走这个旧路径，故不保证当前开屏能拦截。

MITM 仍只追加 `m5.amap.com` 与 `m5-zb.amap.com`，未扩大主机范围。解密按主机生效，不限于广告路径；不修改 CA、不关闭服务端证书验证。

## 更新和验证

测试版固定地址保持不变：

https://raw.githubusercontent.com/niu93/surge-modules/main/Amap-Rebuild-Test.sgmodule

在 Surge 模块管理中更新已装的测试模块，确认说明包含 `v0.1.1-test2`。不要与原版、test1 的另一个实例或其他重复高德模块同时启用。开启重写与 MITM，完全退出高德后重新进入打车页；不必删除 App 或重置配置。

若横幅仍在，不代表应该把更多业务接口全部封掉。可以只看 `/ws/boss/car/order/content_info` 请求的解密/重写命中说明、修改后是否仍有 skin 字段，用于区分未命中与位置来源不同。不要求再次重复提交整份 HAR。截图遮住地址及账户信息。

检查是否留下空位、输入和订单功能是否正常；异常先停用或回滚，不驾驶时操作。抓包结束后关闭捕获流量。

## 测试与限制

- 保留的三条 test1 jq 规则逐字一致，Map Local 和 MITM 内容一致。
- 候选规则 17 项预检查及两条真实响应结构核对通过；另做 10 组 URL 边界测试。
- 新规则对 233 个可解析 HAR 响应执行没有 jq 错误。
- 在样本里新规则匹配 6 条内容接口，只有 2 条下发 skin 的响应发生变化，变化仅是删除 skin；其他内容接口响应及旧规则效果保持不变。
- 未完成 Surge TF 真机加载/命中、圈选横幅消失、缓存/空位及真实业务回归验证。**离线检查不等于真机成功。**

## 备份和回滚

改前已保存 test1 提交下整个仓库5个文件，未覆盖唯一旧版。test1 固定回滚地址：

https://raw.githubusercontent.com/niu93/surge-modules/a61ad8446fe9be4d1741d22f42fe5a37c813b2e2/Amap-Rebuild-Test.sgmodule

回滚时停用当前测试实例，再从固定地址安装 test1，不同时启用两个版本。

原第一版固定订阅继续不变：

https://raw.githubusercontent.com/niu93/surge-modules/main/Amap.sgmodule

不公开 HAR、凭证、设备标识、位置或 CA 私钥。

参考：[官方 Body Rewrite](https://manual.nssurge.com/http/body-rewrite.html)、[Repcz/可莉转换模块中的 skin 局部删除规则](https://github.com/Repcz/Tool/blob/X/Surge/Module/Kelee/Amap_remove_ads.sgmodule)。本版增加结构保护，未照搬整份精简配置。
