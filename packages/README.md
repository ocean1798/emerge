# packages

共享包目录。

建议等代码出现真实复用需求后再拆分：

- `contracts`：类型、schema、API DTO。
- `ui`：跨页面复用组件。
- `rag`：检索、证据合并、rerank。
- `storage`：本地存储与对象存储适配。

不要为了架构漂亮过早拆包。
