# 开发计划

## 任务清单

| # | 任务 | 状态 | 开发ID | 测试ID(S) | 迭代次数 | 备注 |
|---|------|------|--------|-----------|----------|------|
| 0 | 项目目录与开发文档 | ✅ | - | - | - | 建立长期工程目录和开发文档 |
| 1 | 技术栈与工程脚手架确认 | ✅ | - | - | - | React + TypeScript + Vite，Web 优先，桌面壳后置 |
| 2 | Objects 第一屏静态骨架 | ✅ | - | - | - | 左 Sources，中 Objects，右 Inspector，底部 Pipeline |
| 3 | 语义资产数据契约 | ✅ | - | - | - | Asset、SemanticSnapshot、Trace、Pipeline |
| 4 | 本地模拟数据与状态流 | ✅ | - | - | - | 支持 ready/indexing/error/partial/stale/queued |
| 5 | Ask Emerge 与证据面板 | ✅ | - | - | - | 已接本地 /api/ask，支持 local-retrieval fallback 与 citations；OpenAI-compatible 适配器已具备但不等于 LLM 已连通 |
| 6 | 本地 API 与索引闭环 | ✅ | - | - | - | 已接 JSON store、chunks、词法检索与可选 Ollama embedding |
| 7 | UI 视觉精修与响应式验证 | ✅ | - | - | - | Playwright 已验证桌面/移动截图 |
| 8 | 集成测试与演示包 | ✅ | - | - | - | 已有导入、笔记、Ask RAG、快照导出和一键启动诊断烟测 |
| 9 | LLM 连接诊断与 MVP 验收口径 | ✅ | - | - | - | 已新增 /api/llm/test 与 Header LLM 状态；真实 LLM 接入必须诊断通过 |
| 10 | 产品内模型配置入口 | ✅ | - | - | - | 已新增 OpenAI-compatible 设置弹窗和运行时 /api/llm/config，保存后自动测试 |
| 11 | 本地对象删除 | ✅ | - | - | - | 已新增 DELETE /api/assets/:id、删除按钮和 CORS preflight 修复 |
| 12 | URL 捕获入口 | ✅ | - | - | - | 已新增 URL 捕获弹窗，URL 进入同一语义对象/Ask/删除管线 |
| 13 | URL 网页正文抓取 | ✅ | - | - | - | 已新增 /api/url/fetch 与 URL 捕获弹窗抓取预览 |
| 14 | 本地对象元数据编辑 | ✅ | - | - | - | 已新增 PATCH /api/assets/:id 与标题/标签编辑弹窗 |
| 15 | 全局语义搜索入口 | ✅ | - | - | - | 已新增 Objects 搜索框 evidence 结果带，复用 /api/search 并支持点击打开对象 |
| 16 | 模型 Provider 设置持久化 | ✅ | - | - | - | 已将 baseUrl/model/providerLabel/chatPath 保存到 local-data/settings.json，API key 仍 runtime-only |
| 17 | 对象内容预览 | ✅ | - | - | - | 已新增 GET /api/assets/:id/preview 与 Inspector 内容预览模块 |
| 18 | LLM 与本地 Embedding 配置加固 | ✅ | - | - | - | chatPath 可留空并自动默认；Ollama embedding 可在产品内配置、测试并自动选择本机 embedding 模型 |
| 19 | Trace / 操作历史 | ✅ | - | - | - | 已新增对象级 trace UI，记录 ingest/pipeline、metadata、search、ask |
| 20 | AI 文件管理和批量导入 | ⏳ | - | - | - | 拖拽导入、多文件导入、失败摘要 |
| 21 | Embedding 状态和重建索引 | ⏳ | - | - | - | index status、单对象/全局 reindex、stale 状态 |
| 22 | 原始内容存储和预览 | ⏳ | - | - | - | SourceDocument、Original Source、Indexed Chunks 区分 |
| 23 | Ask/Search History | ⏳ | - | - | - | AskRun/SearchRun 与 History 面板 |
| 24 | 桌面壳和 Keychain | ⏳ | - | - | - | Tauri/桌面方案与安全 keychain，可按资源后置 |
| 25 | MVP Hardening Release | ⏳ | - | - | - | 回归、文档、截图、secret scan、已知问题 |

状态： ⏳ 待办 | 🔄 进行中 | ✅ 完成 | ⚠️ 低质量通过
