# iter-004: 本地文件导入与语义对象闭环

## 需求

### 解决的问题

当前产品已经有 Objects 操作台、i18n 和 Ask 入口，但仍像一个可点击原型：对象主要来自 mock data，用户无法把自己的文件真正放进系统。本轮要先跑通最小本地文件导入闭环，让 Emerge 从“看起来像驾驶舱”进入“能吃进用户资产”的阶段。

### 本轮范围

- 顶部提供本地文件导入入口。
- 支持 `.txt`、`.md`、`.json`、`.csv`、`.html` 等文本类文件。
- 前端读取文件内容后调用本地 `POST /api/ingest`。
- 后端写入 `server/local-data/store.json`。
- 导入后生成 `Asset`、`SemanticSnapshot`、`Evidence` 和 `PipelineRun`。
- 前端启动时从 `GET /api/assets` 载入已导入对象，并和 seed mock data 合并展示。
- 导入成功后自动选中新对象，并展示证据与 pipeline。
- LLM 配置保持 OpenAI-compatible 通用格式：`OPENAI_BASE_URL`、`OPENAI_API_KEY`、`OPENAI_MODEL`、`OPENAI_CHAT_PATH`。

### 验收标准

- [x] 点击顶部导入按钮能打开本地文件选择器。
- [x] 选择 Markdown 文件后，Objects 列表出现新对象。
- [x] 新对象的 Inspector 有 summary、topics、entities、evidence。
- [x] Pipeline Strip 出现 ingest、parse、snapshot、index、verify 5 个步骤。
- [x] 刷新页面后，本地导入对象可从 `GET /api/assets` 恢复。
- [x] `OPENAI_*` 配置可接 OpenAI 官方、DeepSeek 或其他 OpenAI-compatible 服务。

### 不做的事

- 不在本轮做二进制文件解析。
- 不在本轮做真实 embedding index。
- 不在本轮做 SQLite 或 S3-compatible 存储。
- 不提交真实 API key。

### 依赖

- 前置迭代：`iter-001-objects-first-screen`
- 前置迭代：`iter-002-model-provider-foundation`
- 前置迭代：`iter-003-i18n-and-ask-hookup`

## 开发笔记

### 技术方案

本轮采用浏览器 `File.text()` 读取文本类文件，前端只负责把内容交给本地 API；对象生成、快照生成、pipeline run 和持久化由 server 负责。存储先用 JSON 文件，便于快速验证数据契约，后续可替换为 SQLite 与向量索引。

模型 provider 使用 OpenAI-compatible chat completions 形状。DeepSeek 只是一个配置实例，不作为代码分支；OpenAI 官方或其他兼容服务通过同一组 `OPENAI_*` 环境变量接入。

### 涉及文件

- `app/src/components/ShellHeader.tsx` — 顶部导入按钮和隐藏文件输入。
- `app/src/api/client.ts` — `GET /api/assets` 与 `POST /api/ingest` client。
- `app/src/App.tsx` — 本地资产加载、导入状态和对象合并。
- `server/src/store.js` — 本地 JSON store 与 ingest record 生成。
- `server/src/index.js` — assets、snapshot、pipeline、ingest API。
- `server/src/config.js` — OpenAI-compatible 通用配置读取。
- `server/src/providers/openai-compatible.js` — 通用 chat completions provider。
- `docs/DATA-CONTRACTS.md` — provider health 与 API 契约补充。

### 设计决策

| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| 导入读取 | Browser `File.text()` | 先支持文本资产，最小可用且不需要桌面权限 |
| Store | `server/local-data/store.json` | 快速形成真实本地闭环，目录已 gitignore |
| 快照生成 | 规则生成 summary/topics/evidence | 先验证 UX 与数据形状，后续替换为模型/检索流水线 |
| LLM 配置 | `OPENAI_*` | API key 与 base URL 使用通用 OpenAI-compatible 格式 |
| Mock data | 保留并和本地数据合并 | 保证无 API 或空 store 时仍有可演示界面 |

### 验证记录

| 项目 | 结果 |
|------|------|
| 前端构建 | PASS：`npm run build` |
| Server ingest | PASS：`POST /api/ingest` 返回 asset/snapshot/pipelineRun |
| 浏览器导入烟测 | PASS：导入 Markdown 后出现对象、证据和 5 步 Pipeline |
| 截图 | `artifacts/iter-004-local-import.png` |
