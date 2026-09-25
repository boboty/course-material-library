# 项目规则

本项目继承 BenYan Engineering Standard v1.2.0、Fast Track 和共享 Web 前端规范。通用工程规则不在本文件重复。

V1 产品定义以 `docs/product-v1.md` 为唯一产品依据。不得根据页面便利、技术习惯或模型判断自行改变产品语义；如需改变，先修改产品定义并经过确认，不在代码中静默决定。

---

## 权威上下文与读取顺序

开始任何开发 Task 前，必须先阅读：

1. `AGENTS.md` —— 工程规则与执行约束；
2. `PROGRESS.md` —— 当前项目状态、已验收基线、当前 Task 状态与未完成事项；
3. 当前 Task 文件 —— 本次任务目标、范围、边界与验收标准；
4. Task 明确引用的产品、架构或其他文档。

其中：

* `docs/product-v1.md` 定义产品事实；
* `AGENTS.md` 定义长期执行规则；
* `PROGRESS.md` 定义项目当前状态；
* 当前 Task 定义本轮要完成的事情。

不要仅根据聊天记录、Git 历史或现有代码自行推断项目状态。

如果 `PROGRESS.md`、当前 Task、产品定义或现有实现之间存在实质冲突，停止施工并指出冲突，不自行选择一种解释继续实现。

---

## 工程与数据边界

保持架构简单，由真实问题推动复杂度。

不要为了目录完整创建没有业务意义的 Service、Repository、Manager、Utils 或抽象基类。

数据库 Schema 变更必须通过 Alembic。

前端继续使用相对路径 `/api/v1/*`，不得在业务代码中写死后端地址。

UI 必须复用 `ui/design-system/` 的 tokens、组件和规则，不另造品牌体系。

前端服务端数据存在真实的查询、mutation 和缓存失效需求时，可以使用 TanStack Query。

没有充分理由，不更换技术栈，不提前引入新的基础设施。

### 公开仓库数据边界

本仓库公开，但真实业务数据不公开。

不得提交：

* 真实客户或学员数据；
* 真实场次数据；
* 内部来源备注；
* 未公开课件内容；
* Secret、Token、密码、生产连接信息；
* 含真实业务数据的测试 fixture、截图或日志。

示例、Demo 和测试数据必须使用虚构或匿名化内容。

真实业务数据进入任何网络部署环境前，必须先满足项目已经冻结的认证与数据保护要求。

---

## Task 执行与项目状态

### 角色职责

角色按当前任务职责区分，与具体 Agent 或模型无关：

* Developer：负责实现、测试、普通文档修改和 self-check；可更新 `PROGRESS.md` 中的 `进行中`、`待独立验收`、RC 修复及 `待复验` 等施工状态；不得宣布 `PASS`、写入独立验收结论、将本轮 `accepted baseline` 更新为 PASS 提交，或执行最终任务 commit。
* Independent Verifier：必须独立执行验收；优先与 Developer 使用不同模型/provider，否则至少使用独立会话和独立上下文。除 `PROGRESS.md` 外，对项目交付内容只读；不得修改代码、测试、Task、README 或普通项目文档，也不得顺手修复问题。

Developer 自己启动的 sub-agent、provider-native reviewer、self-review 或其他内部 reviewer 仅属于内部检查，不构成正式独立验收。

RC 时，Verifier 给出具体问题、证据和验证限制，可在 `PROGRESS.md` 写入 `RC` 状态及验收问题；不 commit，返回 Developer 修复。

PASS 时，仅 Independent Verifier 本人可在 `PROGRESS.md` 写入 `PASS`、验收证据、限制和本轮 `accepted baseline`；Verifier 对本轮全部交付执行 `git add`，并创建最终任务 commit。Developer 不得代写 PASS 或代替 Verifier 提交最终任务 commit。push、merge 仍须人工授权，除非用户另有明确授权。

### 新 Task 启动门禁

