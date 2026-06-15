# iter-012: URL 网页正文抓取与抽取

## 需求

### 解决的问题
iter-011 已经能把 URL 作为对象保存，但内容主要依赖用户备注。MVP 需要让普通公开网页的正文能进入本地语义库，成为可搜索、可引用、可被 Ask 使用的 evidence。

### 验收标准
- [x] 后端提供 `POST /api/url/fetch`。
- [x] URL 抓取限制为 `http` / `https`，有超时和下载大小上限。
- [x] HTML 页面能抽取 title 和正文文本，并移除 script/style 噪声。
- [x] URL 捕获弹窗提供“抓取正文”按钮和正文预览。
- [x] 保存 URL 时把抓取正文和用户备注一起进入 ingest 管线。
- [x] smoke 使用本地 fixture 网页验证抓取、预览、保存、清理。

### 不做的事
- 不处理登录页、反爬、验证码或需要 JS 渲染的页面。
- 不做 Readability 级别的正文质量优化。
- 不抓取图片、PDF 或附件。

### 依赖
- 前置：iter-011 URL 捕获入口与语义对象化。

## 开发笔记

### 技术方案
后端新增轻量 `url-fetcher`：用 Node fetch 抓取公开网页，限制协议、超时和最大字节数；对 HTML 做最小文本抽取，优先 main/article/body。前端在 URL 捕获弹窗中调用 `/api/url/fetch`，抓取成功后展示预览，保存时把正文写入同一条 `POST /api/ingest` 管线。

### 涉及文件
- `server/src/url-fetcher.js` — URL 校验、fetch、HTML-to-text。
- `server/src/index.js` — 新增 `POST /api/url/fetch`。
- `app/src/api/client.ts` — 新增 `fetchUrlContent`。
- `app/src/components/UrlCaptureModal.tsx` — 新增抓取按钮和预览。
- `app/src/i18n.tsx` — 新增抓取文案。
- `app/src/styles.css` — 新增 URL 抓取预览样式。
- `test-temp/emerge/url-fixture/index.html` — 本地测试网页。
- `test-temp/emerge/url-capture-smoke.py` — 抓取、预览、保存 smoke。

### 设计决策
| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| 抓取实现 | Node fetch + 轻量 HTML-to-text | 不引入重依赖，先跑通 MVP |
| 超时 | 10 秒 | 防止 URL 捕获把本地 API 卡住 |
| 下载上限 | 1.5 MB | 避免大页面或非文章资源拖垮本地流程 |
| 正文上限 | 40k 字符 | 足够生成 chunks，同时控制 store 体积 |
| 后续升级 | Readability / 浏览器渲染解析 | 当前实现是 MVP 抽取，不追求复杂网页完美解析 |

### 注意事项
- 当前 extractor 是启发式，不保证所有网页正文质量。
- 未来做安全加固时应补 SSRF 防护策略，例如私网地址策略、allowlist 或用户确认。

### 验证记录
| 检查 | 结果 |
|------|------|
| 后端抓取 API | PASS：本地 HTML fixture 抽 title/正文，并移除 script |
| UI smoke | PASS：`test-temp/emerge/url-capture-smoke.py` |
| 前端构建 | PASS：`npm run build` |
| 回归 smoke | PASS：模型设置、对象删除、URL 抓取 |
| 视觉截图 | `artifacts/iter-012-url-fetch.png` |
