# iter-001: Objects 第一屏与工程脚手架

## 需求

### 解决的问题

用户需要一个 AI 时代的文件管理入口：文件进入系统后，不再只是目录里的静态条目，而是可被理解、可被检索、可被追溯、可被操作的语义资产对象。

本轮目标是先把 Emerge 的第一屏做出来：让用户一打开产品就能看到 Sources、Objects、Semantic Inspector 和 Pipeline，而不是先面对一个空聊天框。

### 本轮范围

- 初始化 Web 前端工程。
- 建立 Objects 第一屏主布局。
- 使用 mock data 驱动资产列表、语义快照、证据、状态和 pipeline。
- 建立后续真实 API 可替换的数据边界。
- 建立第一轮视觉基调：高信息密度、冷静工作台、对象掌控感。

### 验收标准

- [x] 本地开发服务可以启动并访问 Objects 页面。
- [x] 页面包含 Sources、Objects、Semantic Inspector、Pipeline Strip 四个区域。
- [x] Objects 列表展示至少 8 个 mock 资产对象，覆盖 file、url、note、collection。
- [x] 资产状态覆盖 ready、indexing、partial、error、stale。
- [x] 点击对象后，右侧 Inspector 会展示对应 semantic snapshot。
- [x] Inspector 至少展示 summary、topics、entities、evidence、suggested actions、snapshot metadata。
- [x] Pipeline Strip 展示当前对象或最近任务的处理步骤。
- [x] 空状态、错误状态、长标题、长路径不会造成布局重叠。
- [x] 页面在桌面宽屏和窄屏下都可用。
- [x] 控制台没有红色错误。

### 不做的事

- 不接入真实本地文件系统。
- 不实现真实 RAG、embedding、rerank。
- 不实现 S3-compatible 对象存储。
- 不做桌面壳。
- 不做用户账号、云同步、团队协作。
- 不把聊天作为唯一入口。

### 依赖

- 产品 PRD：`product/projects/20260609-硅基涌现白皮书/work/Emerge-Phase1-轻量PRD与页面地图.md`
- 开发总纲：`dev/web/emerge/docs/DEVELOPMENT.md`
- UI 规格：`dev/web/emerge/docs/UI-SPEC.md`
- 数据契约：`dev/web/emerge/docs/DATA-CONTRACTS.md`

## 开发笔记

### 技术方案

本轮先采用 Web 优先路线：React + TypeScript + Vite 做前端工程，Tailwind CSS 承接设计 token 和布局，lucide-react 提供图标，shadcn/ui 作为后续可选组件来源。

前端先使用 mock adapter，不直接绑定真实 API。所有页面数据通过契约化类型进入组件，为后续替换成本地 API、SQLite、对象存储和索引服务留出口。

### 官方参考

- Vite 官方指南：`https://vite.dev/guide/`
- Tailwind CSS + Vite 官方安装说明：`https://tailwindcss.com/docs/installation/using-vite`
- shadcn/ui + Vite 官方安装说明：`https://ui.shadcn.com/docs/installation/vite`

### 计划涉及文件

- `dev/web/emerge/app/package.json` — 前端工程脚本与依赖。
- `dev/web/emerge/app/index.html` — Vite 入口。
- `dev/web/emerge/app/vite.config.ts` — Vite、React、Tailwind 插件配置。
- `dev/web/emerge/app/tsconfig.json` — TypeScript 检查配置。
- `dev/web/emerge/app/src/main.tsx` — React 入口。
- `dev/web/emerge/app/src/App.tsx` — 应用根组件、筛选与选中状态。
- `dev/web/emerge/app/src/styles.css` — 全局样式、布局、响应式与状态视觉。
- `dev/web/emerge/app/src/data/mock-assets.ts` — mock 资产、快照、pipeline 数据。
- `dev/web/emerge/app/src/types/domain.ts` — Phase 1 前端领域类型。
- `dev/web/emerge/app/src/components/` — Sources、Objects、Inspector、Pipeline 等组件。
- `dev/web/emerge/artifacts/iter-001-desktop-default.png` — 默认桌面截图。
- `dev/web/emerge/artifacts/iter-001-desktop.png` — 搜索态桌面截图。
- `dev/web/emerge/artifacts/iter-001-mobile.png` — 移动端截图。

### 设计决策

| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| 第一屏入口 | Objects 操作台 | 符合“语义资产驾驶舱”，避免退化成聊天壳 |
| 工程起点 | Vite + React + TypeScript | 轻量、启动快、适合快速验证交互 |
| 数据来源 | 先 mock adapter | 降低后端依赖，先验证产品形态 |
| UI 风格 | 工作台式信息密度 | 更像 AI 文件系统，不像营销页或普通网盘 |
| 桌面能力 | 后置 | 先跑通 Web 体验，再加 Tauri/Electron |

### 注意事项

- 不要把 mock 数据写死在组件内部。
- 所有 AI 结论都要能挂到 evidence 或明确标记为推断。
- partial/error/stale 状态不能伪装成 ready。
- 视效要克制，但第一眼必须有产品气质。
- 避免大卡片堆叠；Objects 默认应适合扫描和比较。

### 开发日志

| 日期 | 记录 |
|------|------|
| 2026-06-13 | 创建 iter-001，确定本轮范围为工程脚手架 + Objects 第一屏。 |
| 2026-06-13 | 完成 React + TypeScript + Vite 前端工程，接入 Tailwind Vite plugin 与 lucide-react。 |
| 2026-06-13 | 完成 Sources、Objects、Semantic Inspector、Pipeline Strip 四区页面。 |
| 2026-06-13 | 完成 mock semantic assets、semantic snapshots、pipeline runs 与状态筛选。 |
| 2026-06-13 | `npm run build` 通过；Playwright 桌面/移动烟测通过，无 console error。 |

### 验证记录

| 项目 | 结果 |
|------|------|
| 生产构建 | PASS：`npm run build` |
| 桌面烟测 | PASS：1440×960，四区可见，8 个对象可见，点击对象刷新 Inspector |
| 搜索交互 | PASS：搜索 `gbrain` 后只保留对应对象，状态条同步更新 |
| 移动端烟测 | PASS：390×844，Sources、Objects、Inspector、Pipeline 堆叠可用 |
| 截图产物 | `artifacts/iter-001-desktop-default.png`、`artifacts/iter-001-desktop.png`、`artifacts/iter-001-mobile.png` |
