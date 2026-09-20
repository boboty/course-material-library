# Project Progress

## 当前阶段

- V1
- Task 1: PASS
- Task 2: PASS
- Task 3: PASS
- Task 4: PASS
- Task 5: PASS
- Task 6: PASS

## 已验收基线

- Task 3 accepted baseline: 2f025b00a5f60d52066600985ecc78a635f41ce2
- Task 4 accepted baseline: b08aa3fbbc8b0e7196a9827b50f9d6df491a3e9d
- Task 5 accepted baseline: 5ede01337f99fc4743fcb2b93896640e10c993e9
- Task 6 accepted baseline: 32deec0e5f8fd8776785d046cdb3be1310ce735f
- Migration head: 0003_usages（单一 head）
- Task 3 独立验收时：CI PASS、后端 115 passed、前端 3 passed、E2E 9 passed
- Task 4 已通过独立复验
- Task 5 已通过独立验收
- Task 6 独立验收时：空 volume `docker compose up -d --build` 后 db/app 均 healthy、自动迁移至 `0003_usages`、`down` / `up -d` 后数据读回一致；后端 119 passed、前端 11 passed、E2E 14 passed、`make smoke` 通过

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

- **Task 6：课程素材库运行与交付基线升级 —— PASS**（Task 文件：`tasks/task-006.md`）
- 验收结论：已通过独立验收，accepted baseline 为 `32deec0e5f8fd8776785d046cdb3be1310ce735f`。
- 验收方式：删除 `course-material-library_postgres_data` volume 后从空环境重新 `docker compose up -d --build`，独立复跑 Compose 启动、健康门禁、迁移、SPA/API 路由、持久化与全部代码级门禁。
- 本轮独立复核结果：
  - 空 volume 启动：db 先 healthy，app 随后 healthy（约 13s）；容器日志顺序为先 `Alembic migration completed` 再 Uvicorn 启动。
  - 迁移：容器内 `alembic current` / `alembic heads` 均为单一 `0003_usages`；`alembic_version` 与 9 张业务表齐备；容器重建后 head 不变。
  - 迁移失败边界：以错误数据库口令运行同一镜像，alembic 报错、容器退出码 1，Uvicorn 未启动。
  - HTTP：`/`、SPA 深链接 `/sessions/<id>/post-class`、`/assets/index-*.js` 均 200 且内容正确；`/api/v1/health` 为 200 JSON；`/api/v1/not-found`、`/api`、未知静态资源为 404 JSON 且带 `X-Request-ID` 错误信封。
  - 持久化：经 API 创建虚构素材后 `docker compose down`（保留 volume）再 `up -d`，该记录可按 id 与标题读回，head 仍为 `0003_usages`。
  - 交付物：app 镜像内无 `.env`、`tests/`、`docs/`；`web/dist` 资源哈希与 `make check` 前端构建产物一致。
  - 文档声明：`WEB_PORT=8123` 覆盖生效（8123 上首页与 health 均 200），随后恢复默认 8000。
  - 门禁：`make check` 通过（ruff、pyright 0 error、后端 119 passed、E2E 数据库门禁 PASS、前端 lint/typecheck/11 passed/build）；`make smoke` 通过；`make e2e` 14 passed；`git diff --check` 通过。
  - 范围：diff 仅含 `.dockerignore`、`Dockerfile`、`README.md`、`PROGRESS.md`、`app/main.py`、`docker-compose.yml` 与新增 `tasks/task-006.md`；`app/api`、`app/models`、`app/schemas`、`alembic/`、`tests/` 无改动，Task 1–5 业务语义未被改写。
- 已知限制与观察（非阻塞，不构成 RC）：
  - SPA HTML 响应不带 `X-Request-ID`，访问日志对 SPA 页面记 404；与已验收 WebApp Starter 基线行为一致，属继承限制。
  - `web/index.html` 标题仍为 starter 的 `BenYan · System Status`、`lang="en"`，`SERVICE_NAME` 默认值仍为 `benyan-webapp-starter`；Task 6 只要求 README 项目化，未扩展修改。
  - 宿主机 `make check` 仍要求先创建并迁移 `benyan_test`（`docs/verification.md` 已写明）；只有 E2E 数据库是自建自迁移。
  - 宿主机开发模式与 Compose 的 app 服务不能同时占用 8000 端口（README 已写明）。

## 下一步

- 不开始下一 Task。当前已验收基线为 Task 6（代码提交 `32deec0e5f8fd8776785d046cdb3be1310ce735f`）。
