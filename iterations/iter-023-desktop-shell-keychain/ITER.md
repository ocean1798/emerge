# iter-023 桌面壳和 Keychain

## 需求

### 解决的问题

当前 Emerge 是浏览器 app + 本地 API。用户打开 5173 时容易只启动前端，导致 API 未连接。桌面壳可以强化本地优先体验，并为安全保存 API key 提供 OS keychain 通道。

### 验收标准

最低验收：

- `desktop/` 下有清晰方案和运行说明。
- 能用 Tauri 或等价方案打开 Emerge UI。
- 文档说明如何启动本地 API。

增强验收：

- 桌面壳能托管或启动本地 API。
- API key 可保存到 OS keychain。
- 普通 settings 文件仍不保存 API key。

### 不做的事

- 不做自动更新。
- 不做签名发布。
- 不做多平台完整安装包。

### 依赖

- Tauri 2 官方文档。
- 当前 web app 稳定。

## 开发笔记

### 建议步骤

如果只做方案：

1. 更新 `desktop/README.md`。
2. 写清楚 Tauri 结构、启动策略、keychain 策略。
3. 不改业务代码。

如果实现最小桌面壳：

1. 在 `desktop/` 初始化 Tauri。
2. 指向 Vite dev server 或 build output。
3. 加启动说明。
4. 不把 server 逻辑复制到桌面壳。

如果实现 keychain：

1. 后端新增 key read/write abstraction。
2. Web 模式继续 runtime-only。
3. Desktop 模式使用 OS keychain。
4. UI 显示 keychain 状态。

### 关键文件

- `desktop/README.md`
- `desktop/*`
- `server/src/config.js`
- `app/src/components/ModelSettingsModal.tsx`

### 测试

最低：

- README 命令可执行。
- Web 模式不受影响。

增强：

- 保存 key 后重启桌面 app 仍显示 key configured。
- `settings.json` 不包含 key。

### 注意事项

- 如果模型能力不足，先只写方案，不强行实现。
- 桌面壳不得阻塞 P0 MVP。
- API 未连接问题也可以先通过改 dev script / 前端提示解决，不一定必须等桌面壳。
