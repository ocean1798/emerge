# iter-008: LLM 连接诊断与 MVP 验收口径

## 需求

### 解决的问题
当前 Ask 已具备本地检索与 OpenAI-compatible 适配器，但未配置 `OPENAI_API_KEY` 时实际返回的是 `local-retrieval` 兜底，不能被表述为 MVP 已完成真实 LLM 接入。本轮要把“适配器存在”和“LLM 已连接”拆开，让产品界面与文档都能明确显示真实状态。

### 验收标准
- [x] 后端提供 `POST /api/llm/test`，用于发起真实 OpenAI-compatible chat 连通性测试。
- [x] 未配置 `OPENAI_API_KEY` 时，诊断返回 `missing_key`，不误报成功。
- [x] 前端 Header 展示 LLM 状态：待测试、未配置、测试中、已连接、异常。
- [x] 点击 LLM 状态能触发诊断，并在 notice bar 给出明确反馈。
- [x] MVP 文档口径修正为：RAG fallback 已可用，真实 LLM 接入必须通过诊断。

### 不做的事
- 不把真实 API key 写入仓库。
- 不在本轮实现多 provider UI、密钥管理界面或会话记忆。
- 不把 `local-retrieval` 兜底伪装成模型输出。

### 依赖
- 前置：iter-005 混合检索与 Ask 证据引用。
- 前置：iter-007 本地 API 状态诊断。

## 开发笔记

### 技术方案
后端复用现有 OpenAI-compatible provider，新增最小连接测试函数和 `/api/llm/test` 路由。前端在 Header 追加独立 LLM 状态按钮，初始化时根据 `/api/health` 判断 key 是否存在，点击后调用诊断端点。

### 涉及文件
- `server/src/providers/openai-compatible.js` — 新增最小 LLM 连接测试。
- `server/src/index.js` — 新增 `POST /api/llm/test`。
- `app/src/api/client.ts` — 新增 LLM 诊断客户端。
- `app/src/App.tsx` — 管理 LLM 状态与 notice。
- `app/src/components/ShellHeader.tsx` — 展示可点击的 LLM 状态。
- `app/src/i18n.tsx` — 新增中英文 LLM 状态文案。
- `app/src/styles.css` — 新增 LLM 状态 chip 视觉。
- `dev-plan.md`、`server/README.md`、`docs/DATA-CONTRACTS.md`、`docs/TESTING.md`、`app/README.md` — 修正 MVP 接入口径。

### 设计决策
| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| LLM 诊断入口 | `POST /api/llm/test` | 会触发外部模型调用，语义上不是只读健康检查 |
| 状态展示 | Header 独立 LLM chip | 与 API 连接状态并列，避免用户把 API 在线误解为 LLM 在线 |
| 无 key 行为 | 返回 `missing_key` | 明确指出未配置，而不是抛通用错误 |
| MVP 口径 | “适配器已具备，真实接入需诊断通过” | 对产品进度更诚实，也便于后续验收 |

### 注意事项
- `OPENAI_API_KEY` 只允许进入 `server/.env.local`，不得写进源码、文档或截图。
- `/api/ask` 仍允许无 key 时返回本地检索摘要，这是产品可用性兜底，不等于 LLM 接入完成。

### 验证记录
| 检查 | 结果 |
|------|------|
| 前端构建 | PASS：`npm run build` |
| 后端语法 | PASS：`node --check src/index.js`、`node --check src/providers/openai-compatible.js` |
| 无 key 诊断 | PASS：`POST /api/llm/test` 返回 `missing_key` |
| Header smoke | PASS：`test-temp/emerge/llm-status-smoke.py` |
| 视觉截图 | `artifacts/iter-008-llm-status.png` |
