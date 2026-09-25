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
- Task 16: PASS
- Task 17: PASS
- Task 18: PASS
- Task 19: PASS
- Task 20: PASS
- Task 21: PASS
- Task 22: PASS
- Task 23: PASS
- Task 24: PASS
- Task 25: PASS

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
- Task 16 accepted baseline：Independent Verifier PASS 后创建的最终任务 commit `feat: complete task 16 material course associations`
- Task 16 独立验收时：隔离 PostgreSQL 17 测试库迁移至单一 head `0005_material_courses`；`make check` 通过（ruff、pyright 0 errors、后端 161 passed、E2E 数据库门禁、前端 14 passed、build），`make smoke` 通过，`make e2e` 32 passed（含 1280px / 375px 课程关联编辑与详情），`git diff --check` 通过；审查确认关联表复合主键及外键、PUT 省略保留与显式整体替换、非法或不存在 ID 拒绝且无部分更新、停用课程保留、候选课程逐页取全；未发现真实业务数据或 Secret。限制：未在 Docker Compose 环境复测；首次在 55432 端口运行 `make check` 时，既有 Demo 测试固定预期 5432 而失败，改用隔离 IPv6 localhost:5432 后全量通过。
- Task 15 独立验收时：隔离本机 PostgreSQL 16 实例；0003 库插入虚构旧素材后升级至 head，三新增字段为 NULL，downgrade / 再 upgrade 正常，`alembic heads` 单一 head `0004_material_core_fields`；`make check` 通过（ruff、pyright 0 errors、后端 160 passed、E2E 数据库门禁、前端 14 passed、build），`make smoke` 通过，`make e2e` 30 passed（含 1280px / 375px 三字段编辑、清空、列表不展示来源备注），`git diff --check` 通过；审查确认 PUT 省略补充字段保留原值、空白 / null 归一化为 null 清空，四字段编辑与快速录入无回退，详情仅展示有值字段，Demo 数据 / 应用代码无 source_note 内容，日志测试确认来源备注值不入日志；未发现真实业务数据或 Secret。限制：未在 Docker Compose 环境复测；`source_note` 随素材读取 API（含使用记录内嵌的素材）返回，仅前端详情 / 编辑页展示，属内部应用范围内的行为，V1 无字段级权限；smoke 脚本不覆盖 PUT。
- Task 17 accepted baseline：Independent Verifier PASS 后创建的最终任务 commit `feat: complete task 17 course-prioritized prep materials`
- Task 17 独立复验时（全新 Verifier 会话，针对上一轮 RC）：隔离 PostgreSQL（localhost:5432，`benyan_test` / `benyan_e2e`，未触碰 .env 中的远程库）迁移至单一 head `0005_material_courses`；`make check` 通过（ruff、pyright 0 errors、后端 161 passed、E2E 数据库门禁、前端 14 passed、build），`make smoke` 通过，`make e2e` 35 passed（含桌面 / 375px 关联优先、搜索优先、非关联加入撤销，及“较旧关联素材 + 21 条更新非关联素材”回归：默认列表与关键词结果中关联素材均排第一，非关联组保持最新优先且可加入），`git diff --check` 通过；代码审查确认 `listAllMaterials` 经 `fetchAllPages` 逐页取全，再按场次主课程稳定分组（filter + concat），搜索仍为全库，无 schema / migration / API 变更；未发现真实业务数据或 Secret。限制：未在 Docker Compose 环境复测；完整候选集经 offset 逐页读取，沿用既有分页并发一致性限制；候选集很大时前端一次取全的开销未评估；`.env` 的 DATABASE_URL 指向非本机库，验收中通过显式覆盖 DATABASE_URL 避免使用。
- Task 18 accepted baseline：Independent Verifier PASS 后创建的最终任务 commit `feat: complete task 18 material course filter`（父提交 `cadc963`）
- Task 18 独立验收时（全新 Verifier 会话）：隔离临时 PostgreSQL 17 集群（127.0.0.1:55440，`benyan_test` / `benyan_e2e`，新建空库迁移至单一 head `0005_material_courses`；未使用 .env 中的远程库，也未使用 5432 上已有实例）；`make check` 通过（ruff、pyright 0 errors、后端 163 passed、E2E 数据库门禁、前端 14 passed、build），`make smoke` 通过，`make e2e` 37 passed（含 1280px / 375px 超过 100 门课程的逐页候选、停用课程、组合筛选、第一页重置、翻页保留条件与无横向溢出），`git diff --check` 通过。审查确认：`course_id` 为可选 UUID，非法值 422 `VALIDATION_ERROR`、不存在课程 404 `NOT_FOUND`；筛选使用 `Material.courses.any(...)`，与关键词、类型、状态共同作用于 total 与分页；停用课程可筛选；未传时行为不变；前端所有筛选与翻页均携带 course_id，变更回第一页；无 schema / migration / 关联关系写入变更。测试改动审查：`tests/test_demo_data.py` 由固定 `5432` 改为从 `TEST_DATABASE_URL` 取端口（缺省仍 5432），断言仍校验展示的主机、端口、库名，强度未降低，仅使其支持非默认端口的隔离库；E2E 关联课程详情断言由要求固定拼接顺序 `A、B` 改为在“关联课程”卡片内分别包含两门课程名，因为 `Material.courses` 关系无 `order_by`、后端未定义返回顺序，两门课程均须出现的核心断言保留，属合理放宽；`tests/test_materials.py` 仅新增用例，未修改既有断言。限制：未在 Docker Compose 环境复测；在已被前次运行污染的测试库上重复运行 `make check` 会失败（既有问题，非本 Task 引入）：`scripts/demo_data.py` 的 clean 未先清空 `material_courses`，含课程关联的素材会令 `demo-clean` 触发外键错误（Task 16 遗留，建议后续单独处理），另有旧类型筛选测试使用非唯一关键词；`test_demo_shows_target...` 依赖测试库 URL 主机名为 `localhost`；候选课程仍为 offset 逐页读取，课程量很大时的前端加载开销未评估。
- Task 19 accepted baseline：Independent Verifier PASS 后创建的最终任务 commit `fix: complete task 19 demo cleanup material course association`
- Task 20 accepted baseline：Independent Verifier PASS 后创建的最终任务 commit `feat: complete task 20 material audience and industries`
- Task 20 独立验收时（RC 后全新 Verifier 会话）：隔离临时 PostgreSQL 17 集群（localhost:57433，`benyan_test` / `benyan_e2e`，迁移至单一 head `0006_mat_aud_ind`；未使用 .env 远程库，也未使用 5432 与他人占用的 55433 实例，验收后停止并删除）；RC 问题复现与复验：在库中写入虚构素材 + 人群 + 行业 + 两种新关联后，用 HEAD 版 `demo_data.py` 执行 clean，`DELETE FROM materials` 触发外键错误（复现原 RC）；当前版本 clean 成功（关联与素材全为 0），带关联连续两轮 seed 均成功（新增关联清为 0、重建 7 素材），最后 clean 成功；`make check` 在同一 `benyan_test` 上连续两次均通过（ruff、pyright 0 errors、后端 164 passed、E2E 数据库门禁、前端 14 passed、build），`make smoke` 通过，`make e2e` 39 passed（含 1280px / 375px 超过 100 条候选逐页取全），`git diff --check` 通过。审查确认：PUT 省略保留、显式数组整体替换、空数组清空；重复 / 不存在 ID 返回 422 且校验先于任何赋值，不部分更新；详情仅展示已关联项；快速录入无新增必填项；migration 单一 head，仅新增两张关联表及索引，旧素材关系为空数组仍可读；范围内无筛选、标签等越界内容；未发现真实业务数据或 Secret。限制：未在 Docker Compose 环境复测；目标展示测试用例依赖测试库主机名为 `localhost`（既有前提）；候选集仍为 offset 逐页读取，并发写入时分页一致性未保证。
- Task 19 独立验收时（全新 Verifier 会话）：隔离临时 PostgreSQL 17 集群（127.0.0.1:55471，`benyan_test` / `benyan_e2e`，迁移至单一 head `0005_material_courses`；未使用 .env 数据库，已停止并删除）；手工在库中先写入虚构素材 + 课程 + `material_courses` 关联：连续两轮 `demo-data` 均成功（关联表清为 0，重建 7 素材 / 2 课程 / 3 场次），连续两轮 `demo-clean` 均成功（关联、素材、课程、场次全为 0，alembic 版本保留）；输入 `no`、空行、EOF 取消退出码 0 且数据零变化，`APP_ENV=production` 被拒绝且数据零变化；`make check` 通过（ruff、pyright 0 errors、后端 163 passed、E2E 数据库门禁、前端 14 passed、build），同一测试库上连续重复运行 `make check` 亦通过，`make smoke` 通过，`make e2e` 37 passed，`git diff --check` 通过。审查确认：diff 仅为 `scripts/demo_data.py` 增加 `delete(material_courses)`（位于 Material / Course 删除之前，仍在同一事务）、`tests/test_demo_data.py` 每轮 seed / clean 前写入虚构旧行业 / 人群 / 课程 / 素材 / 关联并断言关联表计数；原有 production、目标展示、精确 `yes`、取消零变化测试未改动；无 schema / migration / API / 前端变更，未新增 Demo 关联数据，未发现真实业务数据或 Secret。限制：未在 Docker Compose 环境复测；目标展示测试依赖测试库 URL 主机名为 `localhost`（既有前提）；未对旧版代码做反向复现（依据 Task 18 验收记录与新增回归测试覆盖）。
- Task 21 accepted baseline：Independent Verifier PASS 后创建的最终任务 commit `feat: complete task 21 material tags`
- Task 22 accepted baseline：Independent Verifier PASS 后创建的最终任务 commit `feat: complete task 22 material audience industry tag filters`
- Task 25 accepted baseline：Independent Verifier PASS 后创建的最终任务 commit `feat: complete task 25 material review demo case retirement fields`
- Task 23 accepted baseline：Independent Verifier PASS 后创建的最终任务 commit `feat: complete task 23 material family source relationship`
- Task 23 独立验收时（全新 Verifier 会话）：隔离临时 PostgreSQL 17 集群（127.0.0.1:55451，`benyan_test` / `benyan_e2e`，验收后停止并删除；未使用 .env 远程库与 5432 实例），迁移至单一 head `0008_material_source`；`make check` 通过（ruff、pyright 0 errors、后端 169 passed、E2E 数据库门禁、前端 14 passed、build），`make smoke` 通过，`make e2e` 45 passed（含 1280px / 375px 源素材归根、清除、详情成员），`git diff --check` 通过。完整 diff 审查并用 API 探测确认：自引用 422 `MATERIAL_SOURCE_INVALID`（另有 DB check constraint）；不存在的源素材 422 `MATERIAL_SOURCE_NOT_FOUND`；选择已有子素材作为目标时归一到其家族根；选择当前家族成员（会成环）422；PUT 省略保留关系、显式 null 清除；带成员的根迁入另一家族时直系成员同事务重挂到目标根，全程保持单层、无环；详情返回源素材与同家族成员；旧素材（迁移后 source 为空）为独立家族；不复制其他字段、不合并 usage；`/family-candidates` 位于 `/{id}` 之前。未发现真实业务数据或 Secret。限制：未在 Docker Compose 环境复测；候选接口一次返回全部素材 ID / 标题，规模未评估；重复使用检查按家族归并属后续 Task（本 Task 仅提供关系）；smoke 脚本不覆盖 PUT。
- Task 22 独立验收时（全新 Verifier 会话）：隔离临时 PostgreSQL 17 集群（localhost:57436，`benyan` / `benyan_test` / `benyan_e2e`，验收后停止并删除；未使用 .env 远程库与 5432 实例）；`make check` 通过（ruff、pyright 0 errors、后端 168 passed、E2E 数据库门禁、前端 14 passed、build），`make smoke` 通过，`make e2e` 43 passed（含 1280px / 375px 单项与组合筛选、q 命中标签、候选超 100 条、条件变化回第一页、翻页保留条件、空结果、无横向溢出），`git diff --check` 通过；完整 diff 审查确认：无 schema / migration 变更；q 以 ilike 匹配标题、正文、标签（unnest 子查询）；`tag` 为精确 `contains` 单选；全部条件共同作用于 total 与分页；`GET /materials/tags` 位于 `/{id}` 之前，去重排序；额外 curl 探测：`audience_type_id=xyz` 与空值 → 422，不存在的 industry_id → 404，未命中标签 → total 0，标签筛选第 2 页正确，超 255 字符的 tag → 422。未发现真实业务数据或 Secret。限制：未在 Docker Compose 环境复测；标签候选查询未做规模性能评估；`tag` 参数上限 255 字符，更长的既有标签无法用于筛选（标签本身无长度上限）；`q` 中 `%` / `_` 通配符为既有行为；smoke 脚本不覆盖列表筛选。
- Task 21 独立验收时（全新 Verifier 会话）：隔离临时 PostgreSQL 17 集群（localhost:57434，`benyan_test` / `benyan_e2e`，验收后停止并删除；未使用 .env 远程库与 5432 实例）；迁移兼容：在 0006 库插入虚构旧素材后升级至 head，`tags` 为 `{}`，downgrade / 再 upgrade 正常，`alembic heads` 单一 head `0007_material_tags`；`make check` 通过（ruff、pyright 0 errors、后端 166 passed、E2E 数据库门禁、前端 14 passed、build），`make smoke` 通过，`make e2e` 41 passed（含 1280px / 375px 标签增删、规范化、读回、详情展示、无横向溢出），`git diff --check` 通过。审查确认：schema 校验器逐项 trim、忽略空项、区分大小写精确去重并保留首次顺序；PUT 省略 `tags` 保留、显式数组整体替换、空数组清空（null 亦清空，与冻结判断一致）；migration 仅新增非空 `text[]` 默认空数组；未改快速录入、列表搜索 / 筛选及课程 / 人群 / 行业关系；无标签词典、推荐等越界内容；未发现真实业务数据或 Secret。限制：未在 Docker Compose 环境复测；未设置标签数量或长度上限；标签搜索 / 筛选留给 Task 22 及后续；smoke 脚本不覆盖 PUT。
- Migration head: 0009_material_fields（单一 head；Task 25 增加复核、Demo 验证、案例类别与退役原因）
- Task 10 独立验收时：临时本机 PostgreSQL 16 实例（测试库已迁移至 head）；`make check` 通过（ruff、pyright 0 errors、后端 137 passed、E2E 数据库门禁、前端 14 passed、build）、`make smoke` 通过、`make e2e` 20 passed（含 1280px / 375px 状态筛选流程）、`git diff --check` 通过；代码审查确认后端 `status` 为 Literal 五值且与 `MATERIAL_STATUSES` 一致，非法值（含空串、逗号多值）返回 422，状态与关键词共同作用于 total 与分页；前端切换状态与搜索回第一页、分页保留状态；无 schema / migration 变更。限制：未在 Docker Compose 环境复测；前端 URL 中非法 status 表现为列表加载失败提示，属可接受行为
- Task 3 独立验收时：CI PASS、后端 115 passed、前端 3 passed、E2E 9 passed
- Task 4 已通过独立复验
- Task 5 已通过独立验收
- Task 6 独立验收时：空 volume `docker compose up -d --build` 后 db/app 均 healthy、自动迁移至 `0003_usages`、`down` / `up -d` 后数据读回一致；后端 119 passed、前端 11 passed、E2E 14 passed、`make smoke` 通过
- Task 9 独立验收时：`make check` 通过（后端 123 passed、前端 14 passed）、`make smoke` 通过、`git diff --check` 通过；非回环数据库不再被拒绝，`demo-data` 与 `demo-clean` 均在执行前展示目标并要求确认，取消后数据零变化；未发现 schema / migration / API 契约变更
- Task 8 独立验收时：`make check` 通过（后端 121 passed、前端 14 passed）、`make smoke` 通过、E2E 18 passed（含 375px 布局与长页面保存按钮可达性）、`git diff --check` 通过；未发现 schema / migration / API 契约变更

