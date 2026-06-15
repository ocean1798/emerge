# 00 Handoff Context

## 目的

这份文档给接手开发的模型快速建立上下文。它要回答：

- 这个产品是什么。
- 当前代码已经做到哪里。
- 下一个模型应该先做什么。
- 哪些事情绝对不能做。

## 产品定位

Emerge 是本地优先的个人语义资产驾驶舱。它融合了：

- Hermes / Claude Code 一类的工作流和操作感。
- DeepSeek GUI 一类的模型配置和本地工具入口。
- gbrain 一类的个人知识资产组织思路。
- 自带的混合检索增强生成：词法检索 + Ollama embedding + OpenAI-compatible LLM。

它不是聊天工具，也不是普通网盘。默认第一屏必须是 Objects 工作台。用户应该先看到自己的语义资产，再从对象进入 Ask、Trace、Action。

## 当前运行方式

在 `dev/web/emerge` 执行：

```powershell
npm run dev
```

这个命令应同时启动：

- App: `http://127.0.0.1:5173/`
- API: `http://127.0.0.1:8787/api/health`

健康检查：

```powershell
npm run dev:check
```

前端构建检查：

```powershell
cd dev/web/emerge/app
npm run typecheck
npm run build
```

UI smoke：

```powershell
python test-temp\emerge\run-ui-smokes-with-api.py
```

## 当前技术栈

- Frontend: React + TypeScript + Vite
- UI icons: lucide-react
- Local API: Node.js native `http`
- Store: JSON file in `server/local-data/store.json`
- Provider:
  - LLM: OpenAI-compatible chat API
  - Embedding: Ollama local embedding API

## 当前关键文件

- `app/src/App.tsx`: 总装页面和状态编排。
- `app/src/api/client.ts`: 前端 API client。
- `app/src/types/domain.ts`: 前端领域类型。
- `app/src/components/*`: UI 组件。
- `server/src/index.js`: API 路由。
- `server/src/config.js`: LLM/Ollama 配置。
- `server/src/store.js`: JSON store 和对象生命周期。
- `server/src/retrieval.js`: 检索和本地回答兜底。
- `server/src/providers/openai-compatible.js`: OpenAI-compatible LLM adapter。
- `server/src/providers/ollama.js`: Ollama embedding adapter。

## 当前已完成能力

### 对象入口

- 展示 Sources / Objects / Semantic Inspector / Pipeline 四区布局。
- 本地导入对象、笔记、URL 都进入统一对象列表。
- 对象支持状态、标签、来源、预览、删除、元数据编辑。

### 语义处理

- Ingest 生成 Asset、SemanticSnapshot、Evidence、PipelineRun。
- 内容切片进入 chunks。
- Ollama 可用时写入 embedding。
- Ollama 不可用时词法检索兜底。

### 检索和 Ask

- `GET /api/search` 支持全局语义搜索。
- `POST /api/ask` 先检索 evidence，再调用 OpenAI-compatible LLM。
- 未配置 API key 时返回 `local-retrieval`，但这不代表真实 LLM 已接通。

### 模型配置

- 产品内模型设置可配置：
  - `baseUrl`
  - `providerLabel`
  - `model`
  - 可选 `chatPath`
  - runtime-only `apiKey`
  - Ollama `embeddingBaseUrl`
  - Ollama `embeddingModel`
- `chatPath` 可留空，后端默认 `/chat/completions`。
- `/api/ollama/test` 可测试本地 embedding，当前机器可用模型为 `qwen3-embedding:8b`。

## 当前主要问题

1. Trace 只在底部 Pipeline 层表现，缺对象级操作历史。
2. 文件管理入口还像普通列表，缺 AI 文件系统感。
3. 批量导入、拖拽导入、文件夹导入还没有。
4. Reindex / embedding 状态不够清楚。
5. 原始内容没有作为一等对象保存，预览主要来自索引片段。
6. Ask/Search 操作没有形成历史记录。
7. 桌面壳和 keychain 没有落地。
8. 发布前测试门禁还不完整。

## 禁止事项

- 禁止在任何文件中写入真实 API key。
- 禁止把 `.env.local` 提交。
- 禁止把 `server/local-data/store.json` 当成最终稳定数据库设计。
- 禁止把 `local-retrieval` 文案包装成真实 LLM。
- 禁止做大规模无关重构。
- 禁止删除用户未要求删除的旧文档或截图。

## 后续模型最小工作流

1. 读 `docs/mvp-completion/README.md`。
2. 读当前迭代的 `iterations/iter-NNN-*/ITER.md`。
3. 搜索相关现有代码，不凭记忆改。
4. 小步实现。
5. 跑 typecheck、build 和相关 smoke。
6. 更新迭代文档和 `dev-plan.md`。
7. 写清楚完成了什么、没完成什么。
