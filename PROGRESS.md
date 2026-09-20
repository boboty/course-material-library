# Project Progress

## 当前阶段

- V1
- Task 1: PASS
- Task 2: PASS
- Task 3: PASS
- Task 4: PASS
- Task 5: PASS

## 已验收基线

- Task 3 accepted baseline: 2f025b00a5f60d52066600985ecc78a635f41ce2
- Task 4 accepted baseline: b08aa3fbbc8b0e7196a9827b50f9d6df491a3e9d
- Task 5 accepted baseline: 5ede01337f99fc4743fcb2b93896640e10c993e9
- Migration head: 0003_usages（单一 head）
- Task 3 独立验收时：CI PASS、后端 115 passed、前端 3 passed、E2E 9 passed
- Task 4 已通过独立复验
- Task 5 已通过独立验收

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
- 后端 `page_size` 最大 100 的分页契约不变；不提高上限、不新增分页聚合接口
- 业务上需要完整候选集的前端场景通过逐页读取获取全部数据（`fetchAllPages`，按实体 id 去重；词表维护页按 id 合并而非整体替换）
- E2E 共用持续累积数据库，`workers: 1` 作为当前测试执行策略接受
- offset 分页在跨请求并发写入下可能缺乏快照一致性，作为 V1 已知限制记录，不在本 Task 扩展处理

## 当前已实现

- 素材快速录入、标题搜索、详情
- 客户、课程、行业与人群类型维护
- 场次创建、列表、详情及计划素材搜索、加入、读回、撤销
- 独立 E2E 数据库及安全门禁
- 使用记录实体与 migration 0003、Task 3 GET / POST / DELETE usages API
- Task 4 场次级课后保存 API：计划状态转最终事实、效果及反应、已有素材临时补记、标题创建草稿并补记，事务整体提交
- 课后登记页与场次详情入口，移动端 375px 核心操作及保存后读回
- Task 5 完整候选集分页取全：场次创建页的客户 / 启用课程 / 人群类型、客户表单的行业、词表维护页的行业与人群类型在超过 100 条后仍完整可选 / 可见

## 当前尚未具备

- 素材完整编辑与筛选、素材家族
- 同客户 / 同集团重复提醒、连续差评及系统复核提示
- 素材与课程多对多关系、Markdown 批量导入
- 课后登记完成状态字段（V1 不建设）
- 后端分页聚合 / 游标接口、可搜索的大候选集下拉（本 Task 明确不做）

## 当前任务

- **Task 5：完整候选集分页截断修复 —— PASS**（Task 文件：`tasks/task-005.md`）
- 验收结论：已通过独立验收，accepted baseline 为 `5ede01337f99fc4743fcb2b93896640e10c993e9`。
- 本轮完成范围：
  - `web/src/api/client.ts` 新增 `fetchAllPages(loadPage, keyOf)`：按后端 `page_size` 上限 100 逐页取全，并按实体 id 去重。
  - 接入 `listAllCustomers`、`listEnabledCourses`、`listAllIndustries`、`listAllAudienceTypes`；场次创建页、客户表单、词表维护页改用取全后的完整候选集。
  - 词表维护页列表改为按 id 合并（不再整体替换），慢加载不会覆盖刚新增的条目；新增表单仍保持原交互。
  - 未改动任何后端代码、分页接口或 `page_size` 上限；`app/` 与 `alembic/` 无 diff。
- migration / schema 状态：无新增 migration 或 schema 变更；`alembic heads` 仍为单一 `0003_usages`；`alembic check` 无漂移。
- 施工自验结果：
  - `make check` 通过：ruff、pyright 0 error、后端 119 passed、E2E 数据库门禁 PASS、前端 lint / typecheck / 11 passed / build 通过。
  - `make smoke` 通过（health 与 404 error envelope）。
  - `make e2e` 通过：14 passed（含新增 3 条 101+ 实体取全流程），运行在持续累积的默认 E2E 库（当时 audience_types 196 / customers 207 / courses 208 / industries 101，均已超过 100）。
  - 反向对照：临时把 `fetchAllPages` 改回只取第一页，3 条新 E2E 全部失败（page 2 的客户 / 行业无法在页面选中），已还原。
  - Task 1–4 回归全部通过（后端 119 passed 覆盖既有能力，E2E 14 passed 覆盖既有流程）。
  - `git diff --check` 通过。
- 独立验收关注点已确认：完整候选集取全在列出的全部场景生效且未改变分页接口契约；词表维护页慢加载不丢新增项、不重复；`fetchAllPages` 去重与空页终止正确；E2E `workers: 1` 作为共享数据库下的稳定化手段被接受。
- 已知限制：
  - offset 分页在跨请求并发写入下可能缺乏快照一致性；作为 V1 已知限制记录，不在本 Task 扩展处理（不修改后端分页契约）。
  - 数据量很大时逐页取全会增加请求数；按 V1 数据规模可接受，未引入缓存或虚拟滚动。

## 下一步

- 不开始下一 Task。当前已验收基线为 Task 5（代码提交 `5ede01337f99fc4743fcb2b93896640e10c993e9`）。
