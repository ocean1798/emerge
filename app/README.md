# Emerge Web App

Emerge 的前端应用，提供语义资产管理和 AI 问答界面。

---

## 快速开始

### 启动应用

建议从上层目录启动（同时启动 API 和前端）：

```bash
cd ..
npm run dev
```

或者仅启动前端（需确保 API 已运行）：

```bash
npm run dev:vite
```

应用地址：`http://127.0.0.1:5173`

### 开发命令

```bash
npm run typecheck    # TypeScript 类型检查
npm run build        # 生产构建（包含类型检查）
npm run preview      # 预览生产构建
```

---

## 功能概览

### 对象管理
- 文件导入（文本、Markdown、JSON、CSV、HTML）
- 笔记创建
- URL 捕获和网页抓取
- 批量导入和拖拽导入
- 元数据编辑（标题、标签）
- 对象删除和清理

### 语义处理
- 自动内容切片和索引
- Embedding 生成（需 Ollama）
- 混合检索（词法 + 向量）
- 索引状态查看
- 单对象/全局索引重建

### AI 问答
- Ask Emerge 智能问答
- 证据引用和来源追溯
- 操作历史记录
- Search 语义搜索

### 界面特性
- 三栏工作台布局（Sources、Objects、Inspector）
- 底部 Pipeline 状态条
- 响应式设计（桌面/移动端）
- 简体中文/English 切换
- API 和 LLM 连接状态指示

---

## 技术栈

- React 18
- TypeScript 5
- Vite 6
- Tailwind CSS 4
- lucide-react 图标

---

## 状态指示

### API 状态（Header 左侧）
- **绿色**：API 已连接
- **红色**：API 未连接
- 点击可测试连接

### LLM 状态（Header 右侧）
- **绿色**：LLM 已配置且连通
- **黄色**：LLM 未配置（使用本地检索兜底）
- **红色**：LLM 配置错误
- 点击可测试 LLM 连接

---

## 本地开发

### 环境要求

- Node.js 18+
- npm 9+

### 开发模式

```bash
npm install
npm run dev
```

### 生产构建

```bash
npm run build
```

构建产物在 `dist/` 目录。

### 类型检查

```bash
npm run typecheck
```

---

## 关键文件

- `src/App.tsx` - 主应用组件
- `src/api/client.ts` - API 客户端
- `src/components/` - UI 组件
- `src/types/domain.ts` - 领域类型定义
- `src/i18n.tsx` - 国际化文案
- `src/styles.css` - 样式

---

## 注意事项

- API key 只发送到本地 API 进程，不写入浏览器存储
- 未配置 LLM 时，Ask 使用本地检索摘要兜底
- 模型设置中的非敏感字段会持久化到 `server/local-data/settings.json`
- 截图保存在 `../artifacts/` 目录

---

*最后更新：2026-06-17*
