# Task：项目级流程规范对齐 BenYan Engineering Standard v1.3.1

## 目标

将本仓库的项目级任务协作、交付和独立验收流程规则对齐 BenYan Engineering Standard v1.3.1。流程以 Task Card 定义工作、Task Board 管理状态、Workspace/Git 保存成果、Agent activity 保存过程、Independent Verifier 提供完成证据。规则须工具无关，不绑定具体 Agent 工具底层实现。

## 范围

- 对照外部标准仓库 `benyan-engineering-standard` 的 v1.3.1 `standards/12-ai-collaboration.md`、`standards/11-git-delivery.md`、`standards/14-definition-of-done.md` 和 `checklists/`。
- 更新仓库根目录 `AGENTS.md`、`TASK_BOARD.md`、`README.md` 及必要的当前流程说明（包括 `docs/verification.md`），消除当前规则与 v1.3.1 的实质冲突。
- 将此 Task Card 纳入 `TASK_BOARD.md` 的状态管理。
- 保留 `PROGRESS.md` 作为历史记录，不再要求或执行常规维护；保留 Task 1–28 的卡片与记录原样。
- 完成全仓旧流程规则冲突检查和项目自检。

## 输入

- 本 Task 用户指令及本 Task Card。
- 当前 `AGENTS.md`、`TASK_BOARD.md`、`PROGRESS.md`、README、RUN_LOG、`docs/verification.md` 和既有 `tasks/`。
- 外部标准 v1.3.1 的上述标准与清单。

## 输出

- 更新后的当前流程规范文档。
- 本 Task 对应的 Board 状态，施工结束时为稳定的待独立验收交付。
- 可复查的修改 diff、检查命令结果及剩余风险说明。

## 限制

- 不修改 `PROGRESS.md`；它保留为历史记录，不再作为当前状态源。
- 不重写 Task 1–28 的卡片、历史验收内容或运行记录；不改写历史事实。
- 不宣布 PASS，不执行正式独立验收，不提交、push 或 merge。
- 不绑定特定 Agent 工具、产品、控制面或底层实现；不更改产品定义或业务代码。
- Task 目标、边界和验收标准不得由执行者擅自扩展。

## 验收标准

以下 16 项逐项适用于本 Task 的后续独立验收，均对应本 Task 的目标和用户明确要求；Verifier 流程本身须同时符合 v1.3.1 的 `standards/12-ai-collaboration.md`、`standards/11-git-delivery.md`、`standards/14-definition-of-done.md` 与 `checklists/`。

1. 文档明确 Task Card 定义目标、范围、输入、输出、限制和可执行验收标准。
2. 文档明确 Task Board 管理状态、依赖、推进策略、当前有效角色和最终验收结果。
3. 文档明确 Workspace/Git 保存成果、Agent activity 留执行过程、Verifier 提供可追溯完成证据，且 Agent activity 不绑定具体工具机制。
4. `PROGRESS.md` 被明确为历史记录；当前规则不要求更新它，其他当前文档也不将它当作状态源。
5. Orchestrator、Developer、Independent Verifier 的职责边界明确；Orchestrator 只在批准的 Task 范围内协调，不改写 Task 或实现交付。
6. Task Board 指定的当前有效 Developer 是该 Task 唯一持有 Workspace 写入权者，写入权转移时前任立即失权。
7. failover 前须确认前任停止或已失去写入能力；仅控制面连接错误不能视为执行端停止；无法确认单一写入者时暂停并标记 BLOCKED。
8. 轻度中断交接要求接替者读取 Task Card、Board、Workspace/Git diff 和 Agent activity，并只继续既定范围内剩余工作。
9. 遇到意外 diff 或旧执行者可能恢复时必须暂停写入、排除多写入者并确认 Workspace 稳定；稳定前不得验收或宣称 PASS。
10. RC 由 Orchestrator 交回当前有效 Developer，记录具体问题、证据和限制；修复后必须启动新一轮 Independent Verifier。
11. 严重中断时暂停原执行；只可在既定 Task 内回退或重启，若需改变 Task 定义则交更高层控制角色裁决。
12. Verifier 与 Developer 保持独立判断；Verifier 对交付只读，不修改代码、测试、Task Card、Board 或普通项目文档，也不实施修复。
13. 正式验收前后核对交付稳定，验收期间不得变化；若变化，旧结论失效，稳定后重启独立验收。
14. 验收逐项对照 Task Card，审阅完整 diff 和相关证据，覆盖适用检查及边界、错误、日志、敏感信息和越界改动；未通过或跳过项及影响如实记录。
15. PASS 结论、限制、证据和交付版本关联并由 Verifier 反馈给 Orchestrator，由 Orchestrator 更新 Board；不要求 Verifier 创建最终 commit，push / merge 默认需人工授权。
16. 当前规则、README 与验证说明之间无实质冲突；Task 1–28 卡片、历史验收记录、`RUN_LOG.md` 和 `PROGRESS.md` 均保持不变。

## 验证方式

- `make check`
- `git diff --check`
- 全仓检索当前规则冲突，并审阅完整最终 diff。
- 核对 Task 1–28 卡片及历史记录未被修改，`PROGRESS.md` 未被修改。
