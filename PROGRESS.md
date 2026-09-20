# Project Progress

## 当前阶段

- V1
- Task 1: PASS
- Task 2: PASS
- Task 3: 待复验

## 已验收基线

- Task 2 accepted baseline: 320a543
- Migration head: 0002_customers_courses_sessions
- CI: PASS
- Backend tests: 84 passed
- E2E: 7 passed

## 当前 Task 3 候选状态

- Candidate commit: 07deac0
- Working migration head: 0003_usages
- RC 修复自验：make check PASS（后端 115 passed、前端 3 passed）；make smoke PASS；make e2e 9 passed
- Migration head 仍为 0003_usages（单一 head）；alembic check：无 schema 漂移
- GitHub CI：独立验收时未取得该 candidate 的 CI 结果
- 独立验收结论：此前为 RC；当前修复待独立复验，accepted baseline 不变

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
- Task 3 的撤销接口只能删除 status=计划 的使用记录，不得删除已用 / 未用事实

## 当前已实现（Task 3 candidate）

- 素材快速录入
- 素材标题搜索
- 素材详情
- 客户维护
- 课程维护
- 行业与人群类型维护
- 场次创建、列表与详情
- 独立 E2E 数据库及安全门禁
- 使用记录实体与 migration 0003
- 场次计划素材：搜索、加入、读回、撤销
- GET / POST / DELETE 场次 usages API

## 当前尚未具备

- Task 3 独立复验通过
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

- Task 3: 待复验
- Task 文件：`tasks/task-003.md`
- 目标：完成“已有场次 → 搜索素材 → 加入计划 → 持久化使用记录 → 场次详情读回 → 可撤销计划”的备课垂直切片
- Candidate：`07deac0`

## RC 修复结果

1. **撤销计划 API 未锁定“计划”状态**
   - DELETE 增加 `status='计划'` 条件；已用 / 未用记录返回 404 且保持存在，已有计划撤销行为保持通过。

2. **数据库 CHECK 约束测试存在假绿，且缺少 reaction 空白验证**
   - CHECK 测试先创建真实场次与素材，分别触发非法 status、非法 effect 和空白 reaction，并核对失败约束名；场次与素材 FK 分别独立验证。

## 复验要求

- 只修上述 RC，不扩大 Task 3 范围，不进入 Task 4。
- 下一步：独立复验上述两项 RC；通过后才可将 Task 3 标记为 PASS 并更新 accepted baseline。
- 当前未新增 migration、schema 或冻结判断；Task 4 及后续范围仍未实现。
- 已知风险：本轮自验不等于独立复验；candidate 的 GitHub CI 结果仍未取得。
