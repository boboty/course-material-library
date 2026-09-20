# Project Progress

## 当前阶段

- V1
- Task 1: PASS
- Task 2: PASS
- Task 3: 进行中

## 已验收基线

- Task 2 accepted baseline: 320a543
- Migration head: 0002_customers_courses_sessions
- CI: PASS
- Backend tests: 84 passed
- E2E: 7 passed

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

## 当前已具备

- 素材快速录入
- 素材标题搜索
- 素材详情
- 客户维护
- 课程维护
- 行业与人群类型维护
- 场次创建、列表与详情
- 独立 E2E 数据库及安全门禁

## 当前尚未具备

- 场次计划素材
- 使用记录
- 课后登记
- 素材完整编辑与筛选
- 素材家族
- 同客户 / 同集团重复提醒
- 系统复核提示
- Markdown 批量导入

## 当前任务

- Task 3: 进行中
- Task 文件：`tasks/task-003.md`
- 目标：完成“已有场次 → 选择计划素材 → 持久化使用记录 → 读回 → 撤销计划”的备课垂直切片
- 明确不进入 Task 4 的课后状态转换与效果登记

## 下一步

- 施工 Agent 阅读 `AGENTS.md`、`PROGRESS.md`、`tasks/task-003.md` 后执行 Task 3
- 完成自验后先更新 `PROGRESS.md` 为“待独立验收”，再输出施工报告
- 独立验收 Task 3
