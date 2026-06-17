# Emerge Local API

Emerge 的本地 API 服务，提供语义资产管理和 AI 问答接口。

---

## 快速开始

### 启动服务

从上层目录启动（推荐，同时启动 API 和前端）：

```bash
cd ..
npm run dev
```

或者仅启动 API：

```bash
npm run dev
```

服务地址：`http://127.0.0.1:8787`

### 健康检查

```bash
npm run health
```

---

## 配置

### 环境变量配置

复制示例配置文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 填入您的配置：

```bash
# OpenAI-compatible LLM 配置
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=deepseek-v4-flash
OPENAI_PROVIDER_LABEL=DeepSeek
OPENAI_CHAT_PATH=/chat/completions

# Ollama Embedding 配置（可选）
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=embeddinggemma
```

### 支持的 LLM Provider

任何 OpenAI-compatible API 都可以接入：

- **DeepSeek**：`https://api.deepseek.com`
- **OpenAI**：`https://api.openai.com/v1`
- **其他兼容服务**：使用对应的 base URL

### Ollama Embedding

如需语义搜索功能：

1. 安装 Ollama：https://ollama.ai
2. 拉取 embedding 模型：
   ```bash
   ollama pull embeddinggemma
   ```
3. 确保 Ollama 在 `http://localhost:11434` 运行

---

## API 接口

### 健康检查

```http
GET /api/health
```

返回 API 状态和 provider 配置信息。

### 对象管理

```http
GET    /api/assets                           # 列出所有对象
GET    /api/assets/:asset_id/snapshot        # 获取对象快照
GET    /api/assets/:asset_id/preview         # 获取对象预览
GET    /api/assets/:asset_id/source          # 获取对象原文
GET    /api/assets/:asset_id/trace           # 获取对象操作历史
PATCH  /api/assets/:asset_id                 # 更新对象元数据
DELETE /api/assets/:asset_id                 # 删除对象
POST   /api/assets/:asset_id/reindex         # 重建单对象索引
```

### 内容导入

```http
POST /api/ingest          # 导入文件/笔记/URL
POST /api/url/fetch       # 抓取网页内容
```

### 搜索和问答

```http
GET  /api/search?q=:query               # 语义搜索
POST /api/ask                            # AI 问答
GET  /api/history/ask                    # Ask 历史
GET  /api/history/search                 # Search 历史
```

### 索引管理

```http
GET  /api/index/status                   # 索引状态
POST /api/reindex                        # 全局重建索引
POST /api/embed                          # 生成 embedding
```

### 模型配置

```http
POST /api/llm/config                     # 更新 LLM 配置
POST /api/llm/test                       # 测试 LLM 连接
GET  /api/ollama/tags                    # 获取 Ollama 模型列表
POST /api/ollama/test                    # 测试 Ollama 连接
```

### Pipeline

```http
GET /api/pipeline/runs?asset_id=:id      # 获取 pipeline 运行记录
```

---

## 技术架构

### 核心模块

- `src/index.js` - HTTP 服务器和路由
- `src/store.js` - JSON 数据存储
- `src/config.js` - 配置管理
- `src/retrieval.js` - 检索和本地回答
- `src/url-fetcher.js` - 网页抓取
- `src/providers/` - 模型 provider 适配器

### 数据存储

所有数据存储在 `local-data/` 目录：

- `store.json` - 主数据存储
- `settings.json` - 非敏感配置
- `sources/` - 原始文件存储

### Provider 适配器

- `openai-compatible.js` - OpenAI-compatible LLM 适配器
- `ollama.js` - Ollama embedding 适配器

---

## 开发指南

### 环境要求

- Node.js 18+
- npm 9+

### 开发模式

```bash
npm run dev
```

### 生产部署

当前仅支持本地运行，不支持远程部署。

---

## 安全说明

### API Key 安全

- API key 只在当前 API 进程内存中保存
- 不写入 `settings.json` 或任何持久化文件
- 重启后需要重新配置（或通过 `.env.local` 自动读取）

### 数据安全

- 所有数据存储在本地
- 不上传到任何远程服务器
- API 默认只监听 `127.0.0.1`

---

## 故障排查

### API 无法启动

1. 检查端口 8787 是否被占用
2. 检查 Node.js 版本
3. 查看控制台错误信息

### LLM 连接失败

1. 检查 API key 是否正确
2. 检查 base URL 是否可访问
3. 使用 `/api/llm/test` 测试连接

### Ollama 连接失败

1. 确保 Ollama 已安装并运行
2. 检查 `http://localhost:11434` 是否可访问
3. 使用 `/api/ollama/test` 测试连接

---

## 已知限制

- API key 需要每次启动时重新输入
- URL 抓取仅支持公开静态页面
- 本地数据存储为单 JSON 文件
- API 仅监听 localhost

详见 `docs/mvp-completion/08-KNOWN-ISSUES.md`

---

*最后更新：2026-06-17*
