# Task Board

本文件由 Orchestrator 维护，是项目跨会话的阶段性 progress 视图。Task Card 定义工作，Workspace/Git 保存成果，Agent activity 保存执行过程，Independent Verifier 提供完成证据。

Board 只持久化后续调度真正需要的信息，不记录 Developer / Verifier 切换、RC 轮次、临时错误或其他可由当前 Orchestrator 会话可靠维护的执行细节。

## READY

- 无

## IN PROGRESS

- 无

## BLOCKED

- 无

## DECISION REQUIRED

- 无

## DONE

### 项目级流程规范对齐 BenYan Engineering Standard v1.3.1

- Task Card：[`tasks/engineering-standard-v1.3.1.md`](tasks/engineering-standard-v1.3.1.md)
- accepted commit：`d5e831f8f4d42be08b56893aea75c8e2f739318c`
- 验收：Independent Verifier PASS；`make check`、`git diff --check` PASS
- 限制：默认 `localhost:5432` 未运行 PostgreSQL，验收使用隔离 PostgreSQL 16 环境

### 历史完成

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