## 已冻结判断

- Task 25：案例类别仅适用于“案例”，Demo 最后验证可用日期仅适用于“Demo”，退役原因仅适用于“退役”；离开对应类型 / 状态时字段清空为 NULL 且不自动恢复。复核日期不触发自动状态变化。
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
- Task 17 施工判断：场次计划素材页以场次主课程匹配 `Material.courses`，关联素材优先；各组内部保留素材 API 原有 `created_at desc, id desc` 次序。搜索仍调用全库查询，课程关联只排序、不限制候选或计划资格；不新增推荐分数、筛选或 schema。
- Task 18 施工判断：素材列表通过可选 `course_id` 筛选关联素材，停用课程同样有效；非法 UUID 返回 422、不存在课程返回 404。课程关系条件与关键词、类型、状态共同约束 total 和分页；课程候选经 `listAllCourses` 逐页取全，筛选变化回第一页、翻页保留全部条件；不新增 schema / migration。
- Task 20 冻结判断：适用人群和适用行业均复用现有基础词表，素材关系可选、多选；PUT 字段省略保留关系，显式数组整体替换、空数组清空；重复 ID、非法 UUID、不存在词表项返回 422，验证失败不修改素材或关系；候选沿用既有 page_size 上限并逐页取全；详情只展示已关联值；快速录入不增加必填项，不增加筛选、标签或基础词表语义。
- Task 21 冻结判断：标签保存在素材 `text[]` 字段，不建立词表；编辑 PUT 省略 `tags` 时保留，显式数组（含 null）整体替换；逐项 trim、忽略空标签、按区分大小写的精确文本保留首次出现值去重；不做标签搜索或筛选，快速录入不新增标签必填项，不影响课程 / 人群 / 行业关系。

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
- Task 15：素材支撑判断、讲法要点、来源备注三个可空补充字段，编辑与详情支持维护和展示
- Task 16：素材与课程多对多关系；编辑可选择多门课程，详情展示关联课程，停用课程保留
- Task 17：场次计划素材候选按场次主课程关联优先显示；全库搜索、非关联素材加入与撤销计划仍可用
- Task 18：素材列表增加课程单选筛选；与关键词、类型和状态组合，total / 分页使用同一条件；启用及停用课程候选逐页取全；筛选变化回第一页且翻页保留条件
- Task 20：素材与人群类型、行业多对多关系；编辑页完整候选多选；详情展示已关联项；PUT 支持省略保留、整体替换和空数组清空；旧素材经 migration 升级后继续可读
- Task 21：素材自由标签；编辑页可增加 / 删除多个标签，保存时 trim、忽略空值并精确去重；详情展示标签；快速录入默认空标签
- Task 22：素材列表支持人群、行业、标签单选筛选；关键词搜索标题、正文或标签；所有条件共同作用于结果数与分页
- Task 23：素材可指定源素材并动态归入单层家族；源素材只能指向家族根，根迁移时直系成员同步重挂，详情展示源素材及家族成员
- Task 25：素材可维护复核日期、Demo 最后验证可用日期、案例类别与退役原因；字段仅在适用类型 / 状态有效，切换离开时清空

