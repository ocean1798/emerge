# iter-002: 模型 Provider 与本地 API 基础

## 需求

### 解决的问题

Emerge 需要明确模型能力边界：embedding 走本地 Ollama，LLM 走 OpenAI-compatible API。DeepSeek 可以作为默认示例，但前端和未来 RAG 流程不应该直接耦合具体 provider，也不能把 API key 写进仓库。

### 本轮范围

- 建立 `server/` 本地 API 骨架。
- 建立 OpenAI-compatible chat provider。
- 建立 Ollama local embedding provider。
- 建立 `.env.example`，用环境变量承接 base_url、model、api_key。
- 暴露最小 API：health、ollama tags、embed、ask。
- 在文档中明确 secret 管理规则。

### 验收标准

- [x] `server/.env.example` 存在，且不包含真实 API key。
- [x] `server/src/config.js` 从 `.env` / `.env.local` 读取配置。
- [x] `GET /api/health` 不泄露 secret，只返回 key 是否配置。
- [x] `POST /api/embed` 通过 Ollama `/api/embed` 调用本地 embedding。
- [x] `POST /api/ask` 通过 OpenAI-compatible `/chat/completions` 调用 LLM。
- [x] `npm run health` 可以输出 provider 配置状态。

### 不做的事

- 不在仓库中保存真实 LLM API key。
- 不在本轮实现完整 RAG 索引。
- 不把前端 Ask UI 接入真实后端。
- 不假设用户本机具体 embedding 模型名。
- 不自动启动或修复 Ollama 桌面服务。

### 依赖

- OpenAI-compatible API 参考：`https://platform.openai.com/docs/api-reference/chat/create`
- DeepSeek API 文档：`https://api-docs.deepseek.com/`
- Ollama API 文档：`https://docs.ollama.com/api`
- 前置迭代：`iter-001-objects-first-screen`

## 开发笔记

> 2026-06-14 口径补充：本轮完成的是 OpenAI-compatible 适配器和调用路径，不代表当前环境的真实 LLM 已连通。真实连通性以后续 `iter-008` 的 `/api/llm/test` 为准。

### 技术方案

本轮用 Node 原生 `http` 和 `fetch` 建立轻量本地 API，避免为了 provider 骨架引入 Express、OpenAI SDK 或 dotenv。配置由 `.env.local` 注入，公开 health 只返回 `apiKeyConfigured`，不返回真实密钥。

LLM 使用 OpenAI-compatible `/chat/completions`，配置项统一为 `OPENAI_*`。Ollama 使用 `/api/embed`，embedding 模型名由 `OLLAMA_EMBED_MODEL` 指定。

### 涉及文件

- `server/.env.example` — 本地配置模板。
- `server/package.json` — 本地 API 命令。
- `server/src/config.js` — 环境变量读取与公开配置。
- `server/src/http.js` — JSON 请求/响应工具。
- `server/src/providers/openai-compatible.js` — 通用 OpenAI-compatible chat provider。
- `server/src/providers/ollama.js` — Ollama embedding provider。
- `server/src/index.js` — 本地 API 路由。
- `server/src/health.js` — provider 配置检查。
- `server/README.md` — 使用方式与 secret 规则。

### 设计决策

| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| Secret 管理 | `.env.local` | 可本地运行，但不入库 |
| LLM 接口 | OpenAI-compatible | DeepSeek、OpenAI、兼容服务都能接 |
| Ollama 接口 | Local `/api/embed` | embedding 本地化，符合本地优先 |
| Server 框架 | Node 原生 API | 先降低依赖，等路由复杂后再引框架 |
| Provider 输出 | 标准 JSON | 方便前端和未来 RAG adapter 替换 |

### 注意事项

- 用户提供过真实 API key，但不得写进版本库。
- 当前 Ollama 本机服务探测失败，表现为已有实例/日志锁，但 `localhost:11434` 未响应；后续需要用户确认 Ollama 服务已启动，并填入具体 embedding 模型名。
- `.env.example` 中的 `embeddinggemma` 只是默认占位，后续以本机 `ollama list` 为准。
- iter-003 已将 LLM provider 从 DeepSeek 专用命名重构为 OpenAI-compatible 通用命名，DeepSeek 只是默认示例。

### 验证记录

| 项目 | 结果 |
|------|------|
| OpenAI-compatible 配置模板 | PASS：base URL、chat path、model 已写入 `.env.example` |
| Secret 入库检查 | PASS：真实 API key 未写入文件 |
| Ollama 探测 | WARN：当前 `localhost:11434` 未响应 |
| Provider health | PASS：`npm run health` 正常输出 provider 配置状态 |
| Local API health | PASS：`GET http://127.0.0.1:8787/api/health` 正常返回 |
| Runtime model call | PENDING：等待本地 `.env.local` 写入 key，并确认 Ollama embedding 模型名 |
