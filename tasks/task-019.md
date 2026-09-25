# Task 19：修复 Demo 清理对素材课程关联的兼容性

## 目标

修复 `make demo-clean` / `make demo-data` 在数据库中已经存在素材与课程关联时可能因 `material_courses` 外键约束而失败的问题，使 Demo 数据清理与重建继续满足“可重复执行”的既有约定。

## 背景

Task 16 新增了素材与课程多对多关联表 `material_courses`。

当前 `scripts/demo_data.py` 在清理业务数据时会先删除 `session_audiences`，随后依次删除 Usage、Session、Material、Customer、Course、AudienceType、Industry，但没有先清理 `material_courses`。

当数据库中已有素材与课程关联时，删除 Material 或 Course 可能被关联表外键阻止。该问题由 Task 18 Independent Verifier 在隔离测试库重复运行时发现，属于既有 Demo 清理逻辑对 Task 16 schema 变化未同步适配的问题。

## 范围与边界

1. 修复 Demo 数据清理顺序，使 `material_courses` 在删除 Material / Course 之前被清理。
2. `make demo-clean` 在数据库中存在素材课程关联时应成功完成。
3. `make demo-data` 在数据库中存在素材课程关联时，也应先完整清理旧业务数据，再重新灌入固定 Demo 数据。
4. 保持当前“一个事务覆盖清理与可选重建”的行为。
5. 保持既有安全门禁不变：
   - 仅 `APP_ENV=local/development` 允许执行；
   - 执行前展示目标数据库；
   - 仅精确输入 `yes` 执行；
   - 其他输入、空输入、EOF 均取消且不修改数据；
   - 不新增跳过确认开关。
6. 保持当前 Demo 数据集内容不变；本 Task 不新增素材课程关联 Demo 数据。
7. 不修改业务 API、前端、schema 或 migration。
8. 不改变 Task 7 / Task 9 已冻结的 Demo 数据语义。

## 明确不做

- 新增或调整 Demo 素材内容
- 给 Demo 素材自动建立课程关联
- 修改 `material_courses` schema、外键或级联策略
- 引入数据库级 CASCADE 作为本 Task 的替代方案
- 修改生产数据清理策略
- 新增通用数据库 reset 框架
- 修改其他不相关测试

## 验收

至少验证：

1. 在隔离测试数据库中先创建：
   - 至少一条 Material；
   - 至少一条 Course；
   - 至少一条 `material_courses` 关联。
2. 执行 Demo clean 后：
   - 命令成功；
   - `material_courses` 为空；
   - Material / Course 及其他既有业务数据按当前语义被清空；
   - schema / migration 保留。
3. 在同样存在素材课程关联的数据库上执行 Demo seed：
   - 旧关联与旧业务数据被完整清理；
   - 固定 Demo 数据重新灌入成功；
   - 不发生外键错误。
4. 连续重复执行 clean / seed 不因关联表残留而失败。
5. 既有确认门禁测试继续通过，且不得削弱：
   - production 拒绝；
   - 目标数据库展示；
   - 仅精确 `yes` 执行；
   - 取消后数据零变化。
6. 不新增 schema / migration。
7. `make check` 通过。
8. `make smoke` 通过。
9. `make e2e` 通过。
10. `git diff --check` 通过。

最终由 Independent Verifier 按 `AGENTS.md` 独立验收。
