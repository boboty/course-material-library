# Project Progress

## 当前阶段

- V1
- Task 1: PASS
- Task 2: PASS
- Task 3: PASS
- Task 4: PASS

## 已验收基线

- Task 3 accepted baseline: 2f025b00a5f60d52066600985ecc78a635f41ce2
- Task 4 accepted baseline: b08aa3fbbc8b0e7196a9827b50f9d6df491a3e9d
- Migration head: 0003_usages（单一 head）
- Task 3 独立验收时：CI PASS、后端 115 passed、前端 3 passed、E2E 9 passed
- Task 4 已通过独立复验

## 已冻结判断

- 客户标准名称唯一
- 行业使用基础词表实体
- 人群类型使用基础词表实体，场次至少选择一个
- 课程状态为：启用 / 停用
- session_date 表示场次开始日期
- V1 当前不做删除语义或乐观并发控制
- 真实数据进入网络部署环境前必须完成最小单用户认证
- 备课阶段新增 usage 固定为计划 / 未评；撤销计划删除该 usage，不产生未用
- 备课 POST 只接收 material_id；撤销接口只能删除计划记录
- Task 4 课后登记为一次完整提交：页面编辑状态中的全部修改仅在点击“保存课后登记”后，于一个事务中整体落库；未保存退出不产生课后事实、临时素材或 usage
- 临时加入已有素材和临时新建素材初始为已用 / 未评 / reaction=null；保存前可明确登记好 / 差及现场反应，初始值不是最终限制
- 未用记录必须为 status=未用、effect=未评、reaction=null；切换未用清除效果与现场反应，切回已用也不恢复旧值；空白反应归一化为 null
- V1 不新增“课后登记完成”状态字段

## 当前已实现

- 素材快速录入、标题搜索、详情
- 客户、课程、行业与人群类型维护
- 场次创建、列表、详情及计划素材搜索、加入、读回、撤销
- 独立 E2E 数据库及安全门禁
- 使用记录实体与 migration 0003、Task 3 GET / POST / DELETE usages API
- Task 4 场次级课后保存 API：计划状态转最终事实、效果及反应、已有素材临时补记、标题创建草稿并补记，事务整体提交
- 课后登记页与场次详情入口，移动端 375px 核心操作及保存后读回

## 当前尚未具备

- 素材完整编辑与筛选、素材家族
- 同客户 / 同集团重复提醒、连续差评及系统复核提示
- 素材与课程多对多关系、Markdown 批量导入
- 课后登记完成状态字段（V1 不建设）

## 当前任务

- Task 4 已通过独立复验并标记 PASS。代码 accepted baseline 为 b08aa3fbbc8b0e7196a9827b50f9d6df491a3e9d；未新增 migration 或 schema 字段。
- 验收收口：按产品确认保留 TemporaryUsage / TemporaryMaterial 的 effect、reaction 能力；修订 Task 文件的初始默认值表述；P3 处理空白反应和状态往返的旧值清理。
- 自验结果：`make check` 通过（后端回归、前端测试、lint、类型检查及构建）；`make smoke` 通过；`make e2e` 在全新专用数据库通过（11 passed，含课后完整流程、状态切换、临时素材效果及 375px 移动端）；`alembic heads` 为单一 `0003_usages`；`alembic check` 无 schema 漂移；`git diff --check` 通过。
- 独立后续缺陷（验收 P2，非 Task 4 RC）：人群词表超过 100 条时场次页加载不全；本轮未修改。复用积累较多数据的默认 E2E 库可触发相关超时，全新专用库完整套件通过。

## 下一步

- Task 4 已收口。本轮不开始下一 Task；人群词表超过 100 条的场次页加载缺陷另行处理。