## 当前尚未具备

- 复核到期与连续两次效果差提示（Task 26）
- 课后登记完成状态字段（V1 不建设）
- 后端分页聚合 / 游标接口、可搜索的大候选集下拉（本 Task 明确不做）

## 当前任务

- 无进行中 Task；下一个为 Task 26。

## 上一已验收任务摘要

- Task 23：素材家族与源素材关系 —— PASS（Independent Verifier 独立验收）。证据见 Task 23 独立验收记录。
- Task 22：素材列表人群、行业与标签筛选 —— PASS（Independent Verifier 独立验收）。证据见 Task 22 独立验收记录。
- Task 21：素材标签 —— PASS（Independent Verifier 独立验收）。证据见 Task 21 独立验收记录。
- Task 20：素材适用人群与行业 —— PASS（Independent Verifier 独立验收，RC 修复复验通过）。素材与人群类型、行业多对多；编辑页完整候选多选，详情仅展示已关联项；Demo 清理先于实体删除关联表。证据见 Task 20 独立验收记录。

## 下一步

- Task 26：复核到期与连续两次差评提示。

## Task 22 施工与验证

- 实际完成：素材列表新增单选人群、行业、标签筛选；人群和行业候选分别逐页取全，标签候选从素材已有标签中去重并排序；关键词扩展至标题、正文或标签不区分大小写匹配；筛选条件写入 URL，条件变化回到第一页，翻页保留全部条件；零结果显示明确空态。新增筛选 ID 的格式错误返回 422，不存在的人群 / 行业 ID 返回 404。
- Migration / schema：无 schema 或 migration 变更。新增 `GET /api/v1/materials/tags` 返回当前素材的去重标签候选；现有关联和状态逻辑未变。
- 验证：`make check` 通过（ruff、pyright 0 errors、后端 168 passed、E2E 数据库安全门禁、前端 14 passed、production build）；`make smoke` 通过（health 200 / X-Request-ID、404 错误响应）；`make e2e` 通过（43 passed，包含 1280px / 375px 单项与组合筛选、标签关键词、候选超过 100 条、第一页重置、翻页条件保留及空结果）；`git diff --check` 通过。
- 冻结判断：无新增产品判断；筛选为单选，标签筛选按精确标签值匹配，关键词匹配标签时不区分大小写。
- 已知限制 / 待验收：未在 Docker Compose 环境复测；标签候选查询未做大规模性能评估。Developer 自验不构成独立验收。

