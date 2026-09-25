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
- Task 10: PASS
- Paseo Experiment 001: PASS（独立 Verifier 已验收；已由用户提交为 `794bcda`，未 push）
- 工程规范迁移 v1.1.0 → v1.2.0：PASS（非产品 Task）
- Task 11: PASS
- Task 12: PASS
- Task 13: PASS
- Task 14: PASS
- Task 15: PASS

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
- Task 10 accepted baseline：Independent Verifier PASS 后创建的最终任务 commit `feat: complete task 10 material status filter`（父提交 `58bef05`）
- Task 11 accepted baseline：Independent Verifier PASS 后创建的最终任务 commit `feat: complete task 11 duplicate title warning`（父提交 `e2e4667`）
- Task 12 accepted baseline：Independent Verifier PASS 后创建的最终任务 commit `feat: complete task 12 material editing`
- Task 12 独立验收时：临时本机 PostgreSQL 16 测试实例；`make check` 通过（ruff、pyright 0 errors、后端 154 passed、E2E 数据库门禁、前端 14 passed、build），`make e2e` 26 passed（含 1280px / 375px 素材编辑），`make smoke` 通过，`git diff --check` 通过；核对 PUT 契约、错误响应、失败后数据不变、草稿与非草稿规则、同标题和 404；无 schema / migration 变更，未发现真实业务数据或 Secret。限制：未在 Docker Compose 环境复测；smoke 脚本不覆盖 PUT（由后端测试及 E2E 覆盖）；V1 无并发编辑控制。
- Task 11 独立验收时：隔离本机 PostgreSQL 16 测试实例迁移至 `0003_usages`；`make check` 通过（ruff、pyright 0 errors、后端 138 passed、E2E 数据库门禁、前端 14 passed、build），`make smoke` 通过，`make e2e` 22 passed（含 1280px / 375px 同标题提示与保存），`git diff --check` 通过；审查确认前端查询前 trim 与既有保存时 strip 一致，后端 `title` 为区分大小写的精确相等查询，允许同标题并存；无 schema / migration 变更，未发现真实业务数据或 Secret。限制：未在 Docker Compose 环境复测；重复查询失败时静默不显示提示，保存仍可继续。
- Task 13 accepted baseline：Independent Verifier PASS 后创建的最终任务 commit `feat: complete task 13 material type filter and body search`
- Task 13 独立验收时：隔离本机 PostgreSQL 16 测试实例迁移至 head；`make check` 通过（ruff、pyright 0 errors、后端 156 passed、E2E 数据库门禁、前端 14 passed、build），`make smoke` 通过，`make e2e` 28 passed（含 1280px / 375px 类型 / 状态 / 正文关键词组合与超一页翻页保留条件），`git diff --check` 通过；审查确认 `type` 为 Literal 六值（空值、多值、未知值 422），`q` 为标题或正文 `ilike`，条件共同作用于 total 与分页，前端筛选变更回第一页且翻页保留全部条件；无 schema / migration 变更，未发现真实业务数据或 Secret。限制：未在 Docker Compose 环境复测；`q` 中 `%` / `_` 作为 LIKE 通配符的既有行为未处理（沿用原标题搜索）；smoke 脚本不覆盖列表筛选（由后端测试与 E2E 覆盖）。
- Task 14 accepted baseline：Independent Verifier PASS 后创建的最终任务 commit `feat: complete task 14 markdown bulk import`
- Task 14 独立验收时：隔离本机 PostgreSQL 16 测试实例迁移至 head；`make check` 通过（ruff、pyright 0 errors、后端 159 passed、E2E 数据库门禁、前端 14 passed、build），`make smoke` 通过，`make e2e` 30 passed（含 1280px / 375px 导入与错误流程），`git diff --check` 通过；审查确认后端 `POST /api/v1/materials/import` 独立复验格式（空输入、缺标题、缺正文、前置文字、非 `## ` 标题均 422 `MARKDOWN_IMPORT_INVALID` 且零写入），`add_all` + 单次 commit，失败 rollback；触发器注入失败测试确认整批回滚；导入结果 `type=null`、草稿、允许同标题；前端解析规则与后端一致，错误时禁用导入；额外探测 CRLF 正常导入；无 schema / migration 变更，未发现真实业务数据或 Secret。限制：未在 Docker Compose 环境复测；标题超过 255 字符或正文含 NUL 字符时不做预校验，返回 500 `MATERIAL_IMPORT_FAILED`（整批回滚、零写入，提示较笼统）；围栏代码块内的 `## ` 会被当作标题、正文中以 `#` 开头的行（如 `#标签`）按格式错误拒绝，属固定严格格式的既有取舍；smoke 脚本不覆盖导入（由后端测试与 E2E 覆盖）。
- Task 15 accepted baseline：Independent Verifier PASS 后创建的最终任务 commit `feat: complete task 15 material core fields`
- Task 15 独立验收时：隔离本机 PostgreSQL 16 实例；0003 库插入虚构旧素材后升级至 head，三新增字段为 NULL，downgrade / 再 upgrade 正常，`alembic heads` 单一 head `0004_material_core_fields`；`make check` 通过（ruff、pyright 0 errors、后端 160 passed、E2E 数据库门禁、前端 14 passed、build），`make smoke` 通过，`make e2e` 30 passed（含 1280px / 375px 三字段编辑、清空、列表不展示来源备注），`git diff --check` 通过；审查确认 PUT 省略补充字段保留原值、空白 / null 归一化为 null 清空，四字段编辑与快速录入无回退，详情仅展示有值字段，Demo 数据 / 应用代码无 source_note 内容，日志测试确认来源备注值不入日志；未发现真实业务数据或 Secret。限制：未在 Docker Compose 环境复测；`source_note` 随素材读取 API（含使用记录内嵌的素材）返回，仅前端详情 / 编辑页展示，属内部应用范围内的行为，V1 无字段级权限；smoke 脚本不覆盖 PUT。
- Migration head: 0004_material_core_fields（单一 head）
- Task 10 独立验收时：临时本机 PostgreSQL 16 实例（测试库已迁移至 head）；`make check` 通过（ruff、pyright 0 errors、后端 137 passed、E2E 数据库门禁、前端 14 passed、build）、`make smoke` 通过、`make e2e` 20 passed（含 1280px / 375px 状态筛选流程）、`git diff --check` 通过；代码审查确认后端 `status` 为 Literal 五值且与 `MATERIAL_STATUSES` 一致，非法值（含空串、逗号多值）返回 422，状态与关键词共同作用于 total 与分页；前端切换状态与搜索回第一页、分页保留状态；无 schema / migration 变更。限制：未在 Docker Compose 环境复测；前端 URL 中非法 status 表现为列表加载失败提示，属可接受行为
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
- Task 11 冻结：快速录入的同标题提示复用既有 `GET /api/v1/materials?title=` 精确相等查询（区分大小写、不做模糊或额外标准化）；前端以去除首尾空白后的标题查询，与后端保存时既有的 strip 行为一致，不属于新增标准化规则；提示不阻止保存，允许同标题素材并存的规则不变；查询失败时不显示提示且不影响保存。
- Task 10 施工判断：素材列表的 `status` 为可选单值查询参数，值仅限现有五种素材状态；省略时查询全部，非法值按既有校验错误返回 422；关键词和状态条件共同作用于后端总数与分页。状态筛选不改变现有标题搜索范围。
- Task 13 施工判断：素材列表 `type` 为可选单值筛选，值限定为现有六种素材类型；关键词以不区分大小写的子串匹配标题或正文，空正文不影响查询；关键词、类型、状态共同约束 total 和分页。任意筛选或关键词变化回到第一页，翻页保留全部条件。非法类型（含空值、多值）返回既有 422 `VALIDATION_ERROR`。不加入标签搜索、其他维度筛选或相关度排序。

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
- Task 10：素材列表可按单个状态筛选、切回全部状态，并与现有标题关键词搜索组合；状态及关键词提交后从第一页查询；状态保留在分页 URL 中；素材 Badge 沿用已有映射
- Task 12：素材详情“编辑素材”入口；编辑页预填标题 / 类型 / 正文 / 状态，`PUT /api/v1/materials/{id}` 保存后返回详情并显示最新内容
- Task 11：快速录入按后端精确标题查询显示同标题提示，提示下仍可保存新素材；提示在标题改为不同值后消失
- Task 13：素材列表新增单选类型筛选，关键词扩展为标题或正文匹配；类型、状态与关键词条件保留在 URL 并组合分页
- Task 14：Markdown 批量导入页面及入口；严格格式校验、错误零写入、整批事务提交 / 失败回滚；成功结果显示导入数量与返回入口

