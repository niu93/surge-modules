# Surge 高德地图模块

## 当前版本：v0.1.0（已回滚）

Amap.sgmodule 已逐字恢复为最初的开屏保守版。回滚通过新提交完成，不重写历史；此前 v0.4.0 的模块、说明、脚本及固定源码依赖均已完整备份。

### 固定远程地址

https://raw.githubusercontent.com/niu93/surge-modules/main/Amap.sgmodule

在 Surge 模块管理中更新已安装的远程模块，名称应为“高德地图去广告·开屏保守版”，源码注释含“版本：0.1.0”。关闭其他重复高德模块，再重启高德。

### 当前处理范围

仅对 m5.amap.com/ws/valueadded/alimama/splash_screen 的带查询参数请求，使用 Map Local 返回 HTTP 200、application/json 和空 JSON 对象。MITM 仅追加 m5.amap.com。

无 URL Rewrite、无脚本、无打车活动弹窗、红包或通勤浮标过滤。仓库中保留的 amap-taxi-popup.js 不再被当前模块引用或执行；不需要关闭其他模块使用的脚本总开关。

注意：此前高德 17.02.0 抓包未出现该旧开屏路径，因此 v0.1.0 可能无法屏蔽当前开屏广告。需 Surge iOS 5.9.1+、重写、MITM，以及自己生成并已信任的 CA。未做真机验证。

### 保留的 v0.4.0 快照

https://raw.githubusercontent.com/niu93/surge-modules/80115ae3dfb87473bec13cfb44506d55513dc028/Amap.sgmodule

如需恢复该版，先停用当前版，勿同时启用多个版本。不要删除节点、证书或重置主配置；用户手动加入的抓包主机名不会由本模块自动删除。

仓库不包含 HAR、凭证、位置数据或 CA 私钥。旧接口依据：https://github.com/Repcz/Tool/blob/X/Surge/Module/Kelee/Amap_remove_ads.sgmodule
