# iter-022 Ask/Search History

## 需求

### 解决的问题

用户问过什么、检索过什么、引用了哪些证据，目前没有沉淀。MVP 需要让 Ask 和 Search 可复盘。

### 验收标准

- Ask 成功写入 `askRuns`。
- Ask 失败也写入 `askRuns`。
- Search 成功写入 `searchRuns`。
- Search 失败也写入 `searchRuns`。
- UI 展示当前对象最近 Ask/Search。
- History 事件也进入 trace。

### 不做的事

- 不做长期会话管理。
- 不做聊天式多轮对话存档。
- 不做跨设备同步。

### 依赖

- iter-018 trace。
- 当前 Ask/Search API。

## 开发笔记

### 建议步骤

1. 在 `store.js` 增加 `askRuns`、`searchRuns`。
2. 新增 `recordAskRun()`、`recordSearchRun()`。
3. 在 `/api/ask` 成功和 catch 里写 ask run。
4. 在 `/api/search` 成功和 catch 里写 search run。
5. 新增：
   - `GET /api/history/ask`
   - `GET /api/history/search`
6. 前端 client 增加 history API。
7. 新增 `HistoryPanel.tsx`。
8. 在 Inspector 展示最近记录。
9. 新增 smoke。

### 关键文件

- `server/src/store.js`
- `server/src/index.js`
- `server/src/retrieval.js`
- `app/src/api/client.ts`
- `app/src/types/domain.ts`
- `app/src/components/SemanticInspector.tsx`
- `app/src/components/HistoryPanel.tsx`
- `app/src/i18n.tsx`

### API

```text
GET /api/history/ask?asset_id=:asset_id&limit=20
GET /api/history/search?asset_id=:asset_id&limit=20
```

### UI 要求

- History 不要占据主视觉。
- 放在 Inspector 的下半部分或折叠区。
- 每条记录显示：
  - 问题或查询
  - 时间
  - provider / retrieval mode
  - citations count
  - 状态

### 测试

新增：

```powershell
python test-temp\emerge\ask-search-history-smoke.py
```

检查：

- 创建对象。
- Search marker。
- Ask question。
- 查询 history API。
- UI 出现 history。

### 注意事项

- 不要把完整 answer 长文本全塞进列表，存 preview。
- 如果 LLM 失败，仍记录失败。
- 不要记录 API key。
