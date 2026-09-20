# 架构

`web/` 是共享 React 前端，统一调用相对路径 `/api/v1/*`。Vite 代理负责开发连接；两个 Track 保持同一外部 API 契约。System Status 仅验证基础设施，不是业务样板。

## 现有实体

* `materials`：素材（Task 1）。
* `customers`：客户，标准名称唯一，`industry_id` 引用 `industries` 实体，不使用自由文本行业。
* `courses`：课程，状态为 `启用 / 停用`；停用不删除课程，也不影响历史场次读取。
* `industries` / `audience_types`：V1 最小基础词表，名称唯一。客户行业与场次人群类型复用同一套词表，不建设通用词表框架。
* `sessions`：授课场次，必须引用一个客户和一门主课程，保存开始日期、时长（半天 / 一天 / 两天 / 其他）、备注和人群描述。
* `session_audiences`：场次与人群类型的多对多关联。人群类型是结构化多选，必须至少选择一个；自由文本 `audience_description` 只补充说明，不替代结构化人群类型。

一个场次只指定一门主课程；V1 不建模母课 / 子课 / 课程版本。

## 数据库

Schema 变更通过 Alembic。`alembic/versions/0001_materials.py` 为素材核心，`0002_customers_courses_sessions.py` 为 Task 2 的客户、课程、词表与场次。

本地与 CI 各自指定 `DATABASE_URL`；测试使用 `TEST_DATABASE_URL`，并断言其必须以 `/benyan_test` 结尾，避免误连业务库。
