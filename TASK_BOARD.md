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

- Task 22 — 素材列表人群、行业与标签筛选

## READY

- Task 23 — 素材家族与源素材关系
- Task 24 — 备课同客户与同集团重复使用提醒
- Task 25 — 素材复核、Demo 验证、案例类别与退役原因
- Task 26 — 复核到期与连续两次差评提示
- Task 27 — 草稿待补全
- Task 28 — V1 全链路验收与产品收口

## BLOCKED

- 无

## DONE

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
