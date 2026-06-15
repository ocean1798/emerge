# Emerge Phase 1 开发执行计划

## 目标

把白皮书中的「个人语义资产驾驶舱」落成一个可运行、可演示、可继续扩展的软件工程。

Phase 1 的关键不是做全量平台，而是证明一个用户每天愿意打开的资产入口：

- 文件进入系统后不只是被保存，而是变成可理解、可检索、可追溯、可操作的语义对象。
- 默认视图不是聊天，而是 Objects 操作台。
- AI 回答必须回到对象、证据、快照和操作历史。

## Must

- Objects 第一屏：Sources / Objects / Inspector / Pipeline 四区结构。
- 本地模拟数据驱动完整 UI 状态。
- 语义快照展示：summary、topics、entities、evidence、relations、actions。
- Pipeline 状态展示：queued、indexing、ready、partial、error。
- Ask Emerge 必须带证据引用和对象来源。
- 响应式布局：桌面优先，兼容窄屏。

## Should

- 支持对象过滤、搜索、排序、标签。
- 支持语义快照 JSON 导出。
- 支持 Trace Run 的最小展示。
- 支持本地 API 替换模拟数据。
- 支持性能预算与视觉回归测试。

## Later

- Tauri/Electron 桌面壳。
- S3-compatible 对象存储。
- 长期增量索引。
- 多 Agent 工作流编排。
- Inbox/自动导入/外部连接器。
- 图谱视图和跨对象推理。

## 建议技术路线

Phase 1 优先 Web App：

- Frontend：React + TypeScript + Vite。
- UI：Tailwind CSS + shadcn/ui + lucide-react。
- State：轻量本地状态，必要时再引入 Zustand。
- Data Contract：TypeScript interfaces + Zod schemas。
- Local API：Node/TypeScript 或 Python FastAPI 二选一，先按现有工程资产决定。
- Storage：mock JSON -> SQLite -> S3-compatible object store。

桌面化不要第一天进入主路径。先把 Web 体验做扎实，再加桌面壳。

## 开发批次

### Batch 1: 工程脚手架

- 初始化前端工程。
- 建立基础路由与布局。
- 建立设计 token、图标、基础组件。
- 建立 mock data。

验收：

- 本地 dev server 可启动。
- Objects 页面可访问。
- 没有空白屏、布局溢出、控制台错误。

### Batch 2: Objects 操作台

- 左侧 Sources。
- 中间 Object List。
- 右侧 Semantic Inspector。
- 底部 Pipeline Strip。

验收：

- 对象选择会刷新 Inspector。
- Pipeline 状态与对象状态一致。
- 长标题、长路径、空列表、错误状态都有处理。

### Batch 3: 语义快照与证据

- 展示 summary、topics、entities、evidence、relations。
- 加入 confidence、freshness、schema_version。
- 支持快照 JSON 查看或导出。

验收：

- 任一 AI 结论都能追到 evidence。
- partial snapshot 有清晰状态，不伪装成完整结果。

### Batch 4: Ask Emerge

- 建立问答输入区。
- 回答区展示引用对象、证据片段、置信度。
- 保留最小 Trace Run。

验收：

- 回答不是纯文本气泡，必须有证据侧栏或引用块。
- 无命中时给出可操作的下一步。

### Batch 5: API 与本地数据

- 用本地 API 替换 mock data。
- 建立 ingestion -> snapshot -> index -> query 的最小闭环。
- 保留 mock adapter 便于 UI 测试。

验收：

- 前端不依赖硬编码业务数据。
- API 数据异常时 UI 可降级。

## 不做

- 不在 Phase 1 追求完整知识图谱。
- 不先做插件市场、团队协作、云同步。
- 不把聊天框作为唯一入口。
- 不把 S3-compatible 存储作为第一批阻塞项。
