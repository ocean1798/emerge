# iter-006: 新建笔记与快照导出

## 需求

### 解决的问题

页面顶部已经有新建按钮，Inspector 里也有导出快照动作，但之前它们只是状态提示。本轮要把两个明显的占位交互做成真功能：用户能直接写一条笔记进入语义库，也能把当前对象的语义快照导出为 JSON。

### 本轮范围

- 顶部 `+` 按钮打开新建笔记面板。
- 笔记支持标题和正文。
- 保存后调用 `POST /api/ingest`，以 `kind=note` 进入本地 store。
- 保存后自动选中新笔记，并切换到 Notes 来源。
- note asset 生成 note 专属 tags 和 suggested actions。
- Inspector 的 export action 下载当前 `asset + snapshot` JSON。
- 中英文文案覆盖新建、保存、导出和错误状态。

### 验收标准

- [x] 点击 `+` 能打开新建笔记面板。
- [x] 保存笔记后，Objects 列表出现新 note 对象。
- [x] Notes 来源计数增加。
- [x] 新 note 有 summary、topics、evidence 和 pipeline。
- [x] 点击导出快照会下载 JSON。
- [x] 导出的 JSON 包含当前对象标题。

### 不做的事

- 不做富文本编辑器。
- 不做笔记编辑/删除。
- 不做导出格式选择。
- 不新增导出 API。

### 依赖

- 前置迭代：`iter-004-local-file-ingest`
- 前置迭代：`iter-005-hybrid-retrieval-ask`

## 开发笔记

### 技术方案

笔记复用 ingest 管线，但后端允许 `input.kind` 指定为 `note`，从而让 Sources、tags、storage_key 和 suggested actions 都保持语义正确。快照导出由前端用 `Blob` 和临时 `<a download>` 完成，避免为本地 JSON 下载引入额外 API。

### 涉及文件

- `app/src/components/NoteComposer.tsx` — 新建笔记面板。
- `app/src/components/ShellHeader.tsx` — `+` 按钮触发新建笔记。
- `app/src/App.tsx` — 笔记保存、选中、Notes 来源切换、快照下载。
- `app/src/components/SemanticInspector.tsx` — action 回传结构化 SuggestedAction。
- `server/src/store.js` — 支持 `kind=note` 和 note 专属 actions。
- `app/src/i18n.tsx`、`app/src/styles.css` — 文案与样式。

### 设计决策

| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| 笔记存储 | 复用 ingest | note 和 file 都是语义资产，后续统一索引/Ask |
| 编辑器 | 轻量 textarea | 当前优先可用闭环，富文本后置 |
| 导出 | 前端 Blob 下载 | 本地 snapshot 已在前端，简单可靠 |
| 动作传参 | SuggestedAction 对象 | 让 export/ask/trace 后续可分流 |

### 验证记录

| 项目 | 结果 |
|------|------|
| 前端构建 | PASS：`npm run build` |
| 后端语法 | PASS：`node --check src/store.js` |
| 浏览器烟测 | PASS：新建笔记、Notes 计数、导出 JSON |
| 截图 | `artifacts/iter-006-note-export.png` |
