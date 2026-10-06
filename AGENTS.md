# 项目规则

本项目继承 BenYan Engineering Standard v2.0.0、Fast Track 和共享 Web 前端规范。Engineering Standard 只定义软件工程要求；AI 研发协作流程不在本仓库复制。

V1 产品定义以 `docs/product-v1.md` 为唯一产品依据。不得根据页面便利、技术习惯或模型判断自行改变产品语义；如需改变，先修改产品定义并经过确认，不在代码中静默决定。

## AI 研发工作流

后续 AI 研发任务统一遵循已安装的 `agent-board-workflow`，Agent Board（`aboard`）是唯一任务控制面。本仓库不再维护 Orchestrator / Worker / Independent Verifier、RC、PASS、handoff、single-writer、fingerprint 或 Git 收口规则的本地副本。

`TASK_BOARD.md`、`PROGRESS.md`、`RUN_LOG.md` 和 `tasks/` 中现有内容均为历史记录，用于追溯 V1 研发过程，不作为当前任务状态源或调度依据。首次在新的本地 clone 上使用 Agent Board 时，按 Agent Board 自身安装与初始化方式建立本地 Board。

execution backend、Harness、model 以及 merge / push / release 等外部动作是否自动执行，以当前 Run / Human 的明确授权为准。

## 工程与数据边界

保持架构简单，由真实问题推动复杂度。不要为了目录完整创建没有业务意义的 Service、Repository、Manager、Utils 或抽象基类。数据库 Schema 变更必须通过 Alembic。前端继续使用相对路径 `/api/v1/*`，不得在业务代码中写死后端地址。UI 必须复用 `ui/design-system/` 的 tokens、组件和规则，不另造品牌体系。前端服务端数据存在真实的查询、mutation 和缓存失效需求时，可以使用 TanStack Query。没有充分理由，不更换技术栈，不提前引入新的基础设施。

### 公开仓库数据边界

本仓库公开，但真实业务数据不公开。不得提交真实客户或学员数据、真实场次数据、内部来源备注、未公开课件内容、Secret、Token、密码、生产连接信息，或含真实业务数据的测试 fixture、截图和日志。示例、Demo 和测试数据必须使用虚构或匿名化内容。真实业务数据进入任何网络部署环境前，必须先满足项目已经冻结的认证与数据保护要求。

## 验证要求

按任务影响范围执行实际检查。标准命令：

```bash
make check
make smoke  # 涉及后端运行边界时
make e2e    # 涉及页面或完整用户流程时
git diff --check
```

检查日志、临时代码、Secret、migration、接口 / UI 行为和必要文档。未运行、失败或跳过的检查必须说明原因和影响；不要把口头判断或单一测试结果当作完整交付证据。
