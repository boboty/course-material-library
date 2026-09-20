# 项目规则

继承 BenYan Engineering Standard v1.1.0 和共享 Web 前端规范；本项目显式规则可覆盖通用默认值，必须记录工程理由。

先读现有代码并理解前后端边界；不要无计划大范围重构，不创建无业务意义抽象。UI 必须使用 `ui/design-system/`，不得另造品牌 token 或已有组件风格。`/api/v1` 成功、错误、Request ID 契约不得随意更改。

完成后运行 `make check`；涉及运行边界时执行 `make smoke`，涉及页面时执行 `make e2e`。提供实际证据；AI self-check 不等于独立验收。
