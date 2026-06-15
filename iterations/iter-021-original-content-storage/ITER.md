# iter-021 原始内容存储和预览

## 需求

### 解决的问题

当前内容预览主要展示索引片段，用户无法清楚区分“原始内容”和“Ask/Search 实际使用的索引片段”。MVP 必须把原始内容作为一等本地数据保存和展示。

### 验收标准

- `POST /api/ingest` 保存 `SourceDocument`。
- `GET /api/assets/:asset_id/source` 返回原始内容预览。
- Inspector 同时展示 Original Source 和 Indexed Chunks。
- 文件、笔记、URL 都支持 source preview。
- 长内容显示截断状态。

### 不做的事

- 不做完整 PDF/Word 解析。
- 不做外部 object storage。
- 不做全文阅读器的复杂分页。

### 依赖

- 当前 JSON store。
- 后续 SQLite/S3 可在此基础上迁移。

## 开发笔记

### 建议步骤

1. 在 `domain.ts` 定义 `SourceDocument`。
2. 在 `store.js` 的 empty store 增加 `sourceDocuments`。
3. `createIngestRecord()` 或 `saveIngestRecord()` 保存 source document。
4. 新增 `getAssetSource(assetId)`。
5. `index.js` 暴露 `GET /api/assets/:id/source`。
6. `api/client.ts` 增加 `getLocalObjectSource()`。
7. 新增 `SourcePreviewPanel.tsx`。
8. 在 `SemanticInspector` 中区分 Original 和 Indexed。
9. 新增 smoke。

### 关键文件

- `server/src/store.js`
- `server/src/index.js`
- `app/src/types/domain.ts`
- `app/src/api/client.ts`
- `app/src/components/SemanticInspector.tsx`
- `app/src/components/SourcePreviewPanel.tsx`
- `app/src/i18n.tsx`
- `app/src/styles.css`

### API

```text
GET /api/assets/:asset_id/source
```

### UI 要求

- Original Source 说明这是本地保存的原始文本。
- Indexed Chunks 说明这是 Ask/Search 使用的片段。
- 如果原文被截断，显示 `已截断`。

### 测试

新增：

```powershell
python test-temp\emerge\source-preview-smoke.py
```

检查：

- 创建笔记。
- 打开 Inspector。
- 看到 Original Source。
- 看到 Indexed Chunks。

### 注意事项

- 不要把 source preview 说成完整阅读器。
- 大内容 MVP 可截断，但必须标记。
- 删除对象时必须删除 source document。
