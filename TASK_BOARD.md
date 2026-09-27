# Task Board

本文件是当前 Task 状态、依赖、推进策略、当前有效角色和最终验收结果的权威记录。Task Card 定义工作，Workspace/Git 保存成果，Agent activity 保存执行过程，Independent Verifier 提供完成证据。

## 状态约定

- `READY`：已定义且可开始；Board 指定唯一当前有效 Developer 后才可写 Workspace。
- `IN PROGRESS`：当前唯一有效 Developer 正在施工。
- `READY FOR VERIFICATION`：Developer 自检完成、交付稳定，正等待 Orchestrator 启动 Independent Verifier。
- `VERIFYING`：Developer 自检完成、交付已稳定；Orchestrator 已启动 Independent Verifier。验收期间交付只读。
- `RC`：Verifier 记录了问题、证据和限制；Orchestrator 将当前有效角色交回当前有效 Developer 修复。修复后由新 Verifier 会话复验。
- `BLOCKED`：无法在现有 Task 定义或依赖下继续；须记下原因、事实和所需裁决。
- `DONE`：Independent Verifier 的结论、证据、限制及交付版本已由 Orchestrator 记录。

## 调度规则

- 同一 Task / Workspace 同一时间只有一个当前有效 Developer 和一个写入权持有者。
- Orchestrator 负责调度、角色指定、Board 状态和最终验收结果；不得改写 Task 定义或实现交付。
- failover 前必须确认前任 Developer 已停止、归档、取消，或已失去 Workspace 写入能力；仅有连接错误不足以证明停止。无法确保唯一写入者时设为 `BLOCKED`。
- RC 返回当前有效 Developer；修复并稳定后启动新的 Independent Verifier。RC 时不启动后续 Task。
- 启动验收前、后确认交付稳定；验收期间交付内容不得变化。若变化，旧结论失效并重新验收。
- PASS 由 Independent Verifier 提供证据结论，Orchestrator 将该结论和证据写入本 Board；不要求特定角色创建最终 commit。
- `PROGRESS.md` 仅作为历史记录，不参与当前调度，不要求维护。
- push、merge 默认须人工授权。

## 当前 Task

### DONE（PASS）

- Task：项目级流程规范对齐 BenYan Engineering Standard v1.3.1
- Task Card：[`tasks/engineering-standard-v1.3.1.md`](tasks/engineering-standard-v1.3.1.md)
- 本轮 Developer / 执行者：Paseo agent `98b36cf3-7973-41f5-a10c-d9112d8bb195`（本 Task v1.3.1 RC 修复轮；本轮唯一 Developer）
- 写入状态：Developer 已停止写入；正式复验前后交付内容稳定。
- 正式 Independent Verifier：全新 Paseo agent `7b58f23f-1def-4290-b698-c7ad93d8d8b0`，独立只读复验，结论 PASS。
- 依赖：外部 BenYan Engineering Standard v1.3.1；Task Card 中列明的仓库文档与检查。
- 推进策略：本轮规范对齐已正式 PASS；按用户要求停止，不领取新的产品 Task。
- RC 记录：Verifier 按用户标准 #16 判定 RC，理由为 `make check` 未全量通过：本机 PostgreSQL 不可用且前端阶段未执行；Verifier conditional PASS 不满足用户标准。另要求明确 Board 当前 Developer 身份及停止写入状态，并记录交付版本和检查限制。
- RC 起始证据：默认 `localhost:5432` 无 PostgreSQL 响应，`make check` 的 pytest 175 项中 122 项失败且前端阶段未执行；首次临时本机 PostgreSQL 初始化受沙箱 `shmget` 权限限制。未触碰 `.env` 目标库或其他现有数据库。
- RC 修复与复验准备证据：经本机 Docker 授权只读确认后，使用已有 `postgres:16` 镜像启动仅绑定 `127.0.0.1:55439` 的一次性容器，无持久卷，建立全新 `benyan_test` 并迁移至 head。`TEST_DATABASE_URL` 使用 `localhost` 以符合仓库测试断言；`DATABASE_URL` 显式指向同一临时库的回环地址。`make check` 退出码 0：Ruff 通过、Pyright 0 errors、后端 175 passed、E2E DB guard PASS、前端 lint / typecheck 通过、Vitest 14 passed、production build 成功。唯一输出为上游 Starlette 对 AnyIO `BlockingPortal` 类型别名的弃用警告。另单独运行 `cd web && npm run check`，lint / typecheck、4 个测试文件 14 项测试和 build 均通过。日志 `/tmp/course-material-make-check.e9LeZW`，SHA-256 `ed248b0b428ed71bf245229c87cce92c53d96bd0a2a1349005a570156e16c463`。两个临时容器均已自动删除，55439 端口已释放。
- make check 限制：环境默认 `localhost:5432` 未运行 PostgreSQL，因此测试通过显式配置的隔离 PostgreSQL 16 容器完成；未使用或读取 `.env`。保留一条上游 Starlette / AnyIO 弃用警告，未影响检查结果。
- 交付版本：基线 Git commit `de40a1749cc8d231ae1343eed3a1118715cc2f59` 加当前 Workspace diff；交付内容文件 `AGENTS.md`、`README.md`、`docs/verification.md`、`tasks/engineering-standard-v1.3.1.md` 的 SHA-256 指纹（按文件名和内容顺序汇总）为 `eb4a9ad6d6b861ed77dedad0804124ef8142859625eb16cd49c4c603c97ed1e4`。本 Board 保存本轮状态与证据；正式验收前后须再次核对整个 Workspace 稳定性。
- 独立复验证据：Verifier 核对完整 diff、Task Card 16 项标准及 v1.3.1 外部规范，确认当前规则无实质冲突且 `PROGRESS.md`、Task 1–28 卡片及 `RUN_LOG.md` 未改。验收前后已跟踪文件 diff SHA-256 均为 `e273c910b71ec86b263c80a9a7c69d086bf6544170774a24dcbfad00fe09491c`，新增 Task Card SHA-256 均为 `2d4437cb354fe3aa4b2f48ad3b9789fe9da349098db2ec366f0f7f6f45b12caa`；Board 的最终状态更新在验收之后完成。Verifier 使用全新一次性 PostgreSQL 16 容器（仅绑定 `127.0.0.1:55441`）独立运行 `make check`，退出码 0：Ruff、Pyright 通过，pytest 175 passed，E2E DB guard PASS，前端 lint / typecheck、Vitest 14 passed、production build 通过；`git diff --check` 退出码 0。容器已删除，未使用 `.env`。
- 最终验收结论：PASS。交付版本为基线 commit `de40a1749cc8d231ae1343eed3a1118715cc2f59` 加上述已验收 Workspace 交付指纹；本轮未创建最终任务 commit，故 accepted commit 尚无，不能用当前 HEAD 代称。限制：默认 `localhost:5432` 无 PostgreSQL，检查使用隔离容器；本次纯文档任务未运行 `make smoke`、`make e2e`；检查存在一条上游 Starlette / AnyIO 弃用警告。Verifier 未修改文件、未提交、未 push 或 merge。

### READY

- 无

### BLOCKED

- 无

## DONE

- Task 28
- Task 27
- Task 26
- Task 25
- Task 24
- Task 23
- Task 22
- Task 21
- Task 20
- Task 19
- Task 18
- Task 17
- Task 16
- Task 15
- Task 14
- Task 13
- Task 12
- Task 11
- Task 10
