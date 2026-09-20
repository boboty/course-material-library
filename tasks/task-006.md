# Task 6：课程素材库运行与交付基线升级

状态：**PASS**（独立验收通过）

## 目标

将本仓库迁移到已经验收的 Compose 完整交付基线，保留 Task 1–5 业务语义。外部只读基线为 `boboty/benyan-engineering-standard@7a3a6d6da51a70912f14800015583d7cf28d9be8` 和 `boboty/benyan-webapp-starter@075526b6394d4b552f3eda96088548c44a071fa3`。

## 范围

- `docker compose up -d --build` 从干净环境启动 app 与 PostgreSQL。
- app 镜像包含 React production build；FastAPI 同时提供 `/api/v1/*` 和 SPA。
- PostgreSQL healthy 后自动运行本项目 Alembic migration，成功后启动 Uvicorn；app healthy；数据库 volume 持久化。
- 保留宿主机 `make dev` 热更新方式；README 项目化。

## 验收

- 从空库迁移到当前 head；验证首页、health、重启后数据持久化。
- `make check`、`make smoke`、`make e2e` 通过。
- 检查最终 diff，不修改 Task 1–5 产品语义；完成后仅标记待独立验收。
