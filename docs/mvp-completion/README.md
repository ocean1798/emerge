# Emerge MVP Completion Handoff

本文档夹是后续完成 MVP 的交接包。目标读者包括 Codex、Claude Code、DeepSeek GUI、Cursor 或其它能力较弱的模型。后续开发时，优先读这里的文档，不要从历史聊天记录里恢复上下文。

## 先读顺序

1. `00-HANDOFF-CONTEXT.md`
2. `01-PRD-MVP-COMPLETION.md`
3. `02-IMPLEMENTATION-SPEC.md`
4. `03-ITERATION-PLAN.md`
5. `04-TEST-PLAN.md`
6. `05-API-CONTRACTS.md`
7. `06-UI-VISUAL-SPEC.md`
8. `07-WEAK-MODEL-RUNBOOK.md`
9. `08-KNOWN-ISSUES.md`

如果上下文很短，只读：

1. `00-HANDOFF-CONTEXT.md`
2. 当前要做的 `iterations/iter-NNN-*/ITER.md`
3. `04-TEST-PLAN.md`
4. `08-KNOWN-ISSUES.md`

## 当前产品一句话

Emerge 是一个本地优先的个人语义资产驾驶舱。它不是普通聊天工具，而是 AI 时代的新文件管理入口：文件、URL、笔记进入系统后，会变成可检索、可提问、可追踪、可操作的语义对象。

## 当前工程入口

- 项目根目录：`dev/web/emerge/`
- 前端：`dev/web/emerge/app/`
- 本地 API：`dev/web/emerge/server/`
- 数据文件：`dev/web/emerge/server/local-data/`
- 迭代文档：`dev/web/emerge/iterations/`
- 临时测试脚本：`test-temp/emerge/`

## 当前已完成到哪里

已完成到 `iter-023`：

- Objects 三栏工作台和底部 Pipeline。
- i18n，默认简体中文，支持英文。
- 本地 API 和 JSON store。
- 文件导入、笔记创建、URL 捕获和网页正文抓取。
- OpenAI-compatible LLM 配置、诊断和 Ask。
- Ollama embedding 配置、诊断、自动选择本机 embedding 模型。
- 词法检索 + 可选向量混合检索。
- 对象删除、元数据编辑、全局语义搜索、索引内容预览。
- Trace / 操作历史。
- AI 文件管理和批量导入（拖拽、多文件、失败摘要）。
- Embedding 状态和重建索引（单对象/全局 reindex）。
- 原始内容存储和预览。
- Ask/Search 操作历史。
- 桌面壳和 Keychain（Tauri 框架已集成）。

## MVP 当前状态

MVP 已进入 Hardening Release 阶段（`iter-024`）。核心功能已完成，正在进行：

- 回归测试
- 文档更新
- 截图更新
- Secret scan
- 已知问题整理

## 已知问题

详见 `08-KNOWN-ISSUES.md`。主要限制：

1. API key 需要每次启动时重新输入
2. URL 抓取仅支持公开静态页面
3. 原始内容预览仅显示索引片段
4. 桌面应用尚未打包
5. Embedding 需要本地安装 Ollama

## 后续迭代顺序

- `iter-018-trace-history` ✅
- `iter-019-ai-file-manager-bulk-ingest` ✅
- `iter-020-embedding-reindex-status` ✅
- `iter-021-original-content-storage` ✅
- `iter-022-ask-search-history` ✅
- `iter-023-desktop-shell-keychain` ✅
- `iter-024-mvp-hardening-release` 🔄

## 必须遵守

- 不要把真实 API key 写入源码、README、截图、settings 或测试脚本。
- `server/local-data/settings.json` 只能保存非敏感 provider 配置。
- API key 只允许存在于 `.env.local` 或当前本地 API 进程内存。
- 每次开发只做一个迭代，先读该迭代的 `ITER.md`。
- 做完必须跑 `npm run typecheck`、相关 smoke test，并更新 `dev-plan.md` 和 `ITERATION.md`。

## 外部参考

- Ollama API: https://github.com/ollama/ollama/blob/main/docs/api.md
- DeepSeek API: https://api-docs.deepseek.com/
- Tauri 2 Docs: https://v2.tauri.app/
- gbrain: https://github.com/garrytan/gbrain
