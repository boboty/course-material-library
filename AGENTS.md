# 项目规则

本项目继承 BenYan Engineering Standard v1.3.1、Fast Track 和共享 Web 前端规范。通用工程规则不在本文件重复。项目级协作、状态、交付与验收约定见本文件、`TASK_BOARD.md` 和当前 Task Card。

V1 产品定义以 `docs/product-v1.md` 为唯一产品依据。不得根据页面便利、技术习惯或模型判断自行改变产品语义；如需改变，先修改产品定义并经过确认，不在代码中静默决定。

## 权威记录与读取顺序

Task Card 定义工作；`TASK_BOARD.md` 是状态、依赖、推进策略、当前有效角色及最终验收结果的权威记录；Workspace/Git 保存可审阅成果；Agent activity 保存工具无关的执行过程；Independent Verifier 提供关联到交付版本的完成证据。

开始 Task 前，Developer 和 Verifier 必须读取：

1. `AGENTS.md`；
2. `TASK_BOARD.md`；
3. Board 指定的当前 Task Card；
4. Task 明确引用的产品、架构、验证或其他文档。

`PROGRESS.md` 是历史记录，不是当前状态源，不要求日常维护。不得仅凭聊天记录、旧 Progress、Git 历史或现有实现推断当前 Task 状态。若 Task Card 与 Board 的任务范围、状态或角色不一致，或标准含义不清、验收标准不可验证，Orchestrator 暂停推进并交更高层控制角色澄清；不得自行修改 Task 定义。

## 工程与数据边界

保持架构简单，由真实问题推动复杂度。不要为了目录完整创建没有业务意义的 Service、Repository、Manager、Utils 或抽象基类。数据库 Schema 变更必须通过 Alembic。前端继续使用相对路径 `/api/v1/*`，不得在业务代码中写死后端地址。UI 必须复用 `ui/design-system/` 的 tokens、组件和规则，不另造品牌体系。前端服务端数据存在真实的查询、mutation 和缓存失效需求时，可以使用 TanStack Query。没有充分理由，不更换技术栈，不提前引入新的基础设施。

### 公开仓库数据边界

本仓库公开，但真实业务数据不公开。不得提交真实客户或学员数据、真实场次数据、内部来源备注、未公开课件内容、Secret、Token、密码、生产连接信息，或含真实业务数据的测试 fixture、截图和日志。示例、Demo 和测试数据必须使用虚构或匿名化内容。真实业务数据进入任何网络部署环境前，必须先满足项目已经冻结的认证与数据保护要求。

## 角色与写入权

角色按职责区分，与具体人员、模型、Agent 产品或执行工具无关。

- **Orchestrator**：只在已批准的 Task Card 范围内管理依赖、推进策略、Board 状态和当前有效角色；不自行改变 Task 目标、边界或验收标准，不实现交付，也不代替 Developer 自验。拆分、合并或重拆若改变 Task 定义，或出现产品 / 架构裁决需求，须停止并交更高层控制角色处理。由 Orchestrator 在 Board 指定的当前有效 Developer 是该 Task 唯一持有 Workspace 写入权者。
- **Developer**：按 Task Card 与 Board 当前分工实现、验证、自检，并报告修改、未完成事项、验证结果和限制。写入权移交生效后，前任 Developer 立即失去该 Task 的 Workspace 写入权。Developer 不得宣布或代写 PASS，也不得冒充 Independent Verifier。
- **Independent Verifier**：与 Developer 保持独立判断；人员执行时应为不同人员，使用 AI 时至少使用独立会话和独立上下文。Verifier 对交付内容只读，不得修改代码、测试、Task Card、Task Board 或普通项目文档，也不得实施修复或创建任务 commit。Verifier 对照 Task Card 审阅完整 diff、相关代码和证据，按真实业务链路检查并在需要时独立验证；将结论、证据和限制反馈给 Orchestrator，由 Orchestrator 更新 Board。

Developer 的内部 reviewer、self-review 或其他开发阶段检查不构成正式独立验收。只有 Independent Verifier 的证据结论能支持 PASS；测试全绿或口头声明本身不等于完成。

## Task 与状态流程

开始新 Task 时，必须先有 Task Card，且 Board 已登记该 Task 和当前有效 Developer，之后才能修改交付内容。Task Card 应写明目标、范围、输入、输出、限制和可执行验收标准；不得把聊天中的范围默默扩展进实现。Task Board 管理状态、依赖、推进策略、当前有效角色及最终验收结果；Workspace/Git 留交付，Agent activity 留执行过程。正常流程不创建或维护 `PROGRESS.md`。

