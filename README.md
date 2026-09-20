# BenYan WebApp Starter · Fast Track

版本 1.0.0。React 19 + TypeScript + Vite 8 与已验收的 FastAPI Starter 组合；纯 API / Agent 项目使用 `benyan-fastapi-starter`。后端沿用 Request ID、错误、日志、Alembic、Docker、CI、smoke。UI 使用官方 BenYan AI Design System 快照。

要求 Node 24、Python 3.12+。运行 `make setup`、`make dev`；在另一终端执行 `make check`、`make smoke`、`make e2e`。`make dev` 同时启动 FastAPI (8000) 与 Vite (5173)，Ctrl-C 后清理进程。前端只调用 `/api/v1/*`，代理目标可由 `VITE_BACKEND_ORIGIN` 覆盖，默认 `http://127.0.0.1:8000`。

`make check` 验证 backend ruff/pyright/pytest 与 web lint/typecheck/Vitest/build；`make smoke` 实际调用 FastAPI；`make e2e` 用 Playwright 经过 Vite 代理调用真实后端。Docker 镜像继承 FastAPI Starter，仅部署后端；migration 是独立部署步骤。项目规则见 `AGENTS.md`。
