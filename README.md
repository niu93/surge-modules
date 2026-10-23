# Surge 去广告模块

本仓库用于通过固定 URL 分发 Surge iOS 模块。仅包含规则与使用说明，不包含个人抓包、账户信息、代理节点、令牌或证书私钥。

## 高德地图开屏广告测试版

- 文件：[`Amap.sgmodule`](./Amap.sgmodule)
- 当前版本：**v0.2.0（测试版）**
- 最低要求：**Surge iOS 5.9.1+**，开启重写和 MITM，并安装、信任自己生成的 CA 证书。
- 范围：精确拒绝已观察到的实时开屏接口，保留旧开屏接口的本地空 JSON 映射。不处理全部广告、不精简搜索或其他业务页面。

### 固定远程地址

```text
https://raw.githubusercontent.com/niu93/surge-modules/main/Amap.sgmodule
```

在 Surge 的模块管理中选择从 URL 安装，粘贴以上地址。安装后停用重复的旧版和其他高德去广告模块，避免冲突。

### 更新方式

后续版本继续更新同一路径的 `Amap.sgmodule`，不需要更换上述链接。在 Surge 模块管理中对已安装模块手动执行更新，并检查版本说明；是否提供自动更新及其行为，以当前 Surge 版本界面为准。GitHub 托管本身不会自动生成新规则。

### 作用与风险

本版仅针对以下两个路径：

- `amap-aos-info-nogw.amap.com/ws/aos/alimama/splash_screen_rt`：精确拒绝。
- `m5.amap.com/ws/valueadded/alimama/splash_screen`：本地返回 HTTP 200 / `{}`。

MITM 追加 `m5.amap.com` 和 `amap-aos-info-nogw.amap.com`，会解密这些主机上的其他 HTTPS 请求，不只是广告路径；不关闭服务端证书验证。

新接口的样本响应包含 JSON 广告元数据与 JPEG 素材，不是普通 JSON。本版没有擅自构造该接口的无广告响应。客户端被拒绝后可能跳过广告，也可能重试、留白或回退，需实际设备验证。

### 已完成与未完成的验证

- 已完成：静态结构检查、13 组合成 URL 正反例，以及本地 HAR 的离线匹配。样本中的新开屏请求命中 1 条。
- 未完成：Surge 真机导入、实际拦截效果、重试行为和导航等业务回归测试。

**离线匹配成功不等于真机去广告有效，也不保证兼容所有高德版本。**

### 测试与回滚

启用后完全退出高德再打开，在最近请求中检查目标路径是否被拒绝，并确认定位、搜索和路线规划正常。出现卡顿、留白、网络错误或大量重试时，关闭本模块并重启高德对照。请勿驾驶时操作。

反馈时只提供脱敏截图和必要请求信息，不公开原始 HAR、Cookie、Token、设备标识、坐标、出行数据或 CA 私钥。

## 来源说明

旧开屏接口规则参考 [Repcz/Tool 中标注来源为可莉的模块](https://github.com/Repcz/Tool/blob/X/Surge/Module/Kelee/Amap_remove_ads.sgmodule)。本仓库只保留其中的旧开屏 Map Local 规则，未照搬整份页面精简模块。实时开屏规则来自本地抓包分析，不公开原始抓包。