## Task 21 施工与验证

- 实际完成：新增 `0007_material_tags` migration，在 `materials` 增加非空 PostgreSQL `text[]`，默认空数组；Material API 返回标签并允许编辑更新；标签在入库前 trim、忽略空项、区分大小写去重；编辑页支持添加 / 删除，详情页展示；未改快速录入字段、列表搜索筛选或既有关联关系。
- Migration / schema：单一 Alembic head `0007_material_tags`。迁移应用于本机专用 `benyan_test` 与 `benyan_e2e`；`benyan_test` 查询确认 head 为 `0007_material_tags`，当前 99 条素材均读到空标签数组。数据库非空默认值为迁移前已有素材回填空数组。
- 验证：`make check` 通过（ruff、pyright 0 errors、后端 166 passed、E2E DB 安全门禁、前端 14 passed、前端 production build）；`make smoke` 通过（health 200 / X-Request-ID、404 错误响应）；`make e2e` 通过（41 passed，包含 1280px / 375px 标签增删、规范化、读回、详情展示及无横向溢出）；`git diff --check` 通过。
- 已知限制 / 待验收：未在 Docker Compose 环境复测；未设置标签数量或长度上限；标签检索和筛选留给后续 Task。Developer 自验不构成独立验收。

## Task 23 施工与验证

