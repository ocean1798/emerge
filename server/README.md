# Emerge Local API

本地 API 与模型 provider 目录。

当前先接入两类模型能力：

- OpenAI-compatible：LLM / Ask Emerge。DeepSeek、OpenAI 或其他兼容服务都可通过同一组配置接入。
- Ollama：本地 embedding，使用 `POST /api/embed`。

## 本地配置

复制 `.env.example` 为 `.env.local`，填入本机配置。

不要提交 `.env.local`，也不要把 API key 写进 README、PRD 或源码。

```bash
cp .env.example .env.local
```

关键配置统一使用 OpenAI-compatible 格式。`OPENAI_API_KEY` 不等于只能接 OpenAI 官方服务，它表示使用 `Authorization: Bearer <key>` 的通用 chat API 形状。

```text
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=replace_with_your_openai_compatible_api_key
OPENAI_MODEL=your_openai_chat_model
OPENAI_PROVIDER_LABEL=OpenAI-compatible
OPENAI_CHAT_PATH=/chat/completions
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=embeddinggemma
```

DeepSeek 作为 OpenAI-compatible provider 接入时，只需要替换这几项：

```text
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_API_KEY=replace_with_your_openai_compatible_api_key
OPENAI_MODEL=deepseek-v4-flash
OPENAI_PROVIDER_LABEL=DeepSeek
OPENAI_CHAT_PATH=/chat/completions
```

`OLLAMA_EMBED_MODEL` 请改成本机已安装的 embedding 模型名。

## 命令

```bash
npm run health
npm run dev
```

服务地址：

```text
http://127.0.0.1:8787
```

## API

```text
GET  /api/health
GET  /api/assets
GET  /api/assets/:asset_id/snapshot
GET  /api/assets/:asset_id/preview
GET  /api/pipeline/runs?asset_id=:asset_id
GET  /api/search?q=:query&asset_id=:asset_id
GET  /api/ollama/tags
POST /api/embed
POST /api/ollama/test
POST /api/url/fetch
POST /api/llm/config
POST /api/llm/test
POST /api/ask
POST /api/ingest
PATCH /api/assets/:asset_id
DELETE /api/assets/:asset_id
```

`POST /api/llm/config` 可更新 OpenAI-compatible 与 Ollama embedding 配置。它接受 `baseUrl`、`providerLabel`、`model`、可选 `chatPath`、可选 `apiKey`、`embeddingBaseUrl`、`embeddingModel`。`chatPath` 可留空，默认使用 `/chat/completions`；如果 `baseUrl` 已包含完整 `/chat/completions`，后端会自动拆分。响应只返回脱敏后的 provider 状态，不返回真实 key。非敏感设置会保存到 `server/local-data/settings.json`；`apiKey` 只进入当前本地 API 进程。

`POST /api/llm/test` 是真实 LLM 连通性诊断。未配置 `OPENAI_API_KEY` 时返回 `missing_key`；配置后会发起一次最小 OpenAI-compatible chat 请求，成功后返回 `connected`。

`POST /api/ask` 会先检索本地 store。未配置 `OPENAI_API_KEY` 时返回 `local-retrieval` 摘要和 citations；配置后会把同一批 evidence 交给 OpenAI-compatible LLM 生成回答。

MVP 口径：`local-retrieval` 是本地 RAG 兜底，不代表 LLM 已接入。只有 `/api/llm/test` 返回 `connected`，才能认为 OpenAI-compatible LLM 已连通。

产品内“模型设置”使用 `/api/llm/config`。重启 API 后 provider 设置会从 `local-data/settings.json` 恢复；API key 仍会回到 `.env.local` / 环境变量状态，或需要用户在产品内重新填入。后续如需长期保存 key，应单独接入 OS keychain 或加密本地密钥库。

`POST /api/ollama/test` 会用当前 Ollama embedding 模型做一次真实向量请求，并返回模型名和向量维度。本机默认模型不可用时，后端会优先从 `/api/tags` 里选择名称包含 `embedding` / `embed` 等关键词的模型。

`POST /api/ingest` 会生成可检索 chunks。Ollama 可用时写入 embedding，Ollama 不可用时保留词法索引，产品仍可运行。

`GET /api/assets/:asset_id/preview` 返回当前对象进入索引的内容片段、来源和索引统计。它是 MVP 的索引预览，不是完整原文阅读器。

`POST /api/url/fetch` 会抓取公开 `http` / `https` 网页并抽取标题和正文文本。当前实现是 MVP 级启发式 HTML 抽取，适合普通公开文章；登录页、反爬页面和需要 JS 渲染的页面后续再单独增强。

`PATCH /api/assets/:asset_id` 更新本地对象标题和标签，并同步 chunks title。它不修改正文内容，不会重跑完整语义抽取。

`DELETE /api/assets/:asset_id` 只删除本地 store 中的对象，并同步清理 snapshot、pipeline runs 和 chunks。内置前端 mock 示例不在本地 store 中，因此不会被这个 API 删除。

## 后续职责

- ingest files / urls / notes
- parse content
- build semantic snapshots
- maintain local store
- maintain hybrid search index
- answer questions with cited evidence
- record traces
