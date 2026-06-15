# iter-011: URL 捕获入口与语义对象化

## 需求

### 解决的问题
Sources 中已经有 URLs 分类，但 MVP 尚不能创建真实 URL 对象。本轮补齐最小 URL 捕获能力：用户可以输入 URL、标题和备注，把网页线索作为 `url` 语义对象进入本地 store，并复用现有 snapshot、Ask 和删除管线。

### 验收标准
- [x] Header 提供捕获 URL 入口。
- [x] URL 弹窗支持 URL、标题、备注。
- [x] 保存后创建 `kind: "url"` 的本地语义对象。
- [x] URL 对象带有 `url`、`captured`、`local` 标签。
- [x] 保存后自动切换到 URLs 来源并选中新对象。
- [x] URL 对象可被 Ask、导出和删除流程复用。
- [x] UI smoke 能证明 URL 捕获并进入 API store。

### 不做的事
- 不联网抓取网页正文。
- 不做浏览器扩展、剪贴板监听或网页截图。
- 不自动摘要外部网页；备注内容先作为 MVP 语义内容。

### 依赖
- 前置：iter-004 本地文件导入与语义对象闭环。
- 前置：iter-010 本地对象删除与语义库清理。

## 开发笔记

### 技术方案
前端新增 `UrlCaptureModal`，保存时复用 `POST /api/ingest`，传入 `kind: "url"`、`source_uri` 和用户备注构成的 markdown 内容。后端 store 根据 `kind` 为 URL 生成专属标签、storage bucket 和 suggested actions。

### 涉及文件
- `server/src/store.js` — 为 URL 对象生成标签、storage bucket 和 suggested actions。
- `app/src/components/UrlCaptureModal.tsx` — 新增 URL 捕获弹窗。
- `app/src/components/ShellHeader.tsx` — 新增捕获 URL 按钮。
- `app/src/App.tsx` — 新增 URL 捕获状态流。
- `app/src/i18n.tsx` — 新增中英文 URL 捕获文案。
- `test-temp/emerge/url-capture-smoke.py` — URL 捕获 smoke。

### 设计决策
| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| URL 内容 | 用户备注 + URL 元信息 | 不依赖外部网络，先保证对象生命周期闭环 |
| 后端接口 | 复用 `/api/ingest` | URL、笔记、文件都进入同一语义对象管线 |
| 入口位置 | Header 链接按钮 | 与导入文件、新建笔记并列，符合“对象入口”心智 |
| 后续扩展 | 单独做网页抓取迭代 | 抓取、清洗、反爬和版权边界复杂，不能混入本轮 |

### 注意事项
- 当前 URL 捕获不代表网页正文已被抓取；Ask 的依据是用户备注和 URL 元信息。

### 验证记录
| 检查 | 结果 |
|------|------|
| 前端构建 | PASS：`npm run build` |
| 后端语法 | PASS：`node --check src/store.js` |
| UI smoke | PASS：`test-temp/emerge/url-capture-smoke.py` |
| 视觉截图 | `artifacts/iter-011-url-capture.png` |
