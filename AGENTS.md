# 项目规则

本项目继承 BenYan Engineering Standard v1.3.4、Fast Track 和共享 Web 前端规范。通用工程规则不在本文件重复。项目级协作、状态、交付与验收约定见本文件、`TASK_BOARD.md` 和当前 Task Card。

V1 产品定义以 `docs/product-v1.md` 为唯一产品依据。不得根据页面便利、技术习惯或模型判断自行改变产品语义；如需改变，先修改产品定义并经过确认，不在代码中静默决定。

## 权威记录与读取顺序

Task Card 定义工作；`TASK_BOARD.md` 是跨会话、跨角色的阶段性调度状态权威记录；Workspace/Git 保存可审阅成果；Agent activity 保存工具无关的执行过程；Independent Verifier 提供关联到交付版本的完成证据。

开始 Task 前，Developer 和 Verifier 必须读取：

1. `AGENTS.md`；
2. `TASK_BOARD.md`；
3. Board 指定的当前 Task Card；
4. Task 明确引用的产品、架构、验证或其他文档。

`PROGRESS.md` 是历史记录，不是当前状态源，不要求日常维护。不得仅凭聊天记录、旧 Progress、Git 历史或现有实现推断 Task 定义。若 Task Card 与 Board 的阶段状态冲突，或标准含义不清、验收标准不可验证，Orchestrator 暂停相关推进并交更高层控制角色澄清；不得自行修改 Task 定义。

## 工程与数据边界

保持架构简单，由真实问题推动复杂度。不要为了目录完整创建没有业务意义的 Service、Repository、Manager、Utils 或抽象基类。数据库 Schema 变更必须通过 Alembic。前端继续使用相对路径 `/api/v1/*`，不得在业务代码中写死后端地址。UI 必须复用 `ui/design-system/` 的 tokens、组件和规则，不另造品牌体系。前端服务端数据存在真实的查询、mutation 和缓存失效需求时，可以使用 TanStack Query。没有充分理由，不更换技术栈，不提前引入新的基础设施。

### 公开仓库数据边界

本仓库公开，但真实业务数据不公开。不得提交真实客户或学员数据、真实场次数据、内部来源备注、未公开课件内容、Secret、Token、密码、生产连接信息，或含真实业务数据的测试 fixture、截图和日志。示例、Demo 和测试数据必须使用虚构或匿名化内容。真实业务数据进入任何网络部署环境前，必须先满足项目已经冻结的认证与数据保护要求。

## 角色与写入权

角色按职责区分，与具体人员、模型、Agent 产品或执行工具无关。

- **Orchestrator**：只在已批准的 Task Card 范围内负责调度、选择可执行 Task、协调 Developer / Independent Verifier、处理 RC、中断和推进策略，并维护 Board 的阶段状态。不自行改变 Task 目标、边界、依赖、推进策略或验收标准，不实现交付，也不代替 Developer 自验。拆分、合并或重拆若改变 Task 定义，或出现产品 / 架构裁决需求，须停止并交更高层控制角色处理。
- **Developer**：按 Task Card 实现、验证、自检，并报告修改、未完成事项、验证结果和限制。Developer 不得宣布或代写 PASS，也不得冒充 Independent Verifier。
- **Independent Verifier**：与 Developer 保持独立判断；人员执行时应为不同人员，使用 AI 时至少使用独立会话和独立上下文。Verifier 对交付内容只读，不得修改代码、测试、Task Card、Task Board 或普通项目文档，也不得实施修复或创建任务 commit。Verifier 对照 Task Card 审阅完整 diff、相关代码和证据，按真实业务链路检查并在需要时独立验证；将结论、证据和限制反馈给 Orchestrator。

Developer 的内部 reviewer、self-review 或其他开发阶段检查不构成正式独立验收。只有 Independent Verifier 的证据结论能支持 PASS；测试全绿或口头声明本身不等于完成。

## 执行平台与调度后端

本项目不绑定 Paseo、Orca 或其他具体调度产品。execution backend 属于当前 Run 的运行时上下文，不属于项目协议状态。

