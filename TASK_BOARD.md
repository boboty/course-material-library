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

- 无

## 最近完成

### 项目级流程规范对齐 BenYan Engineering Standard v1.3.1

- 状态：`DONE / PASS`
- Task Card：[`tasks/engineering-standard-v1.3.1.md`](tasks/engineering-standard-v1.3.1.md)
- accepted commit：`d5e831f8f4d42be08b56893aea75c8e2f739318c`
- Independent Verifier：PASS
- 验证：`make check` PASS（后端 175 passed；前端 Vitest 14 passed，lint / typecheck / build 通过）；`git diff --check` PASS
- 限制：默认 `localhost:5432` 未运行 PostgreSQL，验收使用隔离 PostgreSQL 16 环境；本次为纯文档任务，未运行 `make smoke` / `make e2e`
- 推进策略：按用户要求停止，不领取新的产品 Task

## READY

- 无

## BLOCKED

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
