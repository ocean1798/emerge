# 04 MVP Test Plan

## 目标

MVP 测试必须证明：

- App 能启动。
- 本地 API 能启动。
- LLM 和 embedding 状态可诊断。
- 文件、笔记、URL 能进入语义对象。
- Search/Ask/Trace/Preview 主路径可用。
- 错误不会让用户卡死。
- 不泄露 API key。

## 固定命令

在 `dev/web/emerge/app`：

```powershell
npm run typecheck
npm run build
```

在项目根目录：

```powershell
python test-temp\emerge\run-ui-smokes-with-api.py
```

在 `dev/web/emerge`：

```powershell
npm run dev:check
```

## Smoke test 结构

已有脚本位置：`test-temp/emerge/`

当前已有：

- `model-settings-smoke.py`
- `delete-object-smoke.py`
- `url-capture-smoke.py`
- `edit-metadata-smoke.py`
- `semantic-search-smoke.py`
- `object-preview-smoke.py`
- `run-ui-smokes-with-api.py`

后续需要新增：

- `trace-history-smoke.py`
- `bulk-import-smoke.py`
- `reindex-smoke.py`
- `source-preview-smoke.py`
- `ask-search-history-smoke.py`
- `release-gate-smoke.py`

## P0 测试用例

### TC-001 启动

步骤：

1. 运行 `npm run dev`。
2. 打开 `http://127.0.0.1:5173/`。
3. 运行 `npm run dev:check`。

期望：

- App OK。
- API OK。
- 页面无空白。

### TC-002 模型设置

步骤：

1. 打开模型设置。
2. Base URL 填 `https://api.deepseek.com`。
3. Model 填 `deepseek-v4-flash`。
4. 清空 Chat Path。
5. Embedding model 填 `qwen3-embedding:8b`。
6. 保存。

期望：

- 保存不失败。
- 后端 chatPath 自动变 `/chat/completions`。
- `/api/ollama/test` 返回 connected。
- `settings.json` 不包含真实 key。

### TC-003 文件导入

步骤：

1. 导入一个 `.md` 文件。
2. 导入一个 `.txt` 文件。
3. 导入一个不支持的二进制文件。

期望：

- 支持文件进入 Objects。
- 不支持文件显示错误。
- 成功和失败互不影响。
- 每个成功对象有 snapshot、chunks、pipeline、trace。

### TC-004 笔记

步骤：

1. 创建一条笔记。
2. 搜索笔记正文中的唯一字符串。
3. 打开搜索结果。
4. 删除笔记。

期望：

- Search 能返回 evidence。
- 删除后 Search 不再返回。
- 删除写入 trace 或至少清理相关记录。

### TC-005 URL

步骤：

1. 捕获公开 URL。
2. 点击抓取正文。
3. 保存为对象。

期望：

- URL 对象 kind 为 `url`。
- 抓取正文进入 source document 和 chunks。
- 抓取失败时仍可手动保存备注。

### TC-006 Trace

步骤：

1. 创建对象。
2. 编辑标题和标签。
3. 搜索该对象。
4. 对该对象 Ask。
5. 打开 trace。

期望：

- Trace 包含 ingest、snapshot、index、metadata、search、ask。
- 事件按时间倒序或正序稳定展示。
- 失败事件可读。

### TC-007 Reindex

步骤：

1. 确认当前 embedding model。
2. 修改 embedding model 或模拟旧 chunk。
3. 点击 reindex。
4. 查询 `/api/index/status`。

期望：

- stale count 变化正确。
- Reindex 后 chunks 的 `embedding_model` 更新。
- Ollama 不可用时不删除词法索引。

### TC-008 Source preview

步骤：

1. 导入长文本。
2. 打开 Inspector。
3. 查看 Original 和 Indexed chunks。

期望：

- Original 显示原文预览。
- Indexed chunks 显示检索片段。
- 两者视觉和文案明确区分。

### TC-009 Ask

步骤：

1. 未配置 key 时 Ask。
2. 配置 key 后 Ask。
3. 模拟 provider 请求失败。

期望：

- 未配置 key 返回 local-retrieval。
- 配置 key 且 provider 可用时返回 LLM provider。
- provider 失败时错误不泄露 key。
- citations 始终展示。

## 安全测试

### Secret scan

运行：

```powershell
Get-ChildItem -Recurse dev\web\emerge -File |
  Select-String -Pattern 'sk-','apiKey":','OPENAI_API_KEY='
```

判定：

- 源码和文档不能出现真实 key。
- `.env.example` 可以出现占位符。
- 文案中出现 `OPENAI_API_KEY` 说明配置方式是允许的。

### Settings scan

检查：

```powershell
Get-Content dev\web\emerge\server\local-data\settings.json
```

不得包含：

- `apiKey`
- `OPENAI_API_KEY`
- 任何真实 key 字符串

## 视觉测试

必须截图：

- 1440x920 桌面
- 1280x800 笔记本
- 390x844 窄屏

检查：

- Header 按钮不重叠。
- Objects 列表长标题不撑破。
- Inspector 长 evidence 不遮挡。
- Trace 列表长 message 可换行。
- 模型设置弹窗不超出视口。

## 回归门槛

每个迭代完成后至少跑：

- `npm run typecheck`
- 与该迭代相关的 smoke

`iter-024` 必须跑：

- `npm run build`
- 全量 `run-ui-smokes-with-api.py`
- secret scan

## 失败处理

如果 smoke 失败：

1. 先判断是测试脚本旧文案还是产品行为失败。
2. 如果是 UI 文案变化，更新测试脚本。
3. 如果是产品行为失败，修代码。
4. 不要删除测试绕过失败。
5. 修完后重跑。