- Orchestrator 只使用当前 Run / 主控明确指定的 execution backend；不得根据历史示例、旧会话或过去使用过的平台推断默认值。
- 当前指定 Orca 时，只使用 Orca 的 orchestration / worker / controlled terminal 能力，不搜索、启动或调用 Paseo。
- 当前指定 Paseo 时，只使用 Paseo 的 Agent Profile / delegation 能力，不搜索、启动或调用 Orca，除非主控明确切换。
- 若 execution backend 未明确，Orchestrator 应暂停在调度准备状态并请求主控指定，不自行探测多个平台。
- 平台、Harness、model、effort、auto/non-interactive mode 都是可替换运行时资源；Task、Board、Gate、single-writer、RC 和 Independent Verification 语义不因平台切换而改变。

> **协议定义流程，执行平台只是可替换的适配层。**

## Task Board 与调度粒度

Task Board 由 Orchestrator 维护，是项目的阶段性 progress 视图，但不承担运行日志职责。

Board 默认只使用：

- `READY`：已定义且依赖满足，可开始；
- `IN PROGRESS`：Task 正在执行，包含开发、自检、正式验收、RC 修复和重新验收等内部过程；
- `BLOCKED`：当前 Task 无法继续，需要跨会话恢复、外部依赖或更高层输入；
- `DONE`：Independent Verifier PASS，已完成必要收口；
- `DECISION REQUIRED`：仅在明确需要主控产品 / 架构 / Task 定义裁决时使用。

Board 应保留后续调度真正需要的信息：Task、依赖、推进策略、Task Card、阻塞/决策点、DONE 后的 accepted commit/baseline 与简短验收结论。当前 Developer/Verifier 身份、RC 轮次、临时错误、验收中的短期状态等由 Orchestrator 当前会话维护，除非需要跨会话恢复，否则不强制写入 Board。

正常流程不创建或维护 `PROGRESS.md`。

## 中断、failover 与交接

同一 Task / Workspace 任一时刻只能有一个拥有实现写入权的当前有效 Developer。该唯一写入权由 Orchestrator 在执行上下文中维护，不要求持续写入 Board。

控制面 transport / connection error、超时或会话异常只代表观察或通信中断，不能证明执行端已经停止。Orchestrator 在移交写入权前，必须确认前任 Developer 已停止、归档、取消，或已通过执行环境等价机制失去当前 Workspace 写入能力。不能仅凭错误并行启动替代者。

轻度中断时，Orchestrator 可指定替代 Developer。接替者先读取 Task Card、Board、Workspace/Git 当前 diff 和前任 Agent activity，复核运行状态，只继续既定 Task 范围内的剩余工作。若发现未预期的文件变化、diff 自行变化或旧执行者可能恢复，立即暂停写入并查明执行者；收回多余写入资格，确认 Workspace 稳定后再恢复。稳定前不得启动正式验收或宣称 PASS。

若目标、边界、依赖或运行状态已不可靠，按严重中断处理：暂停原执行，可在既定 Task 定义内回退或重启；若恢复需要改变 Task 定义，交更高层控制角色裁决，需要等待时再将 Board 置为 `BLOCKED` 或 `DECISION REQUIRED`。

## 独立验收

Developer 完成自检并声明交付候验后，Orchestrator 确认没有其他可能写入者，且交付已稳定，再启动 Independent Verifier。验收期间交付不得变化；若发现变化，旧交付的验收结论失效，重新稳定后启动新一轮独立验收。

Verifier 按 Task Card 逐项检查完整 diff、相关代码 / 文档、真实业务链路、测试路径、边界和错误，评估 mock、手工构造或同源假设是否绕过核心风险，并检查日志、敏感信息及范围外改动。按 Task 要求独立运行适用验证。报告实际命令及原始结果、交付版本、未通过或跳过项、验证限制和影响；不以测试全绿替代判断。

RC 由 Orchestrator 在当前调度会话中交回当前有效 Developer；修复完成后启动新的 Independent Verifier。RC 默认不改变 Board 的 `IN PROGRESS` 状态。PASS 后由 Orchestrator 将 Task 置为 `DONE` 并记录最小可追溯证据。

本项目不要求特定角色创建最终任务 commit。是否 commit 遵循项目 Git 交付规则；push、merge 默认须人工授权，除非用户明确授权。

## 完成检查

施工与验收按 Task Card 的验收标准执行。提交前运行 `make check`。涉及后端运行边界时运行 `make smoke`；涉及页面或完整用户流程时运行 `make e2e`。检查日志、临时代码、Secret 和必要文档；适用的 migration、接口 / UI 验证按 Task 要求审阅。报告必须对应实际执行证据，未运行、失败或跳过的检查逐项说明原因、影响和 Task 要求下的判断。
