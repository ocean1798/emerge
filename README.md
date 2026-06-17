# Emerge Web

**本地优先的个人语义资产驾驶舱**

Emerge 不是普通聊天工具，而是 AI 时代的新文件管理入口。文件、URL、笔记进入系统后，会变成可检索、可提问、可追踪、可操作的语义对象。

---

## 快速开始

### 1. 启动应用

在 `dev/web/emerge` 目录运行：

```bash
npm run dev
```

该命令会同时启动本地 API 和前端，并在终端输出：

```text
App: http://127.0.0.1:5173/
API: http://127.0.0.1:8787/api/health
```

### 2. 配置 LLM（可选）

如需使用 AI 问答功能，需要配置 OpenAI-compatible LLM：

1. 点击界面右上角齿轮图标打开"模型设置"
2. 填写 LLM 配置：
   - **Base URL**：如 `https://api.deepseek.com` 或 `https://api.openai.com/v1`
   - **API Key**：您的 API key
   - **Model**：如 `deepseek-v4-flash` 或 `gpt-4`
   - **Provider Label**：自定义显示名称（可选）
3. 点击"测试连接"验证配置
4. 保存配置

或者在 `server/.env.local` 中配置环境变量：

```bash
cp server/.env.example server/.env.local
# 编辑 .env.local 填入您的配置
```

### 3. 配置 Embedding（可选）

如需使用语义搜索功能，需要安装 Ollama 并配置 embedding 模型：

1. 安装 Ollama：https://ollama.ai
2. 拉取 embedding 模型：
   ```bash
   ollama pull embeddinggemma
   ```
3. 确保 Ollama 在 `http://localhost:11434` 运行
4. 在"模型设置"中配置 Ollama embedding

如果未配置 Ollama，系统会自动回退到词法检索，核心功能仍可使用。

---

## 核心功能

### 对象管理
- **文件导入**：支持文本、Markdown、JSON、CSV、HTML 文件
- **笔记创建**：快速创建本地笔记
- **URL 捕获**：抓取公开网页内容作为语义对象
- **批量导入**：支持拖拽和多文件导入

### 语义处理
- **自动索引**：导入内容自动切片、生成 embedding
- **混合检索**：词法检索 + 向量检索（需 Ollama）
- **内容预览**：查看对象的索引片段和原文

### AI 问答
- **Ask Emerge**：基于本地语义库的智能问答
- **证据引用**：回答附带相关证据来源
- **操作历史**：记录所有 Ask 和 Search 操作

### 数据管理
- **元数据编辑**：修改对象标题和标签
- **语义搜索**：全局搜索语义相关内容
- **索引重建**：单对象或全局重建索引
- **删除清理**：删除对象并清理相关数据

---

## 健康检查

检查 API 和前端是否正常运行：

```bash
npm run dev:check
```

---

## 目录结构

```text
dev/web/emerge/
├── README.md          ← 本文件
├── STATUS.md          ← 项目状态
├── dev-plan.md        ← 开发计划
├── ITERATION.md       ← 迭代路线图
├── app/               ← 前端应用
│   └── README.md
├── server/            ← 本地 API
│   └── README.md
├── docs/              ← 开发文档
│   └── mvp-completion/  ← MVP 交接文档
├── iterations/        ← 迭代文档
├── artifacts/         ← 截图和产物
├── desktop/           ← 桌面壳（Tauri）
├── packages/          ← 共享包
├── scripts/           ← 工具脚本
└── tests/             ← 测试
```

---

## 技术栈

- **前端**：React + TypeScript + Vite + Tailwind CSS
- **本地 API**：Node.js native HTTP
- **数据存储**：JSON 文件（本地优先）
- **LLM**：OpenAI-compatible API（DeepSeek、OpenAI 等）
- **Embedding**：Ollama 本地 embedding
- **桌面壳**：Tauri（可选）

---

## 已知问题

详见 `docs/mvp-completion/08-KNOWN-ISSUES.md`

主要限制：
- API key 需要每次启动时重新输入（或配置 .env.local）
- URL 抓取仅支持公开静态页面
- 原始内容预览仅显示索引片段
- 桌面应用尚未打包

---

## 开发者指南

如果是开发者或需要接手开发，请阅读：

1. `docs/mvp-completion/README.md` - MVP 交接文档
2. `docs/mvp-completion/00-HANDOFF-CONTEXT.md` - 快速上下文
3. `docs/ARCHITECTURE.md` - 架构说明
4. `docs/DEVELOPMENT.md` - 开发指南

---

## 产品定位

Phase 1 不是一个普通聊天工具，而是一个本地优先的个人 Brain Layer 与语义资产操作台。

默认第一屏是 Objects，而不是 Chat：用户先看到自己的文件、语义快照、状态、证据和操作历史，再从资产对象进入 Ask、Trace、Workflow。

---

## 原则

- 产品体验先从文件管理入口展开，而不是从聊天框展开
- 所有对象必须有稳定身份、状态、来源、证据和操作历史
- 本地优先，云能力后置
- 研发上先跑通最小闭环，再引入复杂存储和多 Agent 编排

---

*最后更新：2026-06-17*
