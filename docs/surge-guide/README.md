# Surge 去广告模块编写指南

本指南整理 Surge iOS 的使用、抓包、模块编写和验证经验，面向需要为单个 App 编写精确去广告规则的用户。

> 本文只包含通用方法和匿名示例，不包含任何个人 HAR、截图、账号、位置、出行记录、代理节点、Cookie、Token、CA 私钥或完整个人配置。

## 目录

- [工作原理](concepts.md)
- [模块写法](module-cookbook.md)
- [抓包与排错](debug-and-validation.md)
- [官方与公开源码来源](sources.md)

## 最重要的原则

1. 先确认 App 当前真实请求，再写规则；不要从域名或字段名猜广告。
2. 优先使用最小能力：精准拒绝 → Map Local → 原生 jq → 审阅后的脚本。
3. 只改已确认的广告字段，保留正常业务、状态、分页和未知内容。
4. 静态测试通过不等于 Surge 命中，更不等于真机界面已经变化。
5. 每次修改前备份完整模块、README、脚本和固定脚本依赖，保留不可变回滚地址。
6. 测试版和正式版分开；所有测试版使用同一个更新地址，用版本描述区分。
7. 无法确认时直接说明“未实现”或“证据不足”，不要把按钮失效说成按钮隐藏。

## 当前模块格式

Surge 模块通常包含：

```ini
#!name=模块名称
#!desc=版本号和简短作用说明

[Map Local]
...

[Body Rewrite]
...

[Script]
...

[MITM]
hostname = %APPEND% example.com
```

模块是主配置补丁，不是完整配置文件；不能用模块修改 `[Proxy]` 和 `[Proxy Group]`。`%APPEND%` 用于保留主配置已有列表并追加内容。

## 安全范围

MITM 按主机名生效，不按路径生效。即使模块只改一个广告路径，该主机上的其他 HTTPS 请求也可能被解密。因此应尽量缩小 hostname 列表，使用自己的 CA，不关闭服务端证书验证，不分享 CA 私钥。


---

# Surge 模块写法与选择方法

## 1. 先判断广告承载形式

| 证据 | 优先方法 | 注意 |
|---|---|---|
| 独立广告域名或素材请求 | 精准 `DOMAIN` / `URL Rewrite reject` | 共享 CDN 不能整域拒绝 |
| 接口必须返回成功结构 | `Map Local` | `{}`、`[]`、空正文和 204 不是同义 |
| 广告与业务数据混在 JSON | `http-response-jq` | 只删已确认字段/列表 |
| 需要复杂分支或协议处理 | `http-response` 脚本 | 审阅源码、固定版本、控制内存 |
| protobuf/gRPC/二进制 | binary-body 脚本 | 必须理解压缩、帧长、偏移、校验 |
| SSE/流式响应 | SSE 响应脚本 | 按完整帧处理，保留结束事件 |

## 2. URL Rewrite

```ini
[URL Rewrite]
^https://ads\.example\.com/v1/banner(?:\?|$) _ reject
```

正则应限制协议、主机、路径和查询边界。不要使用笼统的 `.*ad.*`。HTTPS 请求需要目标主机在 MITM 列表中，且请求必须经过 HTTP 引擎。

## 3. Map Local

```ini
[Map Local]
(?i)^https://ads\.example\.com/config\? data-type=text data="{}" status-code=200 header="Content-Type:application/json"
```

Map Local 会跳过上游请求并直接返回本地响应。返回值必须符合目标接口契约；如果客户端期待业务字段，空对象可能导致空白或重试。

## 4. 原生 jq

```ini
[Body Rewrite]
http-response-jq ^https://api\.example\.com/home\? \
  'if (.data.cards | type) == "array" then .data.cards |= map(select(.kind != "ad")) else . end'
```

实际模块中通常压成一行。应使用类型保护：

```jq
def object: type == "object";
if (object and (.data | object) and (.data.cards | type) == "array") then
  .data.cards |= map(select(if object then .kind != "ad" else true end))
else . end
```

建议覆盖这些输入：根对象、数组、`null`、字段缺失、字段类型错误、空列表、混合列表、未知对象和非法 JSON。异常时保留原响应。

jq Body Rewrite 需要 Surge iOS 5.14.0+；响应正文必须是有效 JSON。正文超过限制或规则异常时，官方行为可能是跳过并透传，不能当作一定修改成功。

## 5. HTTP Response 脚本

现代声明：

```ini
[Script]
filter = type=http-response,pattern=^https://api\.example\.com/home,requires-body=true,max-size=262144,timeout=5,script-path=https://raw.githubusercontent.com/example/repo/COMMIT/filter.js
```

