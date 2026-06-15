# Emerge Web App

Phase 1 前端应用。当前实现 Objects 第一屏：Sources、Objects、Semantic Inspector、Pipeline Strip。

## 技术栈

- React
- TypeScript
- Vite
- Tailwind CSS Vite plugin
- lucide-react

## 命令

```bash
npm install
npm run dev
npm run build
```

完整本地开发建议从上层目录运行：

```bash
cd ..
npm run dev
```

本地开发地址：

```text
http://127.0.0.1:5173
```

## 当前实现

- 8 个 mock 语义资产对象。
- 覆盖 ready、indexing、partial、error、stale、queued 状态。
- 对象点击后刷新右侧语义快照。
- 搜索、来源筛选、状态筛选。
- 搜索框会调用本地 `/api/search`，展示 evidence 级语义搜索结果并支持点击打开对象。
- 默认简体中文，支持切换 English。
- Header 展示本地 API 连接状态，便于判断导入、笔记和 Ask 是否可用。
- Header 展示独立 LLM 状态，可点击测试 OpenAI-compatible 模型是否真的连通。
- Header 齿轮入口可打开模型设置，填写 OpenAI-compatible provider 与 Ollama embedding 并保存后自动测试。
- 模型设置会持久化 provider 与 embedding 非敏感字段；`Chat Path` 可留空并默认到 `/chat/completions`；API key 只进入当前本地 API 进程。
- Ask 表单接入本地 `http://127.0.0.1:8787/api/ask`。
- 右侧 Inspector 展示模型回答、引用证据、加载状态和错误提示。
- 右侧 Inspector 展示内容预览，能看到当前对象进入索引的文本片段。
- 未配置 `OPENAI_API_KEY` 时，Ask 使用本地检索摘要兜底；这不是 LLM 接入完成状态。
- 模型设置中的 API key 只发送到本地 API 进程，不写入浏览器存储。
- 顶部导入按钮可选择本地文本/Markdown/JSON/CSV/HTML 文件，写入本地 API store。
- 导入后自动生成 Asset、SemanticSnapshot、Evidence 和 PipelineRun，并选中新对象。
- 顶部新建按钮可创建本地笔记，笔记作为 `note` 语义对象进入同一条索引/Ask 管线。
- 顶部链接按钮可捕获 URL、标题和备注；支持抓取公开网页正文，并作为 `url` 语义对象进入同一条索引/Ask 管线。
- 对象列表工具栏可编辑当前本地对象标题和标签，便于整理本地语义库。
- 对象列表工具栏可删除当前选中的本地导入对象、笔记或 URL，并同步清理语义快照和索引。
- Inspector 的导出动作可下载当前对象的 snapshot JSON。
- 桌面三栏布局与移动端堆叠布局。
- Playwright 烟测截图保存在 `../artifacts/`。

## 本地启动注意

在 `dev/web/emerge/app` 目录运行：

```powershell
npm run dev
```

也会委托到上层 `../scripts/dev.mjs`，同时启动本地 API 和前端。纯 Vite 启动脚本保留为：

```powershell
npm run dev:vite
```

`dev:vite` 会先检查 `http://127.0.0.1:8787/api/health`，如果 API 未启动会自动启动 `server`。上层统一启动器会通过 `EMERGE_VITE_AUTOSTART_API=0` 跳过这层，避免重复启动。
