# iter-009: 产品内模型配置与保存后测试

## 需求

### 解决的问题
iter-008 已经能判断 LLM 是否真的连通，但用户仍需要手动编辑 `server/.env.local` 才能配置模型。MVP 应该让用户在产品内完成 OpenAI-compatible provider 的最小配置，并在保存后立即测试连接。

### 验收标准
- [x] 后端提供 `POST /api/llm/config`，可更新运行时 OpenAI-compatible 配置。
- [x] 配置响应与 health 响应不返回 API key，只返回 `apiKeyConfigured`。
- [x] 前端 Header 有模型设置入口。
- [x] 设置弹窗支持 Base URL、Provider 名称、模型、Chat Path、API Key。
- [x] 保存配置后自动触发 LLM 连接测试。
- [x] UI smoke 能证明设置入口可打开，字段可见。

### 不做的事
- 不把 API key 写入仓库或 localStorage。
- 不做多 provider 列表、密钥保险箱或长期持久化。
- 不替用户保存真实 key 到 `.env.local`。

### 依赖
- 前置：iter-008 LLM 连接诊断与 MVP 验收口径。

## 开发笔记

### 技术方案
后端在当前进程内更新 `config.openaiCompatible`，作为 MVP 运行时配置层。前端新增模型设置 modal，保存后关闭 modal 并调用现有 `/api/llm/test`，让用户立刻看到 `LLM 已连接` 或失败原因。

### 涉及文件
- `server/src/config.js` — 新增运行时配置更新函数。
- `server/src/index.js` — 新增 `POST /api/llm/config`。
- `app/src/api/client.ts` — 新增配置客户端类型与请求。
- `app/src/components/ModelSettingsModal.tsx` — 新增模型设置弹窗。
- `app/src/components/ShellHeader.tsx` — 新增模型设置入口。
- `app/src/App.tsx` — 管理 provider 状态、保存配置、保存后测试。
- `app/src/i18n.tsx` — 新增中英文文案。
- `app/src/styles.css` — 新增设置弹窗样式。

### 设计决策
| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| key 存储 | 仅保存在本地 API 进程内存 | MVP 可用，同时避免把敏感信息写入仓库或浏览器存储 |
| 保存后动作 | 自动测试 LLM | 用户不需要理解“保存”和“连接”是两步 |
| provider 形状 | OpenAI-compatible 通用字段 | DeepSeek、OpenAI 和兼容服务都走同一套配置 |
| 设置入口 | Header 齿轮按钮 | 模型状态与导入、笔记同级，符合工具台使用习惯 |

### 注意事项
- 进程重启后运行时 key 会消失；需要长期保存时再设计本地安全存储。
- 如果用户不输入新 key，保存配置不会清空当前运行时 key。

### 验证记录
| 检查 | 结果 |
|------|------|
| 后端运行时配置 | PASS：隔离端口更新 provider，未回传测试 key |
| 设置弹窗 smoke | PASS：`test-temp/emerge/model-settings-smoke.py` 打开、保存并进入 LLM 测试反馈 |
| Not found 回归 | PASS：重启 API 后 `/api/llm/config` 返回 200 |
| 视觉截图 | `artifacts/iter-009-model-settings.png` |