如果用户要求开始一个新的 Task，而对应 Task 文件尚不存在，Developer 必须先创建 Task 文件，并将 `PROGRESS.md` 更新为该 Task `进行中`，然后才能修改业务代码。不得直接把聊天指令当作正式 Task 定义开工。若信息不足以形成 Task 文件，应停止并指出缺失内容。

### PROGRESS.md

`PROGRESS.md` 是项目当前状态快照，不是历史日志。

它用于回答：

* 已经完成到哪个 Task；
* 当前已验收基线是什么；
* 当前正在执行哪个 Task，以及处于什么状态；
* 当前系统已经具备什么；
* 哪些能力尚未实现；
* 哪些产品或工程判断已经冻结；
* 当前有哪些已知风险或待处理事项；
* 下一步是什么。

历史变化由 Git 保存，不在 `PROGRESS.md` 中维护流水账。

### Task 状态

Task 使用以下状态：

* `进行中`
* `待独立验收`
* `RC`
* `待复验`
* `PASS`

Developer 不得自行将自己完成的 Task 标记为 `PASS`。

### 中途交接

如果 Task 尚未完成，但需要结束当前会话、切换模型或交接给下一位 Developer，交接前必须先更新 `PROGRESS.md`。

中途交接时至少记录：

* 当前 Task 仍为 `进行中`；
* 已完成的实际内容；
* 尚未完成的内容；
* 当前工作区 / migration / schema 状态；
* 已经实际运行过的验证及结果；
* 当前已知问题、风险或未决判断；
* 下一位 Developer 应从哪里继续。

不要把计划中的工作写成已经完成，也不要因为中途交接修改 `accepted baseline`。

下一位 Developer 必须先读取 `AGENTS.md`、`PROGRESS.md` 和当前 Task，再检查现有工作区后继续，不重新从聊天历史推断任务状态。

### 施工结束

Developer 完成施工并通过自验后，在输出最终施工报告之前，必须先更新 `PROGRESS.md`。

至少更新：

* 当前 Task 及状态；
* 本轮实际完成范围；
* migration / schema 状态；
* 测试、Smoke、E2E 等实际验证结果；
* 本轮新增或修改的冻结判断；
* 当前仍未实现的范围；
* 已知风险或待验收事项；
* 下一步。

此时 Task 状态应为：

`待独立验收`

更新 `PROGRESS.md` 是 Task 施工完成流程的一部分，最终施工报告不得早于状态更新。

### 独立验收

独立验收与状态写入按角色分工：

* 验收发现问题：Verifier 可标记为 `RC`，记录问题、证据和限制，不 commit；
* RC 修复并完成自验：Developer 标记为 `待复验`；
* 验收或复验通过：仅 Verifier 标记为 `PASS`，记录证据、限制和 `accepted baseline`，并创建包含本轮全部交付及验收状态的最终任务 commit。

新任务的 `accepted baseline` 是 Verifier 在 PASS 后创建的最终任务 commit；既有验收记录和基线不追溯改写。

不要使用 `HEAD` 作为可信基线，因为后续文档提交或状态更新会使它立即失效。

已经失效的中间状态直接由最新状态覆盖。

---

## 完成与验收标准

每个 Task 完成施工后至少检查：

* 实现是否符合 `docs/product-v1.md` 和当前 Task；
* 是否严格控制在 Task 范围内；
* 正常、边界和失败场景是否有验证；
* 是否引入不必要的抽象、依赖或未来设计；
* 是否泄露真实业务数据或 Secret；
* `PROGRESS.md` 是否已经更新为真实当前状态。

提交前运行：

```bash
make check
```

涉及后端运行边界时运行：

```bash
make smoke
```

涉及页面或完整用户流程时运行：

```bash
make e2e
```

施工报告必须报告实际执行过的验证及结果，不得把计划执行写成已经通过。

**AI self-check 不等于独立验收。**

只有通过独立验收的 Task 才能由 Verifier 标记为 `PASS`；Verifier 创建的最终任务 commit 成为新的 `accepted baseline`。
