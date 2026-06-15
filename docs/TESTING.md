# 测试与验收

## 测试层级

### Contract Tests

验证 mock data、本地 API 和前端类型是否一致。

重点：

- Asset 状态枚举。
- SemanticSnapshot 必填字段。
- Evidence 引用完整性。
- PipelineRun 步骤状态。
- 本地 API 健康状态。

### Component Tests

验证核心 UI 组件：

- ObjectRow
- SourceNav
- SemanticInspector
- PipelineStrip
- EvidenceList
- AskPanel

### E2E Tests

验证主路径：

1. 打开 Objects 页面。
2. 选择一个 ready 对象。
3. 查看语义快照和证据。
4. 导入一个本地 Markdown 或文本文件。
5. 检查新对象、证据、内容预览和 5 步 Pipeline 都出现。
6. 调用 `GET /api/assets/:asset_id/preview`，检查返回 chunks、来源和索引统计。
7. 发起 Ask。
8. 检查回答中包含 `Local Retrieval` 或模型 provider，并展示 citation 卡片。
9. 新建一条笔记，检查 Notes 来源计数增加。
10. 捕获一个 URL，点击抓取正文，检查 URLs 来源计数增加，且对象 kind 为 `url`。
11. 编辑刚创建的本地对象标题和标签，检查列表与 API store 同步更新。
12. 在 Objects 搜索框输入刚创建对象正文中的关键词，检查出现 evidence 级语义搜索结果。
13. 点击语义搜索结果，检查能打开对应对象并刷新右侧语义检查器。
14. 删除刚创建的本地笔记或 URL，检查列表、快照和索引不再保留该对象。
15. 导出当前对象 snapshot，检查下载 JSON 包含对象标题。
16. 检查 Header 显示 API 连接状态。
17. 打开 Header 模型设置，检查 OpenAI-compatible 与 Ollama embedding 字段可见。
18. 清空 `Chat Path` 后保存，检查后端自动默认到 `/chat/completions`，且不会出现保存失败。
19. 保存模型设置后，检查进入 Embedding / LLM 测试反馈而不是保存失败。
20. 检查 provider 与 embedding 设置写入 `server/local-data/settings.json`，且 settings 文件不包含 `apiKey`、`OPENAI_API_KEY` 或 `sk-`。
21. 点击 Header 的 LLM 状态，检查未配置时显示 `LLM 未配置`，配置 key 后显示 `LLM 已连接`。
22. 查看 Pipeline 状态。

### Visual Checks

必须覆盖：

- 桌面宽屏。
- 普通笔记本。
- 窄屏。
- 长标题。
- 长路径。
- 空列表。
- error/partial/stale 状态。

## 性能预算

前端首批目标：

- 1000 个对象列表仍能流畅滚动。
- 首屏加载不超过 2 秒。
- Inspector 切换不超过 200ms。
- Ask loading 状态必须即时反馈。

## 验收门槛

- 没有空白屏。
- 没有明显文本重叠。
- 没有控制台红色错误。
- AI 输出必须有证据引用或明确标记为推断。
- partial/error 数据不会被 UI 误展示为 ready。
- MVP 不能把 `local-retrieval` 兜底描述为真实 LLM 接入；LLM 接入必须通过 `/api/llm/test`。
- 模型设置不得回显真实 API key；普通本地 settings 文件只能保存 provider 非敏感字段。
- 本地 embedding 接入必须能通过 `/api/ollama/test` 返回模型名和向量维度；Ollama 不可用时必须明确回退到词法检索。
- 打开 `http://127.0.0.1:5173/` 后必须能通过 `test-temp/emerge/api-connected-model-settings-smoke.py` 验证 API 在线，且模型设置保存路径不会被旧的 offline 状态阻断。
- 删除本地对象后，Ask 检索不能再返回该对象的 citations。
- URL 抓取失败时不能阻塞手动保存；抓取成功时正文必须进入后续 Ask 证据。
- 本地对象重命名后，搜索/引用展示不应继续使用旧标题。
- 语义搜索结果必须展示 evidence 片段，不能只等同于对象标题过滤。
- 内容预览必须明确展示索引片段，不能把它描述成完整原文阅读器。
