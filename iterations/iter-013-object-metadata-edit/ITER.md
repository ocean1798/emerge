# iter-013: 本地对象标题与标签编辑

## 需求

### 解决的问题
本地语义库已经能导入文件、创建笔记、捕获 URL、删除对象，但对象创建后无法整理标题和标签。MVP 的文件管理入口需要最小整理能力，让用户能把进入系统的对象改成自己能理解和检索的名称与标签。

### 验收标准
- [x] 后端提供 `PATCH /api/assets/:asset_id`。
- [x] 支持更新本地对象标题和标签。
- [x] 标签会去空、去重，并限制数量。
- [x] 更新标题后同步更新 chunks title，避免搜索结果引用旧标题。
- [x] 前端对象列表提供编辑当前本地对象入口。
- [x] 编辑弹窗支持标题和标签编辑，保存后 UI 与 API store 同步。
- [x] 内置 mock 示例对象不可编辑。

### 不做的事
- 不编辑 source URI。
- 不编辑原始正文内容。
- 不重跑 topic/entity 抽取；当前只更新展示层元数据。

### 依赖
- 前置：iter-004 本地文件导入与语义对象闭环。
- 前置：iter-010 本地对象删除与语义库清理。

## 开发笔记

### 技术方案
后端新增 `updateAssetMetadata`，更新 asset 的 title/tags/updated_at，并同步 chunks title 与 snapshot 第一实体名称。前端新增 `ObjectMetadataModal`，通过对象列表工具栏的编辑按钮打开，只对 `localAssets` 中的对象启用。

### 涉及文件
- `server/src/store.js` — 新增 `updateAssetMetadata` 与标签归一化。
- `server/src/index.js` — 新增 `PATCH /api/assets/:asset_id`。
- `server/src/http.js` — CORS allow methods 加 `PATCH`。
- `app/src/api/client.ts` — 新增 `updateLocalAssetMetadata`。
- `app/src/components/ObjectMetadataModal.tsx` — 新增编辑对象弹窗。
- `app/src/components/ObjectList.tsx` — 新增编辑当前对象按钮。
- `app/src/App.tsx` — 新增编辑状态流。
- `app/src/i18n.tsx`、`app/src/styles.css` — 文案和样式。
- `test-temp/emerge/edit-metadata-smoke.py` — UI smoke。

### 设计决策
| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| 编辑范围 | 标题 + 标签 | 覆盖最常用整理动作，避免内容编辑带来的 re-index 复杂度 |
| 标签输入 | 逗号/换行分隔文本 | MVP 简单直观，不引入复杂 tag editor |
| mock 对象 | 不可编辑 | mock 是演示种子数据，不进入本地 store |
| snapshot 同步 | 只更新第一实体名 | 保持右侧展示不突兀，完整重抽取留到后续 |

### 注意事项
- 如果未来允许编辑正文，应新增 re-index/re-snapshot 流程，不能复用本轮元数据 PATCH。

### 验证记录
| 检查 | 结果 |
|------|------|
| API 更新 | PASS：标题、标签去重、chunks title 同步 |
| UI smoke | PASS：`test-temp/emerge/edit-metadata-smoke.py` |
| 前端构建 | PASS：`npm run build` |
| 视觉截图 | `artifacts/iter-013-edit-metadata.png` |