- 实际完成：素材新增可选源素材关系；未指定时为独立家族；选择子素材时 API 自动归一到其根；拒绝直接自引用、缺失目标，以及会形成环的当前家族成员；切换源素材与清除关系均可用。根素材迁入另一家族时，同事务将其直系成员重挂到目标根，保证始终单层。详情展示源素材和同家族成员；编辑页支持选择 / 清除，未复制其他素材字段或合并历史 usage。
- Migration / schema：新增 `0008_material_source`，`materials.source_material_id` nullable 自引用外键及非自引用 check constraint；`alembic heads` 显示单一 head `0008_material_source`。独立 migration 测试库先迁至 `0007_material_tags` 并写入虚构旧素材，再升级至 head；详情 API 读取成功，源素材为空且仍是独立家族。
- 验证：`make check` 通过（ruff、pyright 0 errors、后端 169 passed、E2E 数据库安全门禁、前端 14 passed、production build）；最终代码版本 `make smoke` 通过（health 200 / X-Request-ID、404 错误响应）；最终代码版本在新建隔离库 `task23_verify_e2e` 上 `make e2e` 45 passed（含源素材归根、清除、详情成员与 1280px / 375px）；`git diff --check` 通过。
- 冻结判断：PUT 省略 `source_material_id` 保留关系，显式 null 清除；选中已有子素材归一到其家族根；不支持多层树或内容 / usage 合并；重挂已有直系成员属于关系归并，不改变其素材内容及使用记录。
- 已知限制 / 待验收：未在 Docker Compose 环境复测；编辑页候选及候选 API 一次读取完整素材 ID / 标题集合，超大素材库的响应规模未评估。Developer 自验不构成独立验收。

