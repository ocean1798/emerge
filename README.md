# Emerge Web

## MVP Completion Handoff

如果后续需要从其它工具或较弱模型继续开发，先读：

1. `docs/mvp-completion/README.md`
2. `docs/mvp-completion/00-HANDOFF-CONTEXT.md`
3. 当前迭代的 `iterations/iter-NNN-*/ITER.md`

当前后续迭代从 `iter-018-trace-history` 开始。不要直接从历史对话恢复上下文。

本地启动请优先在 `dev/web/emerge` 运行：

```powershell
npm run dev
```

也可以在 `dev/web/emerge/app` 运行 `npm run dev`，它会委托到上层统一启动器。`npm run dev:vite` 现在也会先检查并自动拉起本地 API；只有设置 `EMERGE_VITE_AUTOSTART_API=0` 时才是纯前端 Vite，用于上层统一启动器或极少数静态 UI 调试。

Emerge Web 是「硅基涌现」Phase 1 的软件开发主目录。这里承接后续 Web/桌面端工程、开发文档、架构记录、测试资产和原型产物。

产品源文档：

- `product/projects/20260609-硅基涌现白皮书/work/Emerge-Phase1-轻量PRD与页面地图.md`
- `product/projects/20260609-硅基涌现白皮书/work/_drafts/MVP审视-v0.5白皮书对照分析.md`

## 当前定位

Phase 1 不是一个普通聊天工具，而是一个本地优先的个人 Brain Layer 与语义资产操作台。

默认第一屏是 Objects，而不是 Chat：用户先看到自己的文件、语义快照、状态、证据和操作历史，再从资产对象进入 Ask、Trace、Workflow。

## 目录规划

```text
dev/web/emerge/
├── README.md
├── STATUS.md
├── dev-plan.md
├── docs/
│   ├── DEVELOPMENT.md
│   ├── ARCHITECTURE.md
│   ├── DATA-CONTRACTS.md
│   ├── UI-SPEC.md
│   └── TESTING.md
├── app/
│   └── README.md
├── server/
│   └── README.md
├── packages/
│   └── README.md
├── desktop/
│   └── README.md
├── scripts/
│   └── README.md
├── tests/
│   └── README.md
└── artifacts/
    └── README.md
```

## 开发顺序

1. 先完成 Objects 第一屏的静态产品骨架与模拟数据。
2. 再固化语义快照、资产对象、Trace、Pipeline 的数据契约。
3. 接入本地 API、检索、证据引用和快照导出。
4. 最后再考虑桌面容器、S3 兼容对象存储、长期索引与同步能力。

## 本地启动

在 `dev/web/emerge` 目录运行：

```bash
npm run dev
```

该命令会同时启动本地 API 和前端，并在终端输出：

```text
App: http://127.0.0.1:5173/
API: http://127.0.0.1:8787/api/health
```

健康检查：

```bash
npm run dev:check
```

## 原则

- 产品体验先从文件管理入口展开，而不是从聊天框展开。
- 所有对象必须有稳定身份、状态、来源、证据和操作历史。
- 本地优先，云能力后置。
- 研发上先跑通最小闭环，再引入复杂存储和多 Agent 编排。