## 当前尚未具备

- 素材扩展字段（标签、适用人群 / 行业、支撑判断、讲法要点、来源备注等）的编辑，状态以外的筛选、素材家族
- 同客户 / 同集团重复提醒、连续差评及系统复核提示
- 素材与课程多对多关系
- 课后登记完成状态字段（V1 不建设）
- 后端分页聚合 / 游标接口、可搜索的大候选集下拉（本 Task 明确不做）

## 当前任务

- Task 15：素材核心补充字段 —— PASS（Independent Verifier 独立验收）。
  - 施工前基线：Task 14 accepted baseline `cfb8ec2`；原 Migration head `0003_usages`。
  - 实现：新增可空文本字段 `supporting_judgment`、`speaking_notes`、`source_note`，Alembic migration `0004_material_core_fields` 为唯一 head；素材更新与读取 API 支持新字段，编辑页可修改 / 清空，详情页仅在字段有值时展示。快速录入仍只提交标题、类型、正文。
  - 更新兼容：新增字段未出现在 PUT 请求时保留原值；明确传空白或 `null` 可清空。空白字段值归一化为 `null`。
  - 内部信息边界：`source_note` 仅显示于编辑和详情页面，素材列表卡片不展示；Demo 数据与公开 fixture 不含来源备注内容；日志测试确认虚构来源备注值不进入应用日志。
  - 验证覆盖：字段默认空值、分别更新 / 保留 / 清空、快速录入未变、详情只展示有值字段、素材列表 UI 不展示来源备注；1280px / 375px 编辑详情流程；基础素材编辑校验继续覆盖。
  - Migration 兼容：隔离临时 PostgreSQL 17 库从 `0003_usages` 升级至 head；旧版插入的虚构素材保留可读，详情 API 返回 200，三个新增字段为 `null`；`alembic heads` 显示单一 head。
  - Developer 自验：`make check` 通过（ruff、pyright 0 errors、后端 160 passed、E2E DB 安全门禁、前端 14 passed、build）；`make smoke` 通过（health / not-found）；`make e2e` 30 passed（包含本 Task 在 1280px / 375px 的字段编辑与清空）；`git diff --check` 通过。
  - 数据边界：验证数据为虚构内容，仅用于临时 PostgreSQL 17 测试库；未发现真实业务数据或 Secret。原有用户修改 `TASK_BOARD.md` 未由本轮触碰。
  - 冻结判断：三个补充字段均可空；快速录入不增加必填项；更新请求省略某个补充字段时保留该字段，显式空白 / null 用于清空；`source_note` 只出现在编辑与详情页面。
  - 未实现范围：标签、适用人群 / 行业、案例类别、复核日期、Demo 最后验证日期、退役原因、素材家族、课程关系及字段搜索 / AI 生成均不属于本 Task。
  - 风险 / 限制：未在 Docker Compose 环境复测；AI self-check 不等于独立验收。
  - 独立验收：PASS，见上方 accepted baseline 与验收记录。

