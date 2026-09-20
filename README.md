# 课程素材库

面向授课工作的 V1 素材库，覆盖素材录入、客户与课程维护、场次备课和课后登记。产品边界见 `docs/product-v1.md`，当前进度见 `PROGRESS.md`。

## 默认启动

宿主机只需 Docker Compose：

```bash
docker compose up -d --build
docker compose ps
```

等待 `db` 和 `app` 都显示 healthy 后，打开 http://localhost:8000/。API 健康检查为 http://localhost:8000/api/v1/health。首次启动会在 PostgreSQL healthy 后执行本项目全部 Alembic migration；迁移成功后才启动 Web 服务。前端生产构建与 API 位于同一个 app 镜像，数据库存于 `postgres_data` volume。`docker compose down` 保留数据；`docker compose down -v` 会删除数据。

可通过 `WEB_PORT` 改变 Web 端口，通过 `POSTGRES_PORT` 改变仅绑定本机的数据库端口。`POSTGRES_USER`、`POSTGRES_PASSWORD`、`POSTGRES_DB` 可在启动前配置；默认凭据只用于本机开发。已有 volume 创建后，修改环境变量不会自动更新库内凭据。真实业务数据进入网络部署环境前，必须先完成最小单用户认证与数据保护要求。

## 宿主机开发

需要热更新时，安装 Python 3.12+ 和 Node 24，执行：

```bash
make setup
docker compose up -d db
make dev
```

开发页面在 http://localhost:5173/，FastAPI 在 http://localhost:8000/。Vite 使用相对 `/api/v1/*` 请求并代理到后端，可用 `VITE_BACKEND_ORIGIN` 覆盖代理目标。开发模式与 Compose 的 app 服务不能同时占用 8000 端口。

运行 `make check` 检查后端与前端，`make smoke` 检查 API，`make e2e` 经 Vite 和真实后端运行 Playwright。E2E 使用独立数据库，详见 `docs/verification.md`。
