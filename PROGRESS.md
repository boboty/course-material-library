# Project Progress

## 当前阶段

- V1
- Task 1: PASS
- Task 2: PASS
- Task 3: PASS
- Task 4: PASS
- Task 5: PASS
- Task 6: PASS
- Task 7: PASS
- Task 8: PASS
- Task 9: PASS
- Paseo Experiment 001: PASS（独立 Verifier 已验收；已由用户提交为 `794bcda`，未 push）
- 工程规范迁移 v1.1.0 → v1.2.0：PASS（非产品 Task）

## 已验收基线

- Task 3 accepted baseline: 2f025b00a5f60d52066600985ecc78a635f41ce2
- Task 4 accepted baseline: b08aa3fbbc8b0e7196a9827b50f9d6df491a3e9d
- Task 5 accepted baseline: 5ede01337f99fc4743fcb2b93896640e10c993e9
- Task 6 accepted baseline: 32deec0e5f8fd8776785d046cdb3be1310ce735f
- Task 7 accepted baseline: cdfd3d8ef8074997601cde7658a9fc0f129c55cf
- Task 8 accepted baseline: 465a510886148d217a780888d0ea31cc10b1605f
- Task 9 accepted baseline: e4c67874a979ebfea28bb6031c8ae2e6f49814d4
- Paseo Experiment 001 在 v1.1.0 规则下验收，后由用户以 `794bcda` 提交；该提交不追溯为 accepted baseline，Task 9 基线记录不变
- 工程规范迁移 v1.2.0 accepted baseline：Independent Verifier PASS 后创建的最终 commit `docs: migrate to BenYan Engineering Standard v1.2.0`（父提交 `794bcda`）
- Migration head: 0003_usages（单一 head）
- Task 3 独立验收时：CI PASS、后端 115 passed、前端 3 passed、E2E 9 passed
- Task 4 已通过独立复验
- Task 5 已通过独立验收
- Task 6 独立验收时：空 volume `docker compose up -d --build` 后 db/app 均 healthy、自动迁移至 `0003_usages`、`down` / `up -d` 后数据读回一致；后端 119 passed、前端 11 passed、E2E 14 passed、`make smoke` 通过
- Task 9 独立验收时：`make check` 通过（后端 123 passed、前端 14 passed）、`make smoke` 通过、`git diff --check` 通过；非回环数据库不再被拒绝，`demo-data` 与 `demo-clean` 均在执行前展示目标并要求确认，取消后数据零变化；未发现 schema / migration / API 契约变更
- Task 8 独立验收时：`make check` 通过（后端 121 passed、前端 14 passed）、`make smoke` 通过、E2E 18 passed（含 375px 布局与长页面保存按钮可达性）、`git diff --check` 通过；未发现 schema / migration / API 契约变更

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
- Task 6 冻结默认交付方式：Docker Compose 同时交付 app 与 PostgreSQL；生产前端随 app 镜像；FastAPI 同时提供 `/api/v1/*` 与 SPA；db healthy 后先执行 Alembic migration，成功后启动 Uvicorn；数据保存在 `postgres_data` volume
- 宿主机 `make dev` 保留为热更新开发方式；Compose 的 db 端口仅绑定 `127.0.0.1`，仅用于宿主机开发与验证
- Task 6 与已验收 WebApp Starter `075526b` 基线同源：`app/main.py`、`Dockerfile`、`docker-compose.yml` 与该基线一致，仅保留三处项目差异（Dockerfile 去掉未使用的 stage 别名、compose 回环发布 db 端口以保留宿主机开发、`.dockerignore` 额外排除 `.env`）
- SPA fallback 行为沿用已验收基线：HTML 响应不带 `X-Request-ID`，访问日志把 SPA 页面请求记为 404（客户端实际收到 200）。作为基线继承的已知限制记录，不在本 Task 修改
- Task 7：`make demo-data` 清空目标数据库全部业务数据后灌入固定 Demo 数据；`make demo-clean` 清空全部业务数据并保留 schema/migration；不要求与原有数据共存，不做 ownership 或同名词表复用（数据库地址限制已由 Task 9 取消）
- Task 9 冻结：Demo 数据命令的误操作保护为“执行前展示目标数据库 + 显式确认”，不再限制数据库主机；确认词固定为 `yes`，其他输入、直接回车与 EOF 一律取消且不修改数据；取消以退出码 0 结束；目标展示只输出驱动、主机、端口、库名、用户，不输出密码；保留 `APP_ENV` 必须为 local / development 的判断；`demo-data` 与 `demo-clean` 共用同一保护路径；不提供跳过确认的开关，不新增环境判断、数据库命名规则或权限机制
- Paseo Experiment 001 验证 Task 9 冻结规则的精确匹配边界；未新增或修改冻结判断
- Task 8 冻结：素材状态 / 使用效果 / 使用状态的 Badge tone 映射统一在 `web/src/ui/statusBadge.ts`，所有页面复用，不新增颜色体系；课后登记保存区为 sticky 动作区，显示已用 / 未用摘要，不做离开拦截；本 Task 不新增任何业务语义、schema、migration 或 API 契约

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
- Task 7 Demo 数据集：虚构素材、客户、课程、词表、多人群场次与使用记录；`make demo-data` 清空目标数据库全部业务数据后灌入固定数据，`make demo-clean` 清空全部业务数据；`APP_ENV=production` 被拒绝；不随应用启动自动灌入
- Task 9 Demo 数据导入保护：`make demo-data` / `make demo-clean` 可指向任意主机的数据库；执行前打印目标数据库与清空提示并等待确认，仅 `yes` 执行，其他输入取消且数据零变化
- Task 8 展示收口：页面 title / `html lang=zh-CN` / BenYan favicon；素材状态、使用效果、使用状态全站统一 Badge tone；场次详情“课后登记”为标题区主要操作、“选择计划素材”为次级操作；课后登记页 sticky 保存区与已用 / 未用摘要；卡片标题与 Badge 挤压修复；未知路由 404、列表与详情 loading、词表页错误返回入口修正；素材列表正文两行摘要

