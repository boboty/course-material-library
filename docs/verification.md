# 验证

运行 `make check` 做 ruff、pyright、pytest 代码级门禁；运行 `make smoke` 实际启动 Uvicorn，验证 `/api/v1/health` 的 200 与 `/api/v1/not-found` 的 404、JSON 和 X-Request-ID。数据库需要单独启动 PostgreSQL 后验证 migration。独立验收应复查原始命令结果及错误边界。

CI 还构建 Docker 镜像并在容器内运行 `alembic --help`。生产容器关闭 Uvicorn access log，HTTP 请求由 Middleware 输出结构化 JSON 日志。

测试依赖警告：原先 `httpx` 路径触发 Starlette 的 TestClient 弃用警告；按 Starlette 官方建议改用 `httpx2` 后该警告消失。当前仍有一条来自已安装 Starlette 1.6.0 的 `starlette/testclient.py` 类型别名：它引用已弃用的 `anyio.abc.BlockingPortal`。这是上游代码的导入时警告，后续升级 Starlette 时复查；不屏蔽警告或锁旧版本。本轮本地 `make check` 实测 14 个测试通过，后续以每次实际运行结果为准。
