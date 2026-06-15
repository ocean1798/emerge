# iter-014: 全局语义搜索入口

## 需求

### 解决的问题

当前 Objects 搜索框只能按标题、路径和标签过滤列表，而 `/api/search` 已经具备 evidence 级检索能力。MVP 需要把“本地语义库可被检索”显性化：用户输入一个概念或关键词后，应能看到命中的证据片段，并从证据跳回对应对象。

### 验收标准

- [x] 前端搜索框输入内容后触发 `/api/search`。
- [x] Objects 主工作区展示语义搜索结果，而不只过滤对象标题。
- [x] 搜索结果展示 evidence label、quote、score、match type 和来源。
- [x] 点击搜索结果能打开对应对象，并更新右侧语义检查器。
- [x] API 离线、检索中、空结果、检索失败都有明确状态。
- [x] 搜索支持中简默认文案和英文切换。

### 不做的事

- 不新增独立搜索页面。
- 不做 rerank、query rewrite 或搜索历史。
- 不改变后端检索算法，本轮复用既有词法/混合检索。

### 依赖

- 前置：iter-005 混合检索与 Ask 证据引用。
- 前置：iter-007 本地 API 状态诊断。

## 开发笔记

### 技术方案

前端在 Objects 搜索输入上增加 debounce 语义检索：用户输入后仍保留原对象过滤，同时调用 `GET /api/search?q=...&limit=8`，在对象列表上方展示紧凑 evidence 结果带。结果点击后切换到对应 asset，并把来源/状态筛选重置为全部，保证右侧 Inspector 能展示对象语义快照。

### 涉及文件

- `app/src/api/client.ts` — 新增 `searchLocalEvidence`。
- `app/src/types/domain.ts` — 补充 `SearchResult` / `SearchStatus`。
- `app/src/App.tsx` — 新增 debounce 搜索状态和结果跳转。
- `app/src/components/ObjectList.tsx` — 新增语义搜索结果带。
- `app/src/i18n.tsx` — 新增中英搜索文案。
- `app/src/styles.css` — 新增紧凑搜索结果样式。
- `test-temp/emerge/semantic-search-smoke.py` — 新增 UI smoke。

### 设计决策

| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| 入口 | 复用 Objects 搜索框 | 搜索是文件管理入口的核心动作，不额外制造页面分叉 |
| 展示 | 结果带而非大卡片 | 保持工作台信息密度，避免压缩对象列表和 Inspector |
| 跳转 | 点击 evidence 打开对象 | 用户检索的下一步通常是查看对象语义快照或继续 Ask |
| 算法 | 复用 `/api/search` | 本轮目标是产品可用性，不扩大后端检索复杂度 |

### 注意事项

- 当前搜索结果和对象过滤共享一个输入框；输入命中正文但不命中标题时，结果带仍可打开对象，后续可考虑把“对象过滤”和“语义搜索”做成显式分段模式。
- 单字中文查询可能因后端 tokenizer 规则命中较弱，后续如要强化中文检索，应调整 tokenizer 或接入更稳定的 embedding 模型。

### 验证记录

| 检查 | 结果 |
|------|------|
| 前端构建 | PASS：`npm run build` |
| UI smoke | PASS：`test-temp/emerge/semantic-search-smoke.py` |
| 视觉截图 | `artifacts/iter-014-semantic-search.png` |
