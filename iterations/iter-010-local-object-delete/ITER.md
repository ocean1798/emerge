# iter-010: 本地对象删除与语义库清理

## 需求

### 解决的问题
MVP 已经支持导入文件和新建笔记，但缺少删除本地对象的能力。文件管理入口如果只能进入、不能移除，会让本地语义库很快变成不可整理的堆积区。本轮补齐最小对象生命周期：本地导入对象和笔记可删除，并同步清理语义快照、处理记录和索引 chunks。

### 验收标准
- [x] 后端提供 `DELETE /api/assets/:asset_id`。
- [x] 删除对象时同步清理 `assets`、`snapshots`、`pipelineRuns`、`chunks`。
- [x] 前端对象列表提供删除当前本地对象的入口。
- [x] 内置 mock 示例对象不可删除。
- [x] 删除前有确认，删除后 UI 列表、Inspector 和 Ask 状态同步更新。
- [x] API smoke 能证明对象删除后不再出现在 store 中。

### 不做的事
- 不实现回收站、撤销或批量删除。
- 不删除内置演示数据。
- 不做文件系统级原始文件删除；当前只管理 Emerge 本地语义库记录。

### 依赖
- 前置：iter-004 本地文件导入与语义对象闭环。
- 前置：iter-006 新建笔记与快照导出。

## 开发笔记

### 技术方案
后端在 store 层新增 `deleteAsset`，按 `asset_id` 过滤相关结构并原子写回 JSON store。前端只允许删除存在于 `localAssets` 中的对象；删除后同步移除本地状态、清空 Ask 结果，并回到默认选中对象。

### 涉及文件
- `server/src/store.js` — 新增 `deleteAsset`。
- `server/src/index.js` — 新增 `DELETE /api/assets/:asset_id`。
- `app/src/api/client.ts` — 新增 `deleteLocalAsset`。
- `app/src/App.tsx` — 新增删除本地对象状态流。
- `app/src/components/ObjectList.tsx` — 新增删除当前对象按钮。
- `app/src/i18n.tsx` — 新增删除确认和反馈文案。
- `app/src/styles.css` — 新增禁用按钮样式。

### 设计决策
| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| 删除范围 | 只删本地对象 | mock 示例是产品演示种子数据，不应被用户操作误删 |
| 删除清理 | 同步清理 snapshot / run / chunks | 避免 Ask 检索到已删除对象的证据 |
| 交互 | 工具栏删除当前选中对象 | MVP 下比每行菜单更简单，且与“当前语义对象”心智一致 |
| 确认方式 | 原生 confirm | 最小可靠，后续可替换为产品内 modal |

### 注意事项
- 删除是不可撤销的；后续如加入回收站，应扩展 store schema，而不是直接覆盖当前语义。
- 浏览器 DELETE 会触发 CORS preflight；`Access-Control-Allow-Methods` 必须包含 `DELETE`。

### 验证记录
| 检查 | 结果 |
|------|------|
| 前端构建 | PASS：`npm run build` |
| 后端语法 | PASS：`node --check src/index.js`、`node --check src/store.js` |
| API 删除 | PASS：临时 note 删除后 asset/snapshot/run/chunk 均无残留 |
| UI 删除 | PASS：`test-temp/emerge/delete-object-smoke.py` 创建、确认删除并从 API store 消失 |
| CORS preflight | PASS：OPTIONS 返回 `GET, POST, DELETE, OPTIONS` |
| 视觉截图 | `artifacts/iter-010-delete-object.png` |