## 上一已验收任务摘要

- Task 13：素材类型筛选与正文关键词搜索 —— PASS（Independent Verifier 独立验收）。
  - 后端：`GET /api/v1/materials` 增加单值 `type` 查询参数，限定现有六种类型；`q` 在标题或正文执行不区分大小写子串匹配。类型、状态、关键词同时用于 total 与分页；`body IS NULL` 可正常查询；非法类型沿用 422 `VALIDATION_ERROR`。
  - 前端：素材列表增加“全部类型”及六种类型单选；关键词输入提示改为“搜索标题或正文”；URL 驱动的类型、状态、关键词条件在筛选变更时回第一页，翻页保留全部条件。复用现有设计系统表单样式，无 CSS / 依赖变更。
  - Schema / migration：无变更；Migration head 仍为 `0003_usages`。
  - 测试新增：后端验证六种类型、标题命中、正文命中、空正文、组合筛选 total / 分页、非法类型；E2E 在 1280px / 375px 验证类型和状态组合、条件变更回第一页、超过 20 条组合结果翻页保留 URL 条件与无横向溢出。
  - Developer 自验：临时本机 PostgreSQL 17（`/private/tmp/cml-task13-pg.*`，数据库 `benyan_test` / `benyan_e2e`）迁移至 head；`make check` 通过（ruff、pyright 0 errors、后端 156 passed、E2E DB 门禁、前端 14 passed、build）；`make smoke` 通过（health / not-found）；`make e2e` 28 passed（含 1280px / 375px 新筛选和组合分页）；`git diff --check` 通过。
  - 数据边界：测试仅使用虚构数据与随机标记；未发现真实业务数据或 Secret；无 schema / migration 变更。
  - 风险 / 限制：未在 Docker Compose 环境复测；`%` / `_` 通配符沿用既有行为。

## 下一步

- 按 Orchestrator 规划开始下一 Task；push / merge 须人工授权。
