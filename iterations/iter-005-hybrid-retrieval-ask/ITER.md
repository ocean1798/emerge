# iter-005: 混合检索与 Ask 证据引用

## 需求

### 解决的问题

iter-004 已经让文件能进入系统，但 Ask 仍主要依赖当前选中对象的前端 evidence，尚未形成“本地语义资产库可检索、可引用、可回答”的闭环。本轮要让 Emerge 具备最小 RAG 能力：导入对象后可被检索，Ask 自动带上相关证据；没有远程 LLM key 时也能返回本地检索摘要。

### 本轮范围

- Ingest 时生成可检索 chunks。
- Store 保存 `chunks`，并兼容旧 store。
- 新增 `GET /api/search?q=...&asset_id=...`。
- `POST /api/ask` 先检索本地 store，再调用 OpenAI-compatible LLM。
- 未配置 `OPENAI_API_KEY` 时返回 `local-retrieval` fallback，不再把 Ask 变成死入口。
- Ollama embedding 可用时写入向量；不可用时使用词法检索兜底。
- 前端 Ask 回答区展示 citations、检索模式和 embedding fallback 提示。

### 验收标准

- [x] 导入文本文件后，store 中生成 chunks。
- [x] `/api/search` 可命中导入内容。
- [x] 未配置 `OPENAI_API_KEY` 时，`/api/ask` 返回 `local-retrieval`、answer 和 citations。
- [x] 前端 Ask 回答区显示引用证据卡片。
- [x] Ollama 不可用时 UI 显示词法检索兜底说明。

### 不做的事

- 不在本轮引入 SQLite/向量数据库。
- 不做 reranker。
- 不做跨对象复杂推理图谱。
- 不提交真实 API key。

### 依赖

- 前置迭代：`iter-004-local-file-ingest`

## 开发笔记

> 2026-06-14 口径补充：本轮完成的是 RAG retrieval、citations 和有 key 时调用 LLM 的代码路径。无 key 时返回 `local-retrieval` 兜底，不代表真实 LLM 已接入。

### 技术方案

后端新增轻量 retrieval 层：先对 chunks 做词法打分；如果 chunk 和 query 都有 Ollama embedding，则混合 cosine similarity。`/api/ask` 统一走 retrieval，再根据 `OPENAI_API_KEY` 是否存在决定调用 OpenAI-compatible LLM 或返回本地检索摘要。

### 涉及文件

- `server/src/retrieval.js` — 词法/混合检索、local-retrieval fallback。
- `server/src/store.js` — chunks 生成与持久化。
- `server/src/index.js` — `/api/search`、Ask retrieval orchestration、ingest embedding enrich。
- `app/src/types/domain.ts` — Ask citations 类型。
- `app/src/api/client.ts` — Ask response retrieval/citations 字段。
- `app/src/components/SemanticInspector.tsx` — 引用证据卡片展示。
- `app/src/i18n.tsx`、`app/src/styles.css` — 文案与样式。

### 设计决策

| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| 检索底座 | JSON chunks | 保持 Phase 1 小闭环，后续可替换 SQLite/向量库 |
| fallback | local-retrieval | 没 key 也能工作，减少空壳感 |
| embedding | 可选 Ollama | 本地优先，Ollama 不可用时不阻断 |
| Ask 上下文 | retrieval + supplied context merge | 保留前端 evidence，同时补全本地库检索 |

### 验证记录

| 项目 | 结果 |
|------|------|
| 前端构建 | PASS：`npm run build` |
| 后端语法 | PASS：`node --check src/index.js`、`store.js`、`retrieval.js` |
| API RAG 烟测 | PASS：导入、搜索、Ask 返回 local-retrieval citations |
| 浏览器烟测 | PASS：导入后 Ask 显示 Local Retrieval 与 citation 卡片 |
| 截图 | `artifacts/iter-004-local-import.png` |
