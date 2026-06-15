# iter-020 Embedding 状态和重建索引

## 需求

### 解决的问题

当前 Ollama embedding 已接入，但用户不知道哪些对象有向量索引、哪些还停留在词法检索，也不能在模型变化后重建索引。

### 验收标准

- `/api/index/status` 返回索引统计。
- 单对象可以 reindex。
- 全局可以 reindex。
- Reindex 成功后 chunk 的 `embedding_model` 更新。
- Ollama 不可用时保留词法索引并显示 fallback。
- Reindex 写 trace。

### 不做的事

- 不做后台队列。
- 不做大型向量数据库。
- 不做自动下载模型。

### 依赖

- Ollama 本地服务。
- `server/src/providers/ollama.js`
- iter-018 trace。

## 开发笔记

### 建议步骤

1. 在 `store.js` 新增 `getIndexStatus()`。
2. 新增 `reindexAsset(assetId)`。
3. 新增 `reindexAll()`。
4. 在 `index.js` 暴露：
   - `GET /api/index/status`
   - `POST /api/assets/:id/reindex`
   - `POST /api/reindex`
5. 在前端 client 增加 API wrapper。
6. 在模型设置或 Inspector 显示 embedding/index 状态。
7. 增加 reindex button。
8. 增加 smoke。

### 关键文件

- `server/src/store.js`
- `server/src/index.js`
- `server/src/providers/ollama.js`
- `app/src/api/client.ts`
- `app/src/types/domain.ts`
- `app/src/components/ModelSettingsModal.tsx`
- `app/src/components/SemanticInspector.tsx`
- `app/src/components/EmbeddingStatusPanel.tsx`

### API

```text
GET  /api/index/status
POST /api/assets/:asset_id/reindex
POST /api/reindex
```

### UI 要求

显示：

- 当前 embedding model。
- chunks 数。
- embedded chunks 数。
- stale chunks 数。
- fallback 状态。

按钮：

- Reindex selected
- Reindex all

### 测试

新增：

```powershell
python test-temp\emerge\reindex-smoke.py
```

检查：

- 导入对象。
- 调 reindex。
- 查询 index status。
- 确认 `embeddingModel` 是当前模型。

### 注意事项

- 如果 Ollama 失败，不要清空现有 chunks。
- 如果 embedding 失败，Search 仍应能词法检索。
- Reindex 可能耗时，UI 必须 loading。