## Task 24 施工状态

- 当前状态：待独立验收。已实现备课专用候选 API 与家族级重复使用提示。
- 实际完成：仅以状态为“已用”的其他场次记录作为历史；先查当前客户，命中时给强提醒；当前客户未命中时，仅在客户有集团名的情况下查同集团其他客户并给弱提醒。按素材家族根归并，按场次日期取最近一次，并展示日期、课程、人群类型和客户。计划 / 未用记录不触发提示；无集团只查当前客户；不影响加入计划。既有全库搜索、课程关联优先排序、加入及撤销流程保留。
- Migration / schema：无 migration 或数据库 schema 变更；Alembic head 仍为 `0008_material_source`。
- 验证：最终代码版本 `make check` 通过（ruff、pyright 0 errors、后端 172 passed、E2E 数据库安全门禁、前端 lint / typecheck、Vitest 14 passed、production build）；`make smoke` 通过（health 200 / X-Request-ID、404 错误响应）；`E2E_POSTGRES_DB=task24_verify_e2e make e2e` 通过（47 passed，含 1280px / 375px 集团提醒、最近使用信息展示及提醒下加入计划）；`git diff --check` 通过。后端测试覆盖同客户优先、家族成员命中、最近实际使用、计划 / 未用过滤、无集团和无历史。
- 冻结判断：集团按 `group_name` 精确相等匹配；当前备课场次自身不参与历史提醒；同客户提醒覆盖集团提醒，不叠加；每种级别只展示日期最近的一次匹配记录。
- 已知风险 / 限制：未在 Docker Compose 环境复测；候选 API 返回当前搜索结果全集，家庭历史查询与全量候选在超大数据规模下的性能未评估。Developer 自验不构成独立验收。
- 下一步：由 Independent Verifier 独立审查本轮交付并按规则写入验收状态；保留 Orchestrator 管理的 `TASK_BOARD.md` 与 `RUN_LOG.md` 未提交改动。

