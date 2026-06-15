# iter-017 LLM 与本地 Embedding 配置加固

## 需求

### 解决的问题

- 模型设置里的 `Chat Path` 被前端强制必填，导致 OpenAI-compatible provider 的常见配置路径不够宽容。
- 本地 Ollama embedding 只有后端环境变量入口，产品内没有明确配置和测试反馈。
- 当本机实际安装的 embedding 模型名与默认值不同，检索会静默回退到词法检索，用户误以为 embedding 没接入。
- 本地 API 未启动时，LLM 测试会提示离线；需要明确区分“API 未连接”“LLM key 未配置”“Embedding 不可用”。

### 验收标准

- `Chat Path` 可留空，保存后自动默认到 `/chat/completions`。
- 如果用户把完整 chat endpoint 填进 `Base URL`，后端会拆成 base URL + 默认 chat path。
- 模型设置弹窗包含 OpenAI-compatible LLM 与 Ollama embedding 两段配置。
- `/api/ollama/test` 可以用当前 embedding 模型做真实连通性诊断。
- 当默认 embedding 模型不存在时，后端优先自动选择本机 Ollama 模型列表中带 `embedding` / `embed` 等关键词的模型。
- API key 仍只进入当前本地 API 进程，不写入 `local-data/settings.json`。

### 不做的事

- 不在本迭代接入 OS keychain 或本地加密密钥库。
- 不做完整模型市场 / 模型下载管理。
- 不把 LLM 测试成功作为没有真实网络条件下的强制门槛。

### 依赖

- 本地 API：`http://127.0.0.1:8787`
- Ollama：`http://localhost:11434`
- 前端：`http://127.0.0.1:5173`

## 开发笔记

### 技术方案

- 后端配置层新增 OpenAI-compatible endpoint 标准化：
  - `chatPath` 为空时使用 `/chat/completions`。
  - `baseUrl` 若以 `/chat/completions` 结尾，则自动拆出 base URL。
- `/api/llm/config` 同时保存 LLM provider 与 Ollama embedding 的非敏感设置。
- 新增 `/api/ollama/test`，通过最小 embedding 请求返回模型名和向量维度。
- Ollama provider 在 embedding 前读取 `/api/tags`，当前配置模型不存在时自动选择本机 embedding 候选。
- 前端模型设置弹窗新增本地 Embedding 配置字段，并去掉 `Chat Path` 必填。

### 涉及文件

- `server/src/config.js`
- `server/src/index.js`
- `server/src/providers/ollama.js`
- `app/src/api/client.ts`
- `app/src/App.tsx`
- `app/src/components/ModelSettingsModal.tsx`
- `app/src/i18n.tsx`
- `app/src/styles.css`
- `test-temp/emerge/model-settings-smoke.py`
- `test-temp/emerge/semantic-search-smoke.py`

### 验证记录

- `npm run typecheck`
- `npm run build`
- 临时 API 验证：
  - `POST /api/llm/config`：空 `chatPath` 返回 `/chat/completions`
  - `POST /api/ollama/test`：`qwen3-embedding:8b` 返回 4096 维向量
- `python test-temp\emerge\run-ui-smokes-with-api.py`
- API 启动回归验证：
  - `node scripts\dev.mjs --check`：`API OK`、`App OK`
  - `python test-temp\emerge\api-connected-model-settings-smoke.py`

### 设计决策

- API key 不落盘，继续保持 runtime-only。后续如果需要记住 key，应单独做 keychain 迭代。
- Ollama 模型自动选择只作为兜底，不取代用户显式配置。
- 模型设置页保留单弹窗，但以分区方式降低认知负担，避免过早拆多个配置页面。