## 当前尚未具备

- 素材完整编辑与筛选、素材家族
- 同客户 / 同集团重复提醒、连续差评及系统复核提示
- 素材与课程多对多关系、Markdown 批量导入
- 课后登记完成状态字段（V1 不建设）
- 后端分页聚合 / 游标接口、可搜索的大候选集下拉（本 Task 明确不做）

## 当前任务

- **工程规范迁移：BenYan Engineering Standard v1.1.0 → v1.2.0 —— PASS**（非产品 Task，不编号为 Task 10，无 Task 文件）。
- 交付范围：仅 `AGENTS.md`（版本号更新；角色改为 Developer / Independent Verifier；RC 由 Verifier 写入且不 commit；PASS、验收证据、限制和 accepted baseline 仅由 Verifier 写入并创建最终任务 commit；Developer 内部 reviewer 不构成独立验收；push / merge 须人工授权）。另含本次 Verifier 写入的 `PROGRESS.md` 验收状态。
- 独立验收证据：逐条对照 v1.2.0 的 `standards/11-git-delivery.md`、`12-ai-collaboration.md`、`14-definition-of-done.md`、`checklists/independent-verification.md`、`templates/AGENTS.md`、`docs/new-project.md`，无冲突；在 `AGENTS.md`、`PROGRESS.md`、`README.md`、`docs/`、`tasks/`、`.github/` 中搜索 `v1.1.0`、`执行角色`、`独立验收角色` 无残留；`git diff --check` 通过；无未跟踪文件；app / web / tests / scripts / alembic / docs / tasks / README 未改动；`make check` 通过（ruff、pyright 0 errors、后端 135 passed、前端 14 passed、build）。
- 限制：`make check` 使用 Verifier 临时建立的本地 PostgreSQL `benyan_test` 实例（先执行 Alembic 至 head），验证后已销毁；未运行 `make smoke` / `make e2e`（本次仅治理文档变更）。Migration / schema 未变，单一 head 仍为 `0003_usages`。
- 已冻结规则变更：自本基线起，Task 状态与提交权限按 `AGENTS.md` v1.2.0 角色分工执行；既有 Task 1–9 及 Paseo Experiment 001 的验收记录不追溯改写。
- 尚未实现：素材编辑、素材家族、标签 / 行业 / 人群筛选、使用历史统计、重复提醒、素材与课程关联、Markdown 导入等原有未完成范围。

## 下一步

- 规范迁移已通过独立验收并提交；等待后续任务指令。push 须人工授权。