基本安全模板：

```javascript
(function () {
  var result = {};
  try {
    if (typeof $response !== "undefined" &&
        typeof $response.body === "string" &&
        $response.body.length > 0) {
      var obj = JSON.parse($response.body);
      // 仅在结构和广告条件都确认后修改 obj。
      result = { body: JSON.stringify(obj) };
    }
  } catch (_) {
    result = {};
  }
  $done(result);
})();
```

注意：

- 每次脚本必须完成一次 `$done`；`$done({})` 表示原样透传，`abort:true` 才是中断。
- `requires-body=true` 会缓冲完整正文，不应匹配全域。
- 当前官方文档：响应超出 `max-size` 会跳过脚本透传；请求超限的行为不同。
- 同一请求/响应最多运行一个匹配的同方向脚本；重复模块可能互相覆盖。
- 远程脚本会自动下载/缓存。生产模块应固定不可变 commit URL，记录 SHA256，审阅每次更新。

## 6. 二进制、gRPC 和 SSE

### 二进制 / protobuf

不能把二进制正文当 UTF-8 JSON。公开模块实例显示，正确流程可能包括：读取 Uint8Array、解析 protobuf schema、处理压缩、保留未知字段、修改目标消息、重算帧长度/偏移/校验，再返回完整 body。缺少 schema 或校验算法时不要猜。

### SSE

SSE 响应由多个 `data:` 帧和结束事件组成。脚本应：

1. 按空行分割完整 SSE 帧；
2. 只解析合法 JSON data 帧；
3. 修改明确的卡片列表；
4. 保留事件顺序、`seq`、分页字段和 `COMPLETE`；
5. 非 JSON、未知事件、异常和不完整帧原样透传。

不能逐网络 chunk `JSON.parse`，不能整体替换成 `{}`，不能删除包含快捷条、导航接续或正常业务的共享容器。

## 7. 元数据和版本条件

可使用：

```ini
#!name=名称
#!desc=版本和简短范围
#!requirement=CORE_VERSION>=20
#!system=iOS
```

复杂能力要标注最低版本，不能把 Map Local 的最低版本套用到 jq 或脚本。需要用户配置时可使用 `#!arguments`，但参数名和占位符必须严格匹配。

## 8. 公开源码借鉴边界

广告平台拦截模块、分流列表、App 专用模块是三种不同东西：不能把普通业务分流列表全部设成 REJECT，也不能把大规模聚合广告模块直接套到单个 App。

跨客户端的 `url reject-200`、`url reject-dict` 等写法不能直接当作 Surge 语法。借鉴 MIT 代码时保留许可和署名；远程脚本只引用已审阅、固定版本的源码。


---

# 抓包、排错与验证

## 1. iOS 抓包基本流程

1. 启动 Surge。
2. 开启“捕获流量”，不是“数据包捕获”。后者是底层 TCP/UDP/ICMP 级别分析，通常不是写 App 去广告模块所需。
3. 需要 HTTPS 正文时，生成并信任自己的 MITM CA。
4. 只把目标主机加入 MITM，不要一开始使用 `*`。
5. 停用重复去广告模块，完全退出 App 后重新打开并复现一次。
6. 在最近请求中按主机、时间和路径筛选，查看完整 URL、状态码、响应正文和重写命中说明。

抓包结束关闭捕获流量。分享记录前隐藏 Cookie、Authorization、Token、设备标识、坐标、家庭/工作地址、订单和出行信息。

## 2. 判断是否真的命中

以下证据强度不同：

- 模块详情里显示规则：只能证明配置被加载。
- 请求列表出现目标 URL：只能证明请求发生。
- 请求详情出现 Rewrite/Script 命中：才能证明规则实际执行。
- 返回数据发生预期变化：证明响应被改写。
- 真机页面变化且正常功能通过：才算用户层面的有效。

“广告没看到”不等于规则命中；可能是缓存、服务端实验、请求没有发生或其他模块生效。

## 3. 常见故障定位

### 没有请求记录

可能是页面从本地缓存读取、接口只在冷启动请求、模块未启用、捕获过滤条件不对，或当前版本换了接口。不要马上扩大正则或删除整个域名。

### 只看到域名/443，没有 URL 和正文

检查 HTTP 捕获、MITM 主机名、CA 安装和系统信任；也要考虑证书固定或 QUIC。不要默认关闭服务端证书验证。

### 规则显示但没有命中

检查：

