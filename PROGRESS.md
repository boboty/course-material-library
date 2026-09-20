# Project Progress

## 当前阶段

- V1
- Task 1: PASS
- Task 2: PASS
- Task 3: 待独立验收

## 已验收基线

- Task 2 accepted baseline: 320a543
- Migration head: 0003_usages
- CI: 未在本轮运行（本轮实际运行 `make check`；CI 沿用仓库 workflow）
- Backend tests: 107 passed
- E2E: 9 passed

## 已冻结判断

- 客户标准名称唯一
- 行业使用基础词表实体
- 人群类型使用基础词表实体
- 场次至少选择一个人群类型
- 课程状态为：启用 / 停用
- session_date 表示场次开始日期
- V1 当前不做删除语义
- V1 当前不做乐观并发控制
- 真实数据进入网络部署环境前必须完成最小单用户认证
- Task 3 新增的使用记录在备课阶段固定为：计划 / 未评
- 备课阶段撤销计划 = 删除该使用记录；“未用”属于课后确认事实，不在 Task 3 产生
- 使用记录的 POST 只接收 material_id，状态与效果只能由服务端产生

## 当前已具备

- 素材快速录入
- 素材标题搜索
- 素材详情
- 客户维护
- 课程维护
- 行业与人群类型维护
- 场次创建、列表与详情
- 场次计划素材：搜索全库素材、加入计划、撤销计划、场次详情读回
- 独立 E2E 数据库及安全门禁

## 当前尚未具备

- 课后登记
- 已用 / 未用状态转换
- 好 / 差效果登记
- 现场反应填写
- 现场临时新增素材并记录使用
- 素材完整编辑与筛选
- 素材家族
- 同客户 / 同集团重复提醒
- 系统复核提示
- 素材与课程多对多关系
- Markdown 批量导入

## 当前任务

- Task 3: 待独立验收
- Task 文件：`tasks/task-003.md`
- 目标：完成“已有场次 → 搜索素材 → 加入计划 → 持久化使用记录 → 场次详情读回 → 可撤销计划”的备课垂直切片
- 本轮实际完成范围：使用记录实体与 migration 0003；`GET/POST/DELETE /api/v1/sessions/{session_id}/usages`；场次详情计划素材区；素材选择页（搜索 / 加入 / 已加入状态 / 撤销）
- migration / schema 状态：`0003_usages` 为唯一 head；空库 upgrade head 与从 `0002_customers_courses_sessions` upgrade head 均已实测；`0003 → 0002` downgrade 可逆
- 本轮未进入：课后登记、已用 / 未用转换、好 / 差登记、现场反应、素材家族、重复提醒、素材与课程多对多、Markdown 导入

## 本轮验证记录

- `make check`：ruff `All checks passed!`；pyright `0 errors`；pytest `107 passed`；`e2e db guard verification PASS`；web lint / typecheck 通过；Vitest `3 passed`；Vite build 成功
- `make smoke`：health 200 + X-Request-ID PASS；not-found 404 error envelope 与 request id 一致 PASS
- `make e2e`：`9 passed`（Task 1 三条 + Task 2 四条 + Task 3 两条），连续两次均为 9 passed
- Alembic：空库 `upgrade head` 得到 9 张表；从 0002 `upgrade head` 只新增 `usages`
- Task 1 / Task 2 回归：全部通过，未修改其验收语义
- 真实服务实测：新场次 usages 为空；加入素材返回 201 且为“计划 / 未评 / reaction null”；重复加入 409 CONFLICT；携带 status/effect 的 POST 返回 422；撤销返回 204 且记录消失（再次删除 404）；未知场次 / 未知素材 / 错误归属删除均 404

## 已知风险或待验收事项

- 同一素材并发双击加入依赖数据库唯一约束兜底（服务端会转成 409）；前端通过点击后立即替换为“已加入”徽标避免重复提交
- E2E 数据库跨次累积虚构数据，未加入清理逻辑
- `docs/architecture.md` 与 `docs/verification.md` 尚未补充 Task 3 的实体与验证说明

## 下一步

- 独立验收 Task 3：复查使用记录语义、撤销计划即删除、以及未提前引入 Task 4 能力
- 验收通过后标记 Task 3 为 `PASS` 并更新 accepted baseline；发现问题则标记 `RC` 并记录待修项
- Task 4 才进入课后登记与状态 / 效果转换
