# iter-007: 一键本地启动与 API 状态诊断

## 需求

### 解决的问题

当前功能已经能导入文件、创建笔记、Ask 检索和导出快照，但真实使用时仍有摩擦：前端和本地 API 要分别启动，API 未启动时页面只表现为操作失败。用户需要一个低认知负担的启动方式，以及页面内的连接状态提示。

### 本轮范围

- 在 `dev/web/emerge` 增加 workspace 级 `package.json`。
- 新增 `npm run dev`：同时管理 API 与前端服务。
- 新增 `npm run dev:check`：检查 `8787/api/health` 和 `5173`。
- 启动脚本复用已运行服务，避免重复启动端口。
- Header 展示 API 状态：检查中、已连接、未连接。
- API 状态 tooltip 给出诊断提示。

### 验收标准

- [x] `node scripts/dev.mjs --help` 可输出使用说明。
- [x] API 未运行时 `node scripts/dev.mjs --check` 返回 `API DOWN`。
- [x] API 临时启动时 `node scripts/dev.mjs --check` 返回 `API OK` 和 `App OK`。
- [x] 前端构建通过。
- [x] 浏览器烟测中 Header 显示 `API 已连接`。

### 不做的事

- 不在本轮做桌面托盘或后台服务守护。
- 不自动打开浏览器。
- 不写入系统级环境变量。

### 依赖

- 前置迭代：`iter-006-note-create-and-snapshot-export`

## 开发笔记

### 技术方案

开发启动器使用 Node 原生 `child_process` 管理 `app` 和 `server` 两个 npm dev 进程。健康检查使用 `http/https` request 而不是 Node `fetch`，规避 Windows + Node 24 下子进程成功访问后偶发的 async handle 断言问题。

前端在启动时调用 `/api/health`，Header 用紧凑状态芯片反馈 API 是否可用。API 未连接时，mock 数据仍可浏览，但导入、笔记和 Ask 需要启动本地 API。

### 涉及文件

- `package.json` — workspace 级启动命令。
- `scripts/dev.mjs` — 一键启动与健康检查。
- `app/src/api/client.ts` — `getApiHealth()`。
- `app/src/App.tsx` — API 状态检测。
- `app/src/components/ShellHeader.tsx` — API 状态芯片。
- `app/src/i18n.tsx`、`app/src/styles.css` — 文案和样式。
- `README.md`、`scripts/README.md` — 使用说明。

### 设计决策

| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| 启动入口 | `dev/web/emerge/npm run dev` | 符合项目目录边界，不污染根目录 |
| 健康检查 | `npm run dev:check` | 用于快速判断功能不可用是否因为 API 未启动 |
| 页面提示 | Header 状态芯片 | 高可见、低打扰 |
| 脚本 HTTP | Node `http/https` | 避免 Windows Node 24 `fetch` 子进程断言 |

### 验证记录

| 项目 | 结果 |
|------|------|
| 前端构建 | PASS：`npm run build` |
| 启动器帮助 | PASS：`node scripts/dev.mjs --help` |
| API down 检查 | PASS：`node scripts/dev.mjs --check` 返回 API DOWN |
| API ok 检查 | PASS：临时 API 下返回 API OK / App OK |
| 浏览器烟测 | PASS：Header 显示 `API 已连接` |
| 截图 | `artifacts/iter-007-dev-status.png` |