- URL 是否包含正确的协议、查询边界和主机；
- App 请求是否走 HTTP 引擎；
- MITM 是否覆盖目标主机；
- 是否有其他模块先处理了同一响应；
- 规则所需的 Surge 版本是否满足；
- response body 是否超过 `max-size`；
- SSE/二进制是否被当作普通 JSON。

### 页面出现空白/卡顿/重试

立即停用当前模块并重启 App 对照。不要继续叠加规则。常见原因是返回结构不符合契约、删除了布局引用、拒绝接口引起重试，或流式响应结束帧损坏。

## 4. 推荐的验证分层

### 静态验证

检查模块段、正则正反例、jq 语法、脚本语法、版本要求和 hostname。对 JSON 测试正常对象、数组、`null`、缺字段、错误类型和未知字段。

### Surge 导入验证

在目标 Surge 版本导入测试模块，查看警告；确认重写/脚本/MITM 开关和模块优先级。Python 或系统 jq 通过不能替代 Surge 内核导入。

### 请求命中验证

看最近请求是否包含目标路径，打开详情查看命中说明、原始/修改后正文和脚本日志。SSE 要查看完整帧处理；二进制要查看正文模式和错误。

### 真机回归

至少验证搜索、登录、内容刷新、地图、路线规划、导航、打车、订单、付款和安全提示中与修改范围相关的功能。测试版和正式版不要同时启用。

## 5. 发布、版本和回滚

推荐流程：

1. 备份当前仓库全部文件和远程脚本依赖；
2. 在副本上修改；
3. 保存本地静态/结构/真实样本测试；
4. 测试版使用统一安装地址，版本号递增；
5. 真机确认后再转正式；
6. 正式版保留不可变提交回滚地址，不重写历史。

模块路径应保持稳定，例如：

```text
https://raw.githubusercontent.com/example/repo/main/App-Rebuild-Test.sgmodule
```

测试版继续更新同一路径，不为每一版新建安装地址；固定 commit URL 只用于回滚。

## 6. 安全和隐私检查清单

发布前确认：

- 没有 HAR、截图、Cookie、Token、账号、位置、节点、CA 私钥；
- 脚本没有完整打印响应或请求头；
- 没有不必要的全域 MITM；
- 没有关闭服务端证书验证；
- 远程脚本来源和 commit 已固定；
- README 没有承诺未经验证的全版本有效；
- 正式说明按需要保持简洁，详细风险放单独文档或发布说明。


---

# 参考来源

本指南只整理通用知识和匿名示例。以下链接是实际阅读过的公开资料，具体参数仍应以目标 Surge 版本官方手册为准。

## 官方手册

- [理解 Surge 原理](https://manual.nssurge.com/book/understanding-surge/cn/)
- [快速入门](https://manual.nssurge.com/getting-started/quick-start.html)
- [模块](https://manual.nssurge.com/profile/module.html)
- [规则总览](https://manual.nssurge.com/rules/overview.html)
- [HTTP 处理](https://manual.nssurge.com/http/overview.html)
- [URL Rewrite](https://manual.nssurge.com/http/url-rewrite.html)
- [Map Local](https://manual.nssurge.com/http/map-local.html)
- [Body Rewrite](https://manual.nssurge.com/http/body-rewrite.html)
- [脚本总览](https://manual.nssurge.com/scripting/overview.html)
- [HTTP Response Script](https://manual.nssurge.com/scripting/http-response.html)
- [MITM](https://manual.nssurge.com/http/mitm.html)

## GitHub 公开源码

- [Repcz/Tool：高德模块](https://raw.githubusercontent.com/Repcz/Tool/X/Surge/Module/Kelee/Amap_remove_ads.sgmodule)
- [Repcz/Tool：12306 模块](https://raw.githubusercontent.com/Repcz/Tool/X/Surge/Module/Kelee/12306_remove_ads.sgmodule)
- [Repcz/Tool：广告平台模块](https://raw.githubusercontent.com/Repcz/Tool/X/Surge/Module/Kelee/BlockAdvertisers.sgmodule)
- [blackmatrix7：Advertising](https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rewrite/Surge/Advertising/Advertising.sgmodule)
- [blackmatrix7：Advertising 说明](https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rewrite/Surge/Advertising/README.md)
- [ddgksf2013：高德跨客户端规则](https://raw.githubusercontent.com/ddgksf2013/Rewrite/master/AdBlock/AmapAds.conf)
- [app2smile/rules](https://github.com/app2smile/rules)
- [Maasea/sgmodule](https://github.com/Maasea/sgmodule)

## 许可提醒

借鉴公开项目的代码时，应遵守其许可证和署名要求。规则语法、文档链接和模块结构不等于可以无条件复制第三方脚本。远程脚本应先审阅并固定版本。
