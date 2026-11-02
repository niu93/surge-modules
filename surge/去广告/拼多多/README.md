# 拼多多统一测试版

## v0.2.7-test10：撤销无效皮肤实验

test9已确认执行selected_bottom_skin删除、主页两数组过滤为三项，用户仍明确反馈同次界面五项，因此没有观察到该实验的目标收益。本版撤掉该字段过滤，恢复test8两条基础规则，不再改变可选皮肤。

**这不是新的底栏修复版。当前客户端原生界面为何仍显示五项，尚未确定。** 过去test5用户曾反馈成功，不代表此后每次启动都有效，不能继续笼统称为已解决。

## 唯一远程地址

```text
https://raw.githubusercontent.com/niu93/surge-modules/main/surge/%E5%8E%BB%E5%B9%BF%E5%91%8A/%E6%8B%BC%E5%A4%9A%E5%A4%9A/Pinduoduo-Rebuild-Test.sgmodule
```

继续更新同一模块，不新增安装路径。

## 保留与撤销

- 保留开屏接口`api.pinduoduo.com/api/cappuccino/splash`的空配置实验。
- 保留主页`api.pinduoduo.com/api/alexa/homepage/hub`中bottom_tabs、buffer_bottom_tabs的首页/聊天/个人中心三链接白名单，含类型保护及异常透传。
- 有效配置与test8相同，仅修改版本标识；删除test9的selected_bottom_skin规则。
- 不再含此前xg阻断、个人/聊天三个候选映射，也不新增其他主机、JS、未知开关、id/group重编号或图片拦截。
- 当前不处理个人中心与聊天页圈选推荐，不承诺去除。

## 已核实与尚未知

最新样本两份主页响应均有明确的body rewrite修改日志，selected_bottom_skin已不存在、bottom_skin仍保留、两数组三项；无已查得的改写错误。用户仍见五项，说明这些数据级修改不足以证明原生UI已采用。不能直接归因为缓存、另一接口或客户端校验，更不应继续盲删相邻字段。

本版仅为撤销无效实验。更新后检查开屏、底栏及正常加载；若出现任何业务异常可停用模块对照。不要求清除数据、退出账号、卸载重装或长期捕获私人流量。

MITM仅追加api.pinduoduo.com，使用自己的CA，不关闭上游证书校验。原生jq最低需Surge iOS5.14+/Mac5.9+，建议iOS6；CORE_VERSION>=20只是通用Body Rewrite门槛。

发布前固定备份test9及仓库，高德/Rex等无关资源不变；未上传HAR、截图、私人配置、凭证、位置或专属DNS。参考原底栏规则作者ZenmoFeiShi、可莉；不声称上游担保本版本效果。
