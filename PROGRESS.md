# Project Progress

## 当前阶段

- V1
- Task 1: PASS
- Task 2: PASS
- Task 3: PASS
- Task 4: PASS
- Task 5: PASS
- Task 6: 待独立验收

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
- Task 6 Compose 完整交付：app + PostgreSQL、生产前端随镜像、FastAPI 提供 SPA 与 API、db healthy 后自动 migration、app healthcheck、数据库 volume 持久化；宿主机 `make dev` 保留

## 当前尚未具备

- 素材完整编辑与筛选、素材家族
- 同客户 / 同集团重复提醒、连续差评及系统复核提示
- 素材与课程多对多关系、Markdown 批量导入
- 课后登记完成状态字段（V1 不建设）
- 后端分页聚合 / 游标接口、可搜索的大候选集下拉（本 Task 明确不做）

## 当前任务

- **Task 6：课程素材库运行与交付基线升级 —— 待独立验收**（Task 文件：`tasks/task-006.md`）
- 外部只读基线：Engineering Standard `7a3a6d6da51a70912f14800015583d7cf28d9be8`、WebApp Starter `075526b6394d4b552f3eda96088548c44a071fa3`；均按指定 commit 读取。
- 本轮完成：Docker 多阶段构建 React；Compose app/db 健康门禁和持久化；本项目 Alembic migration 成功后才启动 Uvicorn；FastAPI 交付 SPA、静态资源和 `/api/v1/*`；README 项目化。未修改 Task 1–5 业务逻辑、数据模型或产品语义。
- migration / schema：无新增 migration 或 schema 变更；全新 Compose volume 上自动迁移至单一 `0003_usages` head。容器重建后 head 保持不变。
- 自验：`docker compose up -d --build` 从空 volume 成功；db/app 均 healthy；首页、SPA 深链接、health 为 HTTP 200，未知 API 为 HTTP 404；创建虚构素材后执行 `docker compose down` / `up -d`，同一素材通过 API 读回，确认 volume 持久化。
- `make check` 通过：ruff、pyright、后端 119 passed、E2E 数据库门禁、前端 11 passed 与 build；`make smoke` 通过；`make e2e` 14 passed；`git diff --check` 通过。首次 `make check` 在测试库未创建时失败，按 `docs/verification.md` 创建并迁移 `benyan_test` 后重跑通过。
- 待独立验收：复核 Compose 空库迁移、健康与持久化证据及最终 diff；Task 6 不自行标 PASS。
- 当前限制：默认凭据只适用于本机开发；真实数据进入网络部署环境前仍须完成已冻结的最小单用户认证与数据保护要求。

## 下一步

- 对 Task 6 执行独立验收；当前已验收基线仍为 Task 5（代码提交 `5ede01337f99fc4743fcb2b93896640e10c993e9`）。
