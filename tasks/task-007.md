# Task 7：本地 Demo 数据集

## 目标

建立可重复灌入的完整固定 Demo 数据，用于 Task 1–6 本地产品走查。

## 范围与边界

- `make demo-data`：先清空本地全部业务数据，再灌入固定虚构数据集。
- `make demo-clean`：清空本地全部业务数据，保留 schema 与 migration，恢复为空库。
- 两命令仅允许 local/development 和本地回环数据库；production、非本地数据库必须拒绝。
- 按外键关系安全清理，事务化执行；不随应用启动自动 seed。
- 覆盖当前模型可表达的素材、客户、课程、词表、场次、多人群和使用记录状态。
- 不实现同名词表复用、Demo ownership 或外部引用保护；本地业务数据不要求与 Demo 共存。

## 验收

已有同名词表时灌入成功；重复灌入结果固定；重复清理后全部业务表为空且 schema/migration 保留；环境门禁通过；`make check`、`make smoke`、`make e2e` 和最终 diff 检查通过。
