# Surge 去广告模块

仅发布模块、脚本与使用说明，不包含个人 HAR、账户、代理节点、令牌或证书私钥。

## 高德地图：v0.3.0 测试版

在 v0.2.0 开屏规则不变的基础上，新增**打车领券／红包／活动弹窗列表过滤**。底栏“探索”“长按说话”仍未实现隐藏，本版不处理它们。

### 固定安装与更新地址

```text
https://raw.githubusercontent.com/niu93/surge-modules/main/Amap.sgmodule
```

首次使用：在 Surge 模块管理中选择从 URL 安装。已安装远程版：对该模块执行更新，确认说明显示 v0.3.0；不要再并行启用旧本地版或其他重复高德模块。

要求 Surge iOS 5.9.1+，开启**重写、脚本、MITM**，安装并完全信任自己生成的 CA。新增的脚本需要可访问 GitHub Raw 以完成下载。GitHub 托管不会自动生成规则，后续仍需提交更新；手机端是否自动更新以当前版本界面为准。

### 打车弹窗处理范围

仅匹配：

```text
https://m5-zb.amap.com/ws/promotion-web/resource
```

对返回的 JSON：

- 清空 `data.popup.popup_list`。
- 清空 `data.popup.dataList[].protocol.popup_list`，并移除已清空的纯促销渲染项；未知结构和混合卡片的其他内容保留。
- 保留 `data.bubble`、`data.push`、响应状态及其他字段，不把整个接口拒绝或替换为 `{}`。
- 字段缺失、非 JSON、非 200 响应等情况保留原响应；超过 256 KiB 的响应由 Surge 跳过脚本透传。

这是对专用促销弹窗类别的处理，不以 `ad_flag=true` 为前提。抓包中的领券活动项实际标记为 `ad_flag=false`，不将其误称为明确广告标记。

**不处理**会员体验卡邀请、首次使用协议提示、订单、付款或安全提醒；不匹配 `/resource/home`、订单 `content_info` 或 `display/themeInfo` 等其他路径。不承诺保留所有可见元素的真机效果，仍需回归测试。

脚本只做本地 JSON 修改，不发网络请求，不记录敏感正文；模块中的脚本 URL 固定到已核对的 GitHub 提交，避免源码随 main 分支漂移。源码见 [`amap-taxi-popup.js`](./amap-taxi-popup.js)。

### 保留的开屏规则

- `amap-aos-info-nogw.amap.com/ws/aos/alimama/splash_screen_rt`：精确拒绝。
- `m5.amap.com/ws/valueadded/alimama/splash_screen`：本地返回 HTTP 200 / `{}`。

开屏接口被拒绝后可能跳过、重试、留白或回退，实际行为仍需设备验证。

### MITM 范围与隐私

模块追加 `m5.amap.com`、`amap-aos-info-nogw.amap.com`、`m5-zb.amap.com`。MITM 按主机解密，会涉及这些主机上的其他 HTTPS 请求，而不只是广告路径；不关闭服务端证书验证。

不要公开原始 HAR、Cookie、Token、设备标识、坐标、手机号、订单号、出行数据或 CA 私钥。

### 验证状态

已完成：

- 22 项本地 JavaScript 逻辑测试，其中包含真实 HAR 响应；仅已知促销列表发生预期变化，其他数据保持不变。
- 12 组 URL 正反例、模块静态检查、原开屏规则不变检查。
- 对 388 条 HAR 请求离线匹配，新增脚本规则只命中 1 条目标促销请求。

未完成：Surge 内核导入与运行、设备上弹窗是否消失，以及真实订单／付款／安全提醒的回归测试。**离线测试不等于真机有效。**

测试时完全退出高德，再进入打车页，查看最近请求的脚本命中记录。若有空白弹层、卡顿、脚本错误或业务异常，立即停用并回滚。不要驾驶时操作。抓包结束后关闭“捕获流量”。

### v0.2.0 备份与回滚

修改前已备份模块和说明，保留提交 `77687d4a01b9efdaf56f2bff823a9880c54f9fc4`。

旧版固定地址（不跟随 main 更新）：

```text
https://raw.githubusercontent.com/niu93/surge-modules/77687d4a01b9efdaf56f2bff823a9880c54f9fc4/Amap.sgmodule
```

回滚时停用新版，再安装该固定旧版地址，勿让新旧模块同时生效。也可将旧文件恢复为 main 上的新提交，不重写历史。

## 来源说明

旧开屏 Map Local 参考 [Repcz/Tool 中标注来源为可莉的模块](https://github.com/Repcz/Tool/blob/X/Surge/Module/Kelee/Amap_remove_ads.sgmodule)。本仓库未照搬其全部页面精简规则；实时开屏和此次促销弹窗处理依据本地抓包，不公开抓包本身。
