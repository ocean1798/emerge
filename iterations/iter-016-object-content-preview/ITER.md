# iter-016: 对象内容预览

## 需求

### 解决的问题

Objects 已经能导入文件、笔记和 URL，并能通过 Ask / Search 使用证据，但右侧详情主要展示语义摘要和 evidence。用户仍缺少一个直接确认“系统到底读进了什么”的入口。MVP 需要在对象详情里展示可读的索引内容片段，让语义资产驾驶舱不只像列表，也像 AI 时代的文件管理入口。

### 验收标准

- [x] 后端提供 `GET /api/assets/:asset_id/preview`。
- [x] 预览返回 asset 来源、类型、索引片段数量、索引字符数和 chunks。
- [x] 预览不承诺完整原文阅读器，只展示当前进入索引的内容片段。
- [x] 右侧 Inspector 增加“内容预览”模块。
- [x] 本地对象优先读取 API 预览；mock 示例使用 snapshot evidence fallback。
- [x] 预览加载、空状态、错误状态有文案。
- [x] 新增 smoke 验证 UI 预览和 API preview endpoint。

### 不做的事

- 不做完整 Markdown/HTML 阅读器。
- 不做二进制文件、PDF、图片预览。
- 不新增独立文件详情页面。

### 依赖

- 前置：iter-004 本地文件导入。
- 前置：iter-005 chunks 检索索引。
- 前置：iter-014 evidence 级语义搜索。

## 开发笔记

### 技术方案

后端从 `store.chunks` 构建对象预览，返回最多 6 段索引片段和基础元信息。前端在选中对象变化时加载预览；本地对象走 API，内置 mock 对象使用 `SemanticSnapshot.evidence` 构造 fallback。Inspector 在摘要后展示“内容预览”，让用户能同时看到模型理解和系统实际读入的文本。

### 涉及文件

- `server/src/store.js` — 新增 `getAssetPreview`，并把 store 写入临时文件改为唯一文件名。
- `server/src/index.js` — 新增 `GET /api/assets/:asset_id/preview`。
- `app/src/types/domain.ts` — 新增 `ObjectPreview` / `ObjectPreviewChunk`。
- `app/src/api/client.ts` — 新增 `getLocalObjectPreview`。
- `app/src/App.tsx` — 新增选中对象预览加载状态与 mock fallback。
- `app/src/components/SemanticInspector.tsx` — 新增内容预览模块。
- `app/src/i18n.tsx`、`app/src/styles.css` — 文案与样式。
- `test-temp/emerge/object-preview-smoke.py` — 预览 smoke。

### 设计决策

| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| 预览来源 | `store.chunks` | 展示系统实际进入索引的内容，符合 RAG 可解释性 |
| UI 位置 | Inspector 摘要后 | 用户查看对象语义时自然需要核对原始片段 |
| 范围 | 最多 6 段片段 | 保持右侧面板紧凑，避免变成完整阅读器 |
| mock fallback | snapshot evidence | 保持离线演示可用，不阻断 UI 骨架 |

### 注意事项

- 当前预览不是完整原文。后续如果需要完整阅读器，应在 ingest 时单独保存 source text 或接入对象存储，而不是从 chunks 反推。
- 这轮把 store 临时写入文件名改为唯一值，降低 Windows 下固定 `.tmp` 文件被锁导致写入失败的概率。

### 验证记录

| 检查 | 结果 |
|------|------|
| 前端构建 | PASS：`npm run build` |
| 后端语法 | PASS：`node --check src/index.js`、`node --check src/store.js` |
| UI 回归 | PASS：`test-temp/emerge/run-ui-smokes-with-api.py` |
| 预览 smoke | PASS：`test-temp/emerge/object-preview-smoke.py` |
| 视觉截图 | `artifacts/iter-016-object-preview.png` |
