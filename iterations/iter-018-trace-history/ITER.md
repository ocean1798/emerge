# iter-018 Trace / 操作历史

## 需求

### 解决的问题

当前 Pipeline 只能展示处理步骤，用户还不能完整看到一个对象的操作历史。MVP 必须让导入、解析、索引、编辑、搜索、Ask、重建索引、删除等动作可追踪。

### 验收标准

- `GET /api/assets/:asset_id/trace` 返回对象 trace。
- 新导入对象后至少有 ingest、parse、snapshot、index、verify 事件。
- 编辑对象元数据后新增 metadata trace event。
- Search 和 Ask 后能写入 trace event。
- UI 中可以查看当前对象 trace。
- 失败事件展示可读 message。

### 不做的事

- 不做复杂后台任务队列。
- 不做跨设备同步。
- 不做云端日志。

### 依赖

- `docs/mvp-completion/02-IMPLEMENTATION-SPEC.md`
- `docs/mvp-completion/05-API-CONTRACTS.md`

## 开发笔记

### 建议步骤

已完成：

1. `server/src/store.js` 已有 `traceEvents`、`getAssetTrace()`。
2. 新增 `appendTraceEvent()`。
3. `/api/search` 会为命中的对象写入 search trace。
4. `/api/ask` 成功或 provider 失败都会写入 ask trace。
5. `app/src/api/client.ts` 新增 `getLocalObjectTrace()`。
6. 新增 `app/src/components/ObjectTracePanel.tsx`。
7. `PipelineStrip` 底部展示对象级操作历史。
8. 新增 `test-temp/emerge/trace-history-smoke.py` 并加入全量 smoke runner。

### 关键文件

- `server/src/store.js`
- `server/src/index.js`
- `app/src/api/client.ts`
- `app/src/types/domain.ts`
- `app/src/components/PipelineStrip.tsx`
- `app/src/components/SemanticInspector.tsx`
- `app/src/components/ObjectTracePanel.tsx`
- `app/src/i18n.tsx`
- `app/src/styles.css`

### API

```text
GET /api/assets/:asset_id/trace
```

### UI 要求

- Trace 不做聊天气泡。
- 使用时间线或日志列表。
- 失败项用 danger 色。
- 成功项低对比。
- details 可折叠。

### 测试

已验证：

```powershell
cd dev\web\emerge\app
npm run typecheck
npm run build
```

```powershell
python test-temp\emerge\trace-history-smoke.py
python test-temp\emerge\run-ui-smokes-with-api.py
```

### 注意事项

- Trace 是数据，不是 UI 临时数组。
- 当前删除对象会清理同 asset_id 的 trace；后续如要保留 tombstone，需要单独设计。
- Search/Ask trace 不要记录完整 API key 或完整 provider 错误。