## Task 24 独立验收

- 结论：PASS（全新 Independent Verifier，Claude Sonnet 5）。
- 证据：审查完整 diff：仅统计状态“已用”记录，计划 / 未用排除；按家族根（source_material_id 或自身）归并；同客户优先并覆盖同集团；每级取最近场次日期；返回日期、课程、人群、客户；无集团只查同客户；当前场次自身排除；搜索条件与排序与原素材列表一致；提醒不阻止加入。独立运行：`make check` 通过（后端 172 passed、前端 14 passed、build 通过）；`make smoke` 通过；隔离库 `task24_indep_verify_e2e` 上 `make e2e` 47 passed（含 1280px / 375px）；`git diff --check` 通过。无 migration 变更。
- 限制：未在 Docker Compose 复测；后端测试未直接覆盖“同客户与同集团同时存在”之外的 375px 后端行为，且 e2e 仅覆盖集团弱提醒的 UI，强提醒 UI 由 API 测试覆盖；超大数据规模性能未评估。
- accepted baseline：Verifier 创建的最终任务 commit `feat: complete task 24 session material repeat usage warnings`（以该 commit 为准，不使用 HEAD）。

## Task 25 施工状态

- 当前状态：PASS（见下方独立验收）。新增可选复核日期、Demo 最后验证可用日期、案例类别（A 真实案例 / B 情境案例）与退役原因；编辑和详情支持维护 / 展示，无值不显示提示；快速录入保持原有必填项。
- 类型 / 状态规则：案例类别只在类型为“案例”时保留；Demo 验证日期只在类型为“Demo”时保留；退役原因只在状态为“退役”时保留。编辑切换离开适用类型 / 状态以及 API 收到不匹配组合时均清空对应字段；日期和复核日期可独立清空。数据库 CHECK constraint 同时限制类别取值及三个适用范围。
- Migration / schema：新增 `0009_material_fields`，前置 `0008_material_source`，四列均可空；单一 Alembic head。隔离库在 0008 插入虚构旧素材后升级至 head，旧记录保留且四字段均为 NULL。
- 验证：最终 `make check` 通过（ruff、pyright 0 errors、后端 174 passed、E2E DB 门禁、前端 lint / typecheck、Vitest 14 passed、production build）；`make smoke` 通过（health 200 / X-Request-ID、404 错误响应）；全新隔离库 `task25_release_e2e` 上 `make e2e` 49 passed，包含 1280px / 375px 字段编辑、详情展示、四字段清空与 Demo→故事切换清空；数据库约束测试覆盖无效类别、非案例设置案例类别、非 Demo 设置验证日期、非退役设置退役原因；`git diff --check` 通过。
- 冻结判断：字段值在类型 / 状态切换离开适用范围时清空并持久化为 NULL，不自动恢复；不自动设定复核日期或改变素材状态。字段不适用时服务端清空，字段可设类型按 Literal 校验。
- Migration / smoke / E2E 均未覆盖 Docker Compose 环境。Developer 自验不构成独立验收；无本轮 accepted baseline 更新。
- 下一步：Independent Verifier 独立检查本轮交付并按规则写入验收状态；不得改动 Orchestrator 管理的 `TASK_BOARD.md` 与 `RUN_LOG.md`。

