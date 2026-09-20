# 架构

`web/` 是共享 React 前端，调用相对路径 `/api/v1/health`。Vite 代理负责开发连接；两个 Track 保持同一外部 API 契约。System Status 仅验证基础设施，不是业务样板。