Task Board 使用 `READY`、`IN PROGRESS`、`READY FOR VERIFICATION`、`VERIFYING`、`RC`、`BLOCKED`、`DONE` 状态，并记录当前有效 Developer / Verifier（无则明确写明）、依赖、推进策略、当前状态说明和最终验收结论 / 证据。`READY FOR VERIFICATION` 表示施工交付稳定，正等待 Orchestrator 启动 Verifier；`VERIFYING` 表示 Verifier 已启动且交付只读。一个 Workspace 同一时间只能有一个当前有效 Developer。RC 不结束 Task、不推进后续 Task；PASS 后由 Orchestrator 在 Board 写入结论及证据并推进。BLOCKED 不是完成结论。

### RC 与阻塞

Verifier 发现问题时，提供具体问题、证据和验证限制，向 Orchestrator 报告；Orchestrator 将 Task 状态设为 RC，并把当前有效角色交回当前有效 Developer。Developer 修复并重新自检后，Orchestrator 确认 Workspace 稳定，再启动新的 Independent Verifier 会话复验。修复前的验收结论不能沿用。

遇到无法按当前 Task、依赖或可用证据继续推进的情况，报告阻塞原因、已确认事实和所需裁决，由 Orchestrator 更新 Board 为 BLOCKED 并明确下一步。涉及 Task 定义、产品或架构变化时交更高层控制角色决定。

## 中断、failover 与交接

控制面 transport / connection error、超时或会话异常只代表观察或通信中断，不能证明执行端已经停止。Orchestrator 在移交写入权前，必须确认前任 Developer 已停止、归档、取消，或已通过执行环境等价机制失去当前 Workspace 写入能力。不能仅凭错误并行启动替代者；无法确认唯一写入者时暂停并将 Task 标记 BLOCKED。

轻度中断时，Orchestrator 可指定替代 Developer。接替者先读取 Task Card、Board、Workspace/Git 当前 diff 和前任 Agent activity，复核运行状态，只继续既定 Task 范围内的剩余工作。若发现未预期的文件变化、diff 自行变化或旧执行者可能恢复，立即暂停写入并查明执行者；收回多余写入资格，确认 Workspace 稳定后再恢复。稳定前不得启动正式验收或宣称 PASS。接替 Developer 不继承前任的验收结论。

若中断发生在 RC 之后，Board 当前有效角色返回 Developer；修复完成后必须新启动 Independent Verifier。若目标、边界、依赖或运行状态已不可靠，按严重中断处理：暂停原执行，可在既定 Task 定义内回退或重启；若恢复需要改变 Task 定义，交更高层控制角色裁决。

## 稳定交付与独立验收

Developer 完成自检并声明交付候验后，Orchestrator 确认没有其他可能写入者，且交付已稳定，再启动 Independent Verifier。可用 Git diff、Workspace 状态、文件摘要或等价方式在验收前后确认交付内容一致。验收期间交付不得变化；若发现变化，Verifier 暂停并反馈 Orchestrator，旧交付的验收结论失效。变更后的交付重新稳定后，必须新启动一轮独立验收。

Verifier 按 Task Card 逐项检查完整 diff、相关代码 / 文档、真实业务链路、测试路径、边界和错误，评估 mock、手工构造或同源假设是否绕过核心风险，并检查日志、敏感信息及范围外改动。按 Task 要求独立运行适用验证。报告实际命令及原始结果、交付版本、未通过或跳过项、验证限制和影响；不以测试全绿替代判断。

- 验收问题：Verifier 将问题、证据和限制反馈给 Orchestrator；Orchestrator 设为 RC 并交回当前有效 Developer。
- 验收通过：Verifier 将 PASS 结论、可复查证据、限制和对应交付版本反馈给 Orchestrator；仅 Orchestrator 在 Board 记录最终验收结果。
- 阻塞：报告阻塞、已确认事实和待裁决事项，由 Orchestrator 在 Board 更新状态并确定下一步。

本项目不要求特定角色创建最终任务 commit。是否 commit 遵循项目 Git 交付规则；不得由本文件推导出 Verifier 必须提交。push、merge 默认须人工授权，除非用户明确授权。

## 完成检查

施工与验收按 Task Card 的验收标准执行。提交前运行 `make check`。涉及后端运行边界时运行 `make smoke`；涉及页面或完整用户流程时运行 `make e2e`。检查日志、临时代码、Secret 和必要文档；适用的 migration、接口 / UI 验证按 Task 要求审阅。报告必须对应实际执行证据，未运行、失败或跳过的检查逐项说明原因、影响和 Task 要求下的判断。
