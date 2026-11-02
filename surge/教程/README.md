# Surge 去广告模块编写指南

本指南整理 Surge iOS/macOS 的使用、抓包、模块编写、跨客户端转换和验证经验，面向需要为单个 App 编写精确规则的用户。

**最后复核：2026-11-01。** 已结合 Surge 官方手册、Surge iOS 6 官方发行说明、公开模块项目和一批 Loon 插件的静态研究更新。本文中的文档结论不等于目标版本导入成功，更不等于真机 UI 已经验证。

> 本文只包含通用方法和匿名示例，不包含任何个人 HAR、截图、账号、位置、出行记录、代理节点、Cookie、Token、CA 私钥或完整个人配置。

## 目录

- [模块与请求处理模型](#module-model)
- [规则和响应改写](#rewrites)
- [SSE与二进制](#binary-streams)
- [MITM、DNS和QUIC](#mitm-dns-quic)
- [Surge iOS 6](#surge-ios-6)
- [跨客户端转换](#cross-client)
- [抓包、排错和验证](#validation)
- [依赖、发布和回滚](#release)
- [参考来源](#sources)

## 最重要的原则

1. 先确认 App 当前真实请求，再写规则；不要从域名、接口名称或字段名猜广告。
2. 优先使用最小能力：精准规则/拒绝 → Map Local → 原生 Body Rewrite/jq → 审阅后的 HTTP 脚本。
3. 只改已确认的广告字段，保留正常业务、状态、分页、未知内容和响应外壳。
4. 静态测试通过不等于 Surge 命中，更不等于真机界面已经变化。
5. 每次修改前备份完整模块、README、脚本、远程依赖、commit 和 SHA256，保留不可变回滚地址。
6. 测试版和正式版分开；测试版可以使用稳定统一地址，正式版只发布已验证的规则。
7. 无法确认时直接说明“未实现”或“证据不足”，不要把按钮失效说成按钮隐藏。
8. 公开源码可以学习，但没有许可证时只能阅读，不能默认复制、改名或重新发布。

<a id="module-model"></a>

## 一、Surge 模块和请求处理模型

### 1. 模块不是完整配置

`.sgmodule` 是主配置的补丁，不能替代完整配置，也不能通过模块修改 `[Proxy]` 或 `[Proxy Group]`。模块设置优先级高于主配置；支持的脚本、重写等行通常会插入原配置相应区段的前面，因此模块可能改变规则或脚本的优先顺序。

模块中的 `[Rule]` 只能使用 Surge 模块允许的内部策略，例如 `DIRECT`、`REJECT` 和 `REJECT-TINYGIF`。如果需求是把域名交给用户主配置中的自定义策略组，例如 `Proxy`、`JP`、`台湾节点`，不要硬塞进 `.sgmodule`：应提供不带策略列的远程 `RULE-SET`，再由主配置绑定策略。

典型模块结构：

```ini
#!name=模块名称
#!desc=v1.0.0：简短说明
#!requirement=CORE_VERSION>=20
#!system=iOS

[Body Rewrite]
...

[Script]
...

[MITM]
hostname = %APPEND% api.example.com
```

`%APPEND%` 追加原配置内容，`%INSERT%` 插入原配置前部；它们与 `#!arguments` 的参数占位符不是一回事。

### 2. HTTP 处理顺序和脚本冲突

当前官方文档给出的处理方向可概括为：

```text
Header Rewrite → URL Rewrite → Body Rewrite → HTTP Script
```

同一请求可以分别运行一个匹配的 `http-request` 脚本和一个匹配的 `http-response` 脚本；同一方向不是所有匹配脚本都会自动串联，通常由配置顺序中的第一个启用匹配脚本执行。两个重叠的响应脚本模块不一定会“一个接着一个”修改正文。

原生 Body Rewrite 不同：多个匹配的 Body Rewrite 规则可以按顺序执行，后一个规则接收前一个规则的结果。因此相关 jq 可以合并为一条便于审查的表达式，也可以拆成有明确前后关系的多步，但每一步都必须适应上一步的输出结构。

### 3. URL Rewrite、Map Local 和 Body Rewrite 不是同一种操作

| 目标证据 | 优先机制 | 关键差异 |
|---|---|---|
| 只承载广告的独立请求 | 精准 URL Rewrite `reject` | 请求被拒绝，可能触发重试或空位 |
| 客户端需要成功响应 | Map Local | 跳过上游，直接构造本地响应 |
| 广告和正常业务混在 JSON | `http-response-jq` | 保留响应结构，只删字段或元素 |
| 多层分支、流式、协议复杂 | HTTP response script | 需要审阅、超时、大小和异常回退 |
| protobuf/gRPC/其他二进制 | binary-body 脚本 | 必须先确认 schema、帧、压缩和长度 |
| SSE | 帧感知的 response script | 不能把网络 chunk 当成 JSON |

不要把其他客户端的 `reject-200`、`reject-dict`、`reject-array` 直接当作 Surge 语法。`{}`、`[]`、空正文、204、Map Local 和 REJECT 对客户端来说可能是完全不同的契约。

<a id="rewrites"></a>

## 二、规则和响应改写

### 1. URL 匹配

```ini
[URL Rewrite]
^https://ads\.example\.com/v1/banner(?:\?|$) _ reject
```

正则应限制：

- 协议和大小写；
- 精确主机；
- 精确路径；
- 查询参数边界；
- 必要时的请求方法或 User-Agent。

不要使用：

```regex
.*ad.*
```

也不要因为发现一个广告接口，就整域名拒绝共享的业务主机。URL Rewrite 的具体规则类型有自己的匹配限制，不能把“多条规则按顺序处理”的概括套到所有 header-mode 行为上。

### 2. Map Local

```ini
[Map Local]
(?i)^https://api\.example\.com/config(?:\?|$) data-type=text data="{}" status-code=200 header="Content-Type:application/json"
```

Map Local 会跳过上游请求并构造本地响应。`data-type=text` 的默认类型不是 JSON，因此需要时显式指定 `Content-Type`。返回值必须符合目标 App 的接口契约；客户端期待的可能是带状态字段的对象，而不是简单 `{}`。

### 3. 原生 jq

```ini
[Body Rewrite]
http-response-jq ^https://api\.example\.com/home(?:\?|$) 'if (.data.cards | type) == "array" then .data.cards |= map(select(if type == "object" then .kind != "ad" else true end)) else . end'
```

更复杂的规则应先定义类型保护：

```jq
def object: type == "object";
if (object and (.data | object) and (.data.cards | type) == "array") then
  .data.cards |= map(select(if object then .kind != "ad" else true end))
else . end
```

实践要求：

- 只根据稳定的业务键、类型或 ID 删除已确认卡片；
- 保留未知元素，不按全局字符串删除 `ad`；
- 字段缺失、类型错误、根节点错误时原样透传；
- 如果删除卡片会留下布局引用，只在关系已确认时同步删除引用；
- `jq empty` 不等于发送空正文，官方行为是保留原正文；
- 输入必须是有效 JSON，非法 jq 或非法 JSON 会跳过并记录警告；
- 原生 Body Rewrite 需要缓冲正文，不能对全域接口随意开启。

当前官方文档列出的限制：请求正文缓冲上限为 32 MB；响应修改上限为 iOS 1 MB、macOS 10 MB。过大的响应会放弃修改并原样流式传递；请求正文超过硬限制可能导致连接失败。jq Body Rewrite 的最低版本不能由普通 Body Rewrite 的版本号推断，应查看对应功能要求并在目标 Surge 版本导入验证。

建议至少测试：根对象、数组、`null`、字段缺失、错误类型、空列表、混合列表、未知对象、非法 JSON、超过大小限制的响应，以及前一条 jq 修改后的输出。

### 4. HTTP Response Script

现代 Surge 声明示例：

```ini
[Script]
filter = type=http-response,pattern=^https://api\.example\.com/home(?:\?|$),requires-body=true,max-size=262144,timeout=5,script-path=https://raw.githubusercontent.com/example/repo/COMMIT/filter.js
```

安全要求：

- `$done()` 或 `$done({})` 表示保留原交易；`abort:true` 才是主动中断；
- 每条正常、异常、解析失败和超时路径都必须恰好完成一次；
- 使用 `try/catch`，失败时不要构造伪造的成功 JSON；
- `requires-body=true` 会缓冲完整正文，只匹配必要的 URL；
- `max-size` 和 `timeout` 应显式设置并有理由；
- 当前官方文档中，响应脚本 `max-size` 默认是 iOS 1 MB/macOS 10 MB，脚本超限响应会透传；
- HTTP 脚本默认超时为 5 秒，超时不应被宣传成必然原样透传；
- 没有 `requires-body=true` 却返回正文不是安全的修改方式；
- 脚本方向按首个启用匹配执行，不能依赖多个脚本自动串联；
- 不记录完整正文、Cookie、Authorization、Token、坐标或带查询参数的完整 URL。

脚本应先在内存中完成解析、修改、重新编码和校验，全部成功后再一次性返回。对于二进制、压缩或带长度字段的响应，不能返回半截数据。

<a id="binary-streams"></a>

## 三、SSE、protobuf 和二进制

### 1. SSE

SSE 的网络读取块不等于完整事件。脚本应：

1. 缓冲直到空行形成完整帧；
2. 只解析合法 `data:` JSON；
3. 只修改已确认的卡片或列表；
4. 保留未知事件、顺序、`seq`、`has_more`、分页字段和 `COMPLETE` 等结束标记；
5. 非 JSON、异常和不完整帧原样保留。

不能逐网络 chunk `JSON.parse`，不能把整个流替换成 `{}`，不能因为一个广告卡片而删除快捷条、导航接续卡或正常业务共用的容器。

### 2. protobuf/gRPC

二进制正文不能当 UTF-8 JSON。开始改写前必须确认：

- 是否真的是 protobuf/gRPC，而不是普通 `octet-stream`；
- gRPC 5 字节帧头、大小端和消息长度；
- gRPC-Web 与普通 gRPC 的差异；
- 压缩标志、gzip 解压和重新编码；
- protobuf schema、未知字段和嵌套消息；
- offset、length、checksum/MD5；
- `Content-Encoding`、`Content-Length`、trailer 和最终 body 是否一致。

应分别测试 identity/gzip、空 body、错误 frame、未知字段、非零 buffer offset、多消息和流式响应。没有 schema 或长度/校验算法证据时，不发布二进制重写。

<a id="mitm-dns-quic"></a>

## 四、MITM、DNS 和 QUIC

### MITM

```ini
[MITM]
hostname = %APPEND% m5.amap.com, m5-zb.amap.com
```

MITM 是主机级别，不是路径级别。即使只修改一个 URL，该主机的其他 HTTPS 请求也可能被解密。只加入必要主机，使用自己生成并信任的 CA，不把 CA 私钥、`ca-p12` 或口令放进模块，不默认设置 `skip-server-cert-verify=true`。

注意：

- 模块追加 hostname 不能替代主配置启用 MITM 和系统信任 CA；
- hostname 排除项按顺序匹配，前面的排除可能阻止后面的追加；
- 证书固定可能导致 App 拒绝连接；
- “规则显示在模块详情”不能证明 HTTPS 正文真的被解密。

### DNS 和 HTTPDNS

普通 DNS、DoH、DoT、HTTPDNS 和 App 自己的 IP 解析不是同一层。不要为了实现一个 HTTP 正文模块擅自修改用户全局 DNS。HTTPDNS 拦截器这类集中依赖可能影响多个 App、CDN、登录、推送和媒体服务，应单独测试、单独说明，不要自动并入 App 专用模块。

### Surge iOS 6 的 QUIC 变化

Surge iOS 6 提供 Adaptive QUIC Blocking：当 App 能回退 TCP 时才阻止 QUIC，并按主机记忆结果；QUIC-only App 可以继续使用 QUIC。它有助于需要 HTTP/TCP 观察的场景，但不等于 Surge 可以改写 QUIC 正文，也不等于所有 App 都能 MITM。

<a id="surge-ios-6"></a>

## 五、Surge iOS 6 的开发影响

官方页面和发行说明显示，iOS 6 的相关变化包括：

- 配置和模块编辑时实时检查错误与警告，保存解析失败配置前会提示；
- Profile History 可以比较、复制补丁和回滚，版本最多保留一年且总量受限；
- 请求详情可以显示协议、状态、耗时、匹配规则和响应信息，并可从请求详情添加规则；
- `DOMAIN-SET` 和 `RULE-SET` 取消原一百万条上限；
- Wi-Fi Access 的 SOCKS5 支持 UDP ASSOCIATE；同一 association 只按首个数据包目的匹配一次；
- HTTP API 可提供 `/v1/mcp`，让 AI Agent 读取或修改配置、运行脚本和控制 Surge；
- Tailscale Exit Node/Subnet Router 和 WireGuard Listen Port 属于传输功能，不代表可以改写 App HTTPS 内容。

规则集取消上限不代表超大列表一定高效或安全，仍需测试更新、内存、匹配速度和实际覆盖范围。MCP 默认关闭，但 API Key 拥有完整控制权限，绝不能写入模块、日志、HAR、公开仓库或聊天内容，也不能暴露给不可信网络。

iOS 6 与 Surge Mac 6.11 共享部分引擎更新，但不能默认两端 UI、最低版本和全部能力完全相同。模块应记录实际测试平台和版本；官方发行页当时显示 TestFlight 已提供 iOS 6，而 App Store 仍显示 iOS 5，不能把 TestFlight 体验直接称为所有用户的稳定版本。

<a id="cross-client"></a>

## 六、Loon、Script Hub 与跨客户端转换

Loon 新版插件常见写法包括：

```ini
response if ${url} ~= /^https:\/\/api\.example\.com\/config/i then response.json.delete("data.ad")
response if ${url} ~= /^https:\/\/api\.example\.com\/config/i then response.json.jq("del(.data.banner)")
request if ${url} ~= /^https:\/\/ads\.example\.com/i then reject_dict(200)
```

还可能使用 `response.body.mock`、`binary_body_mode`、typed `select/switch/input` 参数、外部 `jq_file` 和远程脚本。它们是 Loon 的语义，不是 Surge 的字符串别名。

转换前应逐项报告：

- URL 匹配范围是否改变；
- request/response 方向是否改变；
- reject、Mock、Map Local 的响应契约是否改变；
- body 是否由文本变成二进制；
- 是否启用了不同的 JS engine；
- 参数、Cron、generic、network-changed 是否被目标客户端支持；
- 外部脚本和 JQ 是否存在、固定且具有许可证；
- 不支持的规则是否被明确标记，而不是静默丢弃。

“能导入”不等于“语义相同”。特别是 `reject-dict`、`reject-array`、Loon 的 `response-body-json-del`、Loon 脚本默认值和 Surge 的 `Map Local`/jq/HTTP Script 必须重新验证。

<a id="validation"></a>

## 七、抓包、排错与验证

### 1. 最小抓包流程

1. 明确 App/版本、页面位置、网络环境和已启用的重复模块；
2. 备份当前配置和模块；
3. 开启 Surge 的 HTTP 流量捕获，不要误用底层数据包捕获；
4. HTTPS 正文需要 MITM 时，只加入目标主机并使用自己的 CA；
5. 停用重复去广告模块，完全退出 App 后复现一次；
6. 按时间、主机和路径定位请求，记录脱敏的字段路径、类型和安全计数；
7. 关闭捕获，删除不必要的完整 HAR。

### 2. 证据等级

- 模块详情显示：只证明文件加载；
- 请求列表显示 URL：只证明请求发生；
- 请求详情显示 Rewrite/Script 命中：证明规则执行；
- 原始/修改后正文符合预期：证明响应发生变化；
- 真机 UI 变化且搜索、登录、刷新、导航、支付等相关功能正常：才是用户层面的有效结果。

### 3. 故障定位

**没有目标请求：** 先考虑缓存、冷启动时机、替代端点、本地 UI、抓包筛选和版本变化，不要继续扩大旧正则。

**只有域名/443，没有正文：** 检查 HTTP 引擎、MITM hostname、CA 信任、证书固定和 QUIC；不要用关闭服务端证书验证冒充解决方案。

**规则显示但不命中：** 检查协议、查询边界、模块启用、模块优先级、MITM、正文大小、Surge 版本和脚本方向。

**页面空白、卡顿或重试：** 立即停用最新模块，恢复固定回滚版本，单模块对照；重点检查响应契约、布局引用、拒绝行为和流式结束帧。

### 4. 四层验证

1. **静态：** 模块段、正反 URL、jq、脚本、版本要求、hostname、未知字段和隐私；
2. **导入：** 目标 Surge 版本是否解析，编辑器警告是否清除；
3. **命中：** 请求是否命中、是否解密、body 是否改变、大小/超时是否触发；
4. **真机：** 广告是否消失，相关业务是否仍正常，是否出现缓存、空位、延迟或重试。

还应测试失败路径：非法 JSON、缺字段、错误类型、过大响应、异常脚本、压缩失败、未知 protobuf 字段和构建失败。构建失败时不能继续发布旧产物。

<a id="release"></a>

## 八、依赖、许可证和发布回滚

### 远程依赖

正式模块应优先使用原生 URL Rewrite、Map Local 和 jq。必须使用脚本时：

- 固定到不可变 commit；
- 保存源码、commit、SHA256、依赖版本和许可证；
- 不把 `main`、`master`、`latest` 当成已经审计的正式版本；
- 升级远程脚本必须重新静态审查和回归；
- 远程脚本不记录完整请求和响应，异常原样透传。

### 许可证

公开代码的可见性不等于可自由复制。Apache、GPL、MIT 和无许可证项目的再分发义务不同。没有明确许可证时，学习行为和接口思路，独立实现代码；不要直接搬运脚本。保留来源、commit、许可证、修改文件和 NOTICE 要求。

### 发布流程

1. 备份完整仓库、模块、README、远程脚本和依赖；
2. 在副本上修改并记录基线 commit；
3. 运行静态、结构、正反 URL、样本响应和隐私检查；
4. 测试版使用稳定统一地址，版本号和说明区分；
5. 先验证目标 Surge 导入，再做请求命中和真机回归；
6. 真机确认后，才把完全相同的执行规则提升到正式地址；
7. 保留不可变 commit Raw 回滚地址，不重写历史。

### 发布前检查清单

- [ ] 没有 HAR、截图、Cookie、Token、账号、位置、节点或 CA 私钥；
- [ ] 没有脚本完整打印 body、headers 或带查询参数的 URL；
- [ ] MITM hostname 最小，未关闭服务端证书验证；
- [ ] Body Rewrite/Script 的大小上限和 timeout 有明确理由；
- [ ] 正则有协议、主机、路径和查询边界；
- [ ] 未知字段、异常和超限路径会透传；
- [ ] 远程脚本固定 commit 并有 SHA256/许可证记录；
- [ ] 跨客户端转换有语义损失报告；
- [ ] 静态、导入、命中、真机结果分开描述；
- [ ] 正式版有固定回滚地址；
- [ ] 正式说明保持简洁，不夸大未验证范围。

<a id="sources"></a>

## 参考来源

### Surge 官方

- [理解 Surge 原理](https://manual.nssurge.com/book/understanding-surge/cn/)
- [模块](https://manual.nssurge.com/profile/module.html)
- [Requirement](https://manual.nssurge.com/profile/requirement.html)
- [规则总览](https://manual.nssurge.com/rules/overview.html)
- [HTTP 处理](https://manual.nssurge.com/http/overview.html)
- [URL Rewrite](https://manual.nssurge.com/http/url-rewrite.html)
- [Map Local](https://manual.nssurge.com/http/map-local.html)
- [Body Rewrite](https://manual.nssurge.com/http/body-rewrite.html)
- [脚本总览](https://manual.nssurge.com/scripting/overview.html)
- [HTTP Response Script](https://manual.nssurge.com/scripting/http-response.html)
- [MITM](https://manual.nssurge.com/http/mitm.html)
- [加密 DNS](https://manual.nssurge.com/dns/encrypted-dns.html)
- [Surge iOS 6](https://nssurge.com/surge-ios-6)
- [Surge iOS 6 Release Notes](https://nssurge.com/surge-ios-6/release-notes)

### 公开项目和源码实践

- [DualSubs/Universal](https://github.com/DualSubs/Universal)
- [BiliUniverse/Enhanced](https://github.com/Biliverse/Enhanced)
- [NSRingo/WeatherKit](https://github.com/NSRingo/WeatherKit)
- [Script-Hub](https://github.com/Script-Hub-Org/Script-Hub)
- [xream/scripts](https://github.com/xream/scripts)
- [app2smile/rules](https://github.com/app2smile/rules)
- [Maasea/sgmodule](https://github.com/Maasea/sgmodule)
- [Rabbit-Spec/Surge](https://github.com/Rabbit-Spec/Surge)

具体代码借鉴时，应查看对应 commit 的许可证和实际文件，不要仅凭仓库名称或 README 判断可复用范围。
