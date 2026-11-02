# 拼多多：开屏与底栏重建测试

**v0.2.0-test3**。目标仅为移除启动开屏，以及底栏“多多视频”“双11/年度狂降价”，保留首页、聊天、个人中心。**仍是实验测试版，尚未确认真机效果。**

## 固定远程安装地址

```text
https://raw.githubusercontent.com/niu93/surge-modules/main/Pinduoduo-Rebuild-Test.sgmodule
```

在Surge模块管理中从URL安装；后续测试版本沿用这个地址更新。只启用一个拼多多模块，停用其他同类精简/去广告模块后单独测试。高德等无关模块无需停用。

## 实现与范围

仅2条Surge原生响应jq及一个MITM主机：

- `api.pinduoduo.com/api/cappuccino/splash`：在已见的完整字段类型合同下，清空splash_list，size及有效开屏标记置0；保留未知根字段。**0值代表无有效开屏是实验性空配置假设，需要验证客户端接受、缓存及回退行为。**
- `api.pinduoduo.com/api/alexa/homepage/hub`：只处理result.bottom_tabs及result.buffer_bottom_tabs。完整数组同时含首页、聊天、个人中心时，按公开页面文件名保留这三个入口，兼容link附带查询参数；异常结构透传。

没有远程JS、Map Local、长连接/HTTPDNS/统计/CDN域名封锁；不精简订单、个人页、顶部分类、首页商品、宫格、优惠横幅或其他卡片。底栏三入口白名单可能排除未来其他可识别link的导航，不应理解为只按广告词判断。

## 已知限制

已有样本中的两份底栏数组本来已是三项，不能据此证明当前原生界面一定只显示三项。仍缺少五项原始配置与渲染对应证据；没有确认缓存、皮肤、内置导航或其他配置就是根因。若仍显示五项，需要同次启动的响应和界面对照，而不是继续扩大拦截。

## 使用要求与验收

- 建议Surge iOS6测试；原生jq最低需iOS5.14+/Mac5.9+。模块的CORE_VERSION>=20仅为通用Body Rewrite门槛，不是完整jq最低版本证明。
- 开启重写、MITM，安装并完全信任自己的Surge CA；仅追加api.pinduoduo.com，不附带证书或关闭上游证书校验。MITM是主机级范围，不只解密两条路径。
- 完全退出拼多多后重开，分别检查开屏和底栏，确认三个保留入口可用；无需卸载、清空App数据或清DNS缓存。
- 异常时先停用本模块对照，不要用拦截整页冒充隐藏按钮。停用模块只能撤销网络补丁，不保证清除App已保存的页面状态。

本地检查：46项jq结构/功能及46项幂等、20项URL正反例通过；两份开屏样本列表由1项变0项，两个底栏样本保持三项。未进行Surge实机导入、开屏消失、底栏隐藏或正常业务验收；不能把离线回放称为真机成功。

本仓库只发布模块和匿名说明，不包含抓包、截图、订阅、账号、位置或CA私钥。参考原插件署名：[ZenmoFeiShi](https://github.com/ZenmoFeiShi)、[可莉](https://github.com/luestr/ProxyResource)，以及[Script Hub](https://github.com/Script-Hub-Org/Script-Hub)输出的规则组织；本三目标版本独立编写，无上游远程脚本代码。
