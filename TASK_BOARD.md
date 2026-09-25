# Task Board

Orchestrator 按本文件顺序推进 READY Task。

规则：

- 同一时间只允许一个 IN PROGRESS Task。
- Orchestrator 只负责调度；除本文件外，不修改任何项目文件。
- `TASK_BOARD.md` 决定下一个执行什么；`PROGRESS.md` 记录当前 Task 的真实施工 / 验收状态。
- 每个 Task 使用新的 Developer 和新的 Independent Verifier 会话。
- RC 时继续当前 Task，不启动下一个。
- BLOCKED 时停止并报告。
- PASS 后将当前 Task 移入 DONE，再推进下一个 READY Task。
- 最终 commit 仍由 Independent Verifier 按 `AGENTS.md` 创建。
- 不自动 push，不 merge。

## IN PROGRESS

- 无

## READY

- Task 16 — 素材与课程多对多关系
- Task 17 — 备课素材按当前课程优先展示

## BLOCKED

- 无

## DONE

- Task 15
- Task 14
- Task 13
- Task 12
- Task 11
- Task 10
