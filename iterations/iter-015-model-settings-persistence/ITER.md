# iter-015: 模型 Provider 设置持久化

## 需求

### 解决的问题

iter-009 已经让用户能在产品内配置 OpenAI-compatible provider，但配置只存在于本地 API 进程内。API 重启后，base URL、模型名、provider 名称和 chat path 会回到默认值或 `.env.local`。MVP 需要降低重复配置摩擦，同时继续避免真实 API key 被写入仓库、文档或普通本地设置文件。

### 验收标准

- [x] `/api/llm/config` 保存后，非敏感 provider 字段会写入 `server/local-data/settings.json`。
- [x] API 启动时会读取本地 provider 设置。
- [x] `settings.json` 不保存 `apiKey` / `OPENAI_API_KEY` / `sk-`。
- [x] `/api/health` 暴露 provider 设置是否已持久化、持久化错误，以及 API key 仅运行时存储的状态。
- [x] 模型设置弹窗明确提示 provider 设置可持久化、API key 只进入当前本地 API 进程。
- [x] 新增 smoke 验证持久化与密钥不落盘。

### 不做的事

- 不把真实 API key 写入 `.env.local`。
- 不实现 OS keychain 或加密密钥库。
- 不改变 OpenAI-compatible 调用格式。

### 依赖

- 前置：iter-008 LLM 连接诊断。
- 前置：iter-009 产品内模型配置入口。

## 开发笔记

### 技术方案

后端在 `config.js` 中加载 `server/local-data/settings.json`，只读取 `openaiCompatible.baseUrl/model/providerLabel/chatPath`。`updateOpenAICompatibleConfig` 更新运行时配置后，会 best-effort 把这四个非敏感字段写回 settings 文件；`apiKey` 仅更新当前进程内存。`publicConfig` 增加 `providerSettingsPersisted`、`providerSettingsError` 与 `apiKeyStorage: "runtime-only"`，前端模型设置弹窗据此展示安全提示。

### 涉及文件

- `server/src/config.js` — 新增本地 settings 读写与敏感字段过滤。
- `app/src/api/client.ts` — 更新 provider config 类型。
- `app/src/components/ModelSettingsModal.tsx` — 展示持久化与 key 运行时提示。
- `app/src/i18n.tsx`、`app/src/styles.css` — 文案与样式。
- `test-temp/emerge/model-settings-persistence-smoke.py` — API smoke。

### 设计决策

| 决策 | 选什么 | 为什么 |
|------|--------|--------|
| 持久化范围 | Provider 非敏感字段 | 降低重启摩擦，同时不把 secret 落普通文件 |
| key 存储 | runtime-only | 当前 Web MVP 没有 OS keychain，不能假装安全 |
| 配置位置 | `server/local-data/settings.json` | 复用本地运行数据边界，目录已 gitignore |
| 启动加载 | settings 覆盖默认 provider 字段 | 产品内保存后的选择应在下次启动继续生效 |

### 注意事项

- 如果后续进入桌面壳，应把 API key 存储升级为 OS keychain；届时可以保留 `apiKeyStorage` 字段，扩展为 `keychain`。
- 当前 `.env.local` 仍可作为 API key 的本地注入方式；产品内填写 key 后，重启 API 会丢失 key，但 provider 设置会保留。
- 如果运行环境限制写入 `local-data`，本轮不会阻断运行时模型配置保存，但会通过 `providerSettingsError` 暴露持久化失败。

### 验证记录

| 检查 | 结果 |
|------|------|
| 前端构建 | PASS：`npm run build` |
| 后端语法 | PASS：`node --check src/config.js`、`node --check src/index.js` |
| 持久化 smoke | PASS：`test-temp/emerge/model-settings-persistence-smoke.py` |
