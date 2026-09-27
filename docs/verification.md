# 验证

## Task 验收流程

Task Card 定义验收标准，`TASK_BOARD.md` 管理当前状态、依赖、推进策略、当前有效角色和最终验收结果；Workspace/Git 保存可审阅交付，Agent activity 保存执行过程，Independent Verifier 提供对应交付版本的完成证据。当前状态不从 `PROGRESS.md` 推断；该文件仅为历史记录。

正式验收前，Orchestrator 确认 Developer 已自检、没有其他可能写入者、交付稳定后再启动独立 Verifier。验收期间交付只读，验收前后确认内容未变化。RC 时由 Orchestrator 将工作交回当前有效 Developer，修复后启动新的 Verifier 会话；PASS 或 BLOCKED 的结论及证据由 Orchestrator 更新到 Task Board。具体角色、failover、中断与稳定交付规则见 `AGENTS.md`。

Developer 应按 Task Card 运行适用检查，并报告原始结果和限制；独立验收不以测试全绿自动替代审阅。项目级标准检查命令如下：

```bash
make check
make smoke  # 涉及后端运行边界时
make e2e    # 涉及页面或完整用户流程时
git diff --check
```

Verifier 按 Task Card 逐项审阅完整 diff 和证据，判断测试路径是否覆盖真实业务链路，评估 mock、手工构造、同源假设、遗漏边界、错误、日志、敏感信息和范围外改动。未通过或跳过的检查须报告原因和影响。验收期间如发现交付变化，暂停验收并反馈 Orchestrator；变化后的交付稳定后必须启动新一轮验收。

## 自动化验证命令

运行 `make check` 做 ruff、pyright、pytest 与 web lint/typecheck/Vitest/build 代码级门禁；运行 `make smoke` 实际启动 Uvicorn，验证 `/api/v1/health` 的 200 与 `/api/v1/not-found` 的 404、JSON 和 X-Request-ID；运行 `make e2e` 用 Playwright 经过 Vite 代理调用真实后端。

`make e2e` 自行准备数据库：`scripts/e2e_db.sh` 会创建（若不存在）专用数据库 `benyan_e2e` 并执行 `alembic upgrade head`，随后以该数据库启动后端。E2E 不依赖任何未写明的手工 migration 步骤，也不连接真实业务数据库。

E2E 数据库名有安全门禁：只允许小写字母、数字和下划线且以字母开头，必须以 `_e2e` 结尾；`benyan`、`benyan_test`、`benyan_dev`、`postgres`、`template0/1` 等非 E2E 名称直接拒绝；`PGHOST`/`PGPORT`/`PGUSER`/`PGPASSWORD` 同样做格式校验，数据库名通过 psql 变量传入而不拼接进 SQL。`./scripts/verify_e2e_db_guard.sh` 覆盖这些拒绝路径，并作为 `make check` 的一步执行。

后端测试使用真实 PostgreSQL（`TEST_DATABASE_URL`，默认 `benyan_test`），需要该库已执行 `alembic upgrade head`。`tests/conftest.py` 断言测试库名必须以 `/benyan_test` 结尾，防止误连业务库。测试数据全部为虚构内容，且带随机后缀以便重复执行。

CI 还构建 Docker 镜像并在容器内运行 `alembic --help`。生产容器关闭 Uvicorn access log，HTTP 请求由 Middleware 输出结构化 JSON 日志。

测试依赖警告：原先 `httpx` 路径触发 Starlette 的 TestClient 弃用警告；按 Starlette 官方建议改用 `httpx2` 后该警告消失。当前仍有一条来自已安装 Starlette 1.6.0 的 `starlette/testclient.py` 类型别名：它引用已弃用的 `anyio.abc.BlockingPortal`。这是上游代码的导入时警告，后续升级 Starlette 时复查；不屏蔽警告或锁旧版本。

独立验收应复查原始命令结果及错误边界；以每次实际运行结果为准。
