# 验证

运行 `make check` 做 ruff、pyright、pytest 与 web lint/typecheck/Vitest/build 代码级门禁；运行 `make smoke` 实际启动 Uvicorn，验证 `/api/v1/health` 的 200 与 `/api/v1/not-found` 的 404、JSON 和 X-Request-ID；运行 `make e2e` 用 Playwright 经过 Vite 代理调用真实后端。

`make e2e` 自行准备数据库：`scripts/e2e_db.sh` 会创建（若不存在）专用数据库 `benyan_e2e` 并执行 `alembic upgrade head`，随后以该数据库启动后端。E2E 不依赖任何未写明的手工 migration 步骤，也不连接真实业务数据库；数据库名可用 `E2E_POSTGRES_DB` 覆盖。

后端测试使用真实 PostgreSQL（`TEST_DATABASE_URL`，默认 `benyan_test`），需要该库已执行 `alembic upgrade head`。`tests/conftest.py` 断言测试库名必须以 `/benyan_test` 结尾，防止误连业务库。测试数据全部为虚构内容，且带随机后缀以便重复执行。

CI 还构建 Docker 镜像并在容器内运行 `alembic --help`。生产容器关闭 Uvicorn access log，HTTP 请求由 Middleware 输出结构化 JSON 日志。

测试依赖警告：原先 `httpx` 路径触发 Starlette 的 TestClient 弃用警告；按 Starlette 官方建议改用 `httpx2` 后该警告消失。当前仍有一条来自已安装 Starlette 1.6.0 的 `starlette/testclient.py` 类型别名：它引用已弃用的 `anyio.abc.BlockingPortal`。这是上游代码的导入时警告，后续升级 Starlette 时复查；不屏蔽警告或锁旧版本。

独立验收应复查原始命令结果及错误边界；以每次实际运行结果为准。
