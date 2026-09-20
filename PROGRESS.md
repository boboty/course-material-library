# Project Progress

## 当前阶段

- V1
- Task 1: PASS
- Task 2: PASS
- Task 3: PASS

## 已验收基线

- Task 3 accepted baseline: 2f025b00a5f60d52066600985ecc78a635f41ce2
- Migration head: 0003_usages（单一 head）
- CI: PASS
- Backend tests: 115 passed
- Frontend tests: 3 passed
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
- Task 3 的撤销接口只能删除 status=计划 的使用记录，不得删除已用 / 未用事实

## 当前已实现

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

- 无进行中的 Task。Task 3 已通过独立复验并标记 PASS，accepted baseline 已更新。

## 下一步

- 等待 Task 4 的任务定义后再开工；本轮不进入 Task 4，不新增 migration、schema 或冻结判断。