## Task 25 独立验收

- 结论：PASS（全新 Independent Verifier，Claude Sonnet 5）。
- 证据：隔离临时 PostgreSQL 17 集群（localhost:57525，验收后停止并删除；未使用 .env 远程库）。迁移：0008 库插入虚构旧素材后升级至 head，四字段均为 NULL，downgrade / 再 upgrade 正常，`alembic heads` 单一 head `0009_material_fields`；直接 SQL 确认非案例类型设置案例类别被 CHECK 拒绝。`make check` 通过（ruff、pyright 0 errors、后端 174 passed、E2E 数据库门禁、前端 14 passed、build），`make smoke` 通过，`E2E_POSTGRES_DB=task25_indep_e2e make e2e` 49 passed（含 1280px / 375px 四字段编辑、详情展示、清空、Demo→故事切换清空），`git diff --check` 通过。完整 diff 审查确认：PUT 省略字段保留原值、显式 null / 空白清空；类型非“案例”/“Demo”、状态非“退役”时服务端确定性清空对应字段（含草稿 type 为空）；案例类别为 Literal 两值，非法值 422；详情仅在有值且适用时展示；快速录入未改动；无自动复核日期、状态变化或到期提示等越界内容；未发现真实业务数据或 Secret。
- 限制：未在 Docker Compose 复测；数据库 CHECK 对 type 为 NULL（草稿）的行不拦截案例类别 / Demo 日期（NULL 语义），该场景由应用层清空保证；smoke 不覆盖 PUT。
- accepted baseline：Verifier 创建的最终任务 commit `feat: complete task 25 material review demo case retirement fields`（以该 commit 为准，不使用 HEAD）。
