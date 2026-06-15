# iter-019 AI 文件管理和批量导入

## 需求

### 解决的问题

当前文件入口仍偏原型，只能基础导入。本迭代要把它推进为 AI 时代文件管理入口：支持拖拽、多文件导入、进度和失败摘要。

### 验收标准

- 可以拖拽文件到页面导入。
- 可以一次选择多个文件导入。
- 每个文件独立显示成功或失败。
- 失败文件不影响其它文件导入。
- 导入结果有摘要。
- 导入成功对象进入列表并可搜索、预览、Ask。

### 不做的事

- 不做复杂文件夹监听。
- 不做二进制 PDF/Word 解析。
- 不做系统文件管理器替代。

### 依赖

- iter-018 trace 最好先完成；如果没有完成，至少导入成功后能生成 pipeline run。

## 开发笔记

### 建议步骤

1. 在 `App.tsx` 把 `handleImportFiles(files)` 改为批量状态驱动。
2. 新增 `BulkImportSummaryModal.tsx`。
3. 在根容器或 Objects 区增加 drag/drop。
4. 给导入过程增加 progress notice。
5. 对每个文件单独 try/catch。
6. 导入失败时记录文件名、错误信息。
7. 如果 iter-018 已完成，失败和成功都写 trace。

### 关键文件

- `app/src/App.tsx`
- `app/src/components/ShellHeader.tsx`
- `app/src/components/ObjectList.tsx`
- `app/src/components/BulkImportSummaryModal.tsx`
- `app/src/i18n.tsx`
- `app/src/styles.css`
- `server/src/index.js`
- `server/src/store.js`

### UI 要求

- 拖拽时页面出现明确 drop overlay。
- 导入摘要不做大卡片，使用紧凑 modal。
- 展示：
  - 成功数
  - 失败数
  - 总数
  - 失败原因
- 允许关闭摘要。

### 测试

新增：

```powershell
python test-temp\emerge\bulk-import-smoke.py
```

测试内容：

- 创建两个临时文本文件。
- 通过 file chooser 或 drag/drop 导入。
- 确认两个对象出现。
- 确认可搜索其中一个 marker。

### 注意事项

- `File.text()` 对大文件可能慢，MVP 先接受，但要有错误处理。
- 不支持的文件类型不要崩。
- 不要把文件内容传给远端 LLM，只有 Ask 检索出的 evidence 会进入 LLM。
