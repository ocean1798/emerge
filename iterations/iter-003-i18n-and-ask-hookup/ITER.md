# iter-003: i18n 与 Ask 真实调用入口

## 需求

### 解决的问题

当前页面已经有 Objects 第一屏，但默认英文界面不适合当前使用场景，且 Ask 只是状态反馈，不是真正可用入口。本轮要让产品默认面向中文用户，同时让 Ask 调用本地 API，进入可测试闭环。

### 本轮范围

- 默认语言改为简体中文。
- 顶部支持中文 / English 切换。
- 语言选择保存到 `localStorage`。
- UI 静态文案迁移到轻量 i18n 字典。
- Ask 表单调用 `http://127.0.0.1:8787/api/ask`。
- 右侧 Inspector 展示模型回答、加载状态和错误提示。
- LLM provider 改为 OpenAI-compatible 通用格式，不再 DeepSeek 特化。

### 验收标准

- [x] 首次打开页面时 `document.documentElement.lang` 为 `zh-CN`。
- [x] 默认 UI 展示简体中文。
- [x] 点击 `EN` 后切换为英文，并持久化到本地。
- [x] Ask 提交会调用本地 `/api/ask`。
- [x] 未配置 `OPENAI_API_KEY` 时，页面显示可理解的错误与配置提示。
- [x] `server/.env.example` 使用 `OPENAI_*` 通用配置。
- [x] `GET /api/health` 返回 `openaiCompatible` provider。

### 不做的事

- 不提交真实 API key。
- 不在本轮完成真实 RAG 检索。
- 不在本轮实现文件导入。
- 不引入大型 i18n 框架。

### 依赖

- 前置迭代：`iter-001-objects-first-screen`
- 前置迭代：`iter-002-model-provider-foundation`

## 开发笔记

### 技术方案

前端用 React Context + typed dictionary 做轻量 i18n，避免在单页阶段引入过重依赖。后端 provider 使用 OpenAI-compatible chat completions 形状，默认 base URL 可以指向 DeepSeek，但命名、配置和 health 输出都保持通用。

### 涉及文件

- `app/src/i18n.tsx` — 轻量 i18n provider 与中英文词典。
- `app/src/api/client.ts` — 前端本地 API client。
- `app/src/App.tsx` — Ask 调用状态、语言状态、结果传递。
- `app/src/components/ShellHeader.tsx` — 语言切换与 Ask 表单。
- `app/src/components/SemanticInspector.tsx` — 模型回答区、错误区和动态内容本地化。
- `server/src/providers/openai-compatible.js` — 通用 OpenAI-compatible provider。
- `server/src/config.js` — `OPENAI_*` 配置读取。
- `server/.env.example` — 通用配置模板。

### 设计决策

| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| i18n 方案 | React Context + 字典 | 当前页面规模小，少引依赖更轻 |
| 默认语言 | 简体中文 | 符合当前用户场景 |
| LLM 配置 | `OPENAI_*` | DeepSeek、OpenAI、兼容服务都能接 |
| Ask 展示位置 | Semantic Inspector 顶部 | 回答必须贴着对象和证据，而不是孤立气泡 |
| API key | 只读 `.env.local` | 不泄露 secret |

### 验证记录

| 项目 | 结果 |
|------|------|
| 前端构建 | PASS：`npm run build` |
| Server health | PASS：`npm run health` |
| HTTP health | PASS：`GET /api/health` 返回 `openaiCompatible` |
| i18n 烟测 | PASS：默认 `zh-CN`，可切换 `en` |
| Ask 烟测 | PASS：未配置 key 时展示 `OPENAI_API_KEY` 配置提示 |
| 截图 | `artifacts/iter-003-i18n-ask-zh.png`、`artifacts/iter-003-i18n-en.png` |
