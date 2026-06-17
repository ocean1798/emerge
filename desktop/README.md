# Emerge Desktop Shell

桌面壳方案设计文档。当前阶段为方案规划，尚未实现。

## 目标

1. **统一启动体验** - 用户点击桌面图标即可同时启动 Web UI 和本地 API，避免只打开前端导致 API 未连接。
2. **安全存储 API Key** - 通过 OS Keychain 安全保存敏感凭据，settings.json 不存储 API key。
3. **本地优先体验** - 桌面壳强化 Emerge 作为本地 Brain Layer 的定位。

## 技术选型：Tauri 2

选择 Tauri 而非 Electron 的理由：

| 维度 | Tauri 2 | Electron |
|------|---------|----------|
| 包体积 | ~3-5 MB | ~150+ MB |
| 内存占用 | 系统 WebView，轻量 | 内嵌 Chromium，重量 |
| 安全能力 | Rust 后端 + 原生 Keychain API | Node.js，需额外封装 |
| 跨平台 | Windows / macOS / Linux | Windows / macOS / Linux |

Tauri 2 的 Rust 后端天然支持 `keyring` crate，可直接调用 Windows Credential Manager / macOS Keychain / Linux Secret Service。

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                   Tauri Desktop Shell                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  Window Mgr  │  │  Sidecar    │  │  Keychain API   │ │
│  │  (WebView)   │  │  (Node API) │  │  (Rust/native)  │ │
│  └──────┬───────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                 │                   │          │
│         ▼                 ▼                   ▼          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  Vite Build  │  │  Express    │  │  OS Keychain    │ │
│  │  (frontend)  │  │  (server)   │  │  (credential    │ │
│  │              │  │             │  │   store)        │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 组件职责

| 组件 | 职责 | 实现 |
|------|------|------|
| **Window Manager** | 管理 WebView 窗口，加载前端 | Tauri core |
| **Sidecar Manager** | 启动/停止本地 API 进程 | Tauri sidecar 或 shell plugin |
| **Keychain Bridge** | 读写 OS 凭据存储 | Rust `keyring` crate + Tauri command |
| **Frontend** | Emerge Web UI | 现有 Vite + React 构建产物 |
| **API Server** | 本地 Express API | 现有 Node.js server，通过 sidecar 启动 |

## 启动策略

### 开发模式

开发时仍使用现有 `npm run dev` 命令，桌面壳不参与：

```bash
# 在 dev/web/emerge 目录
npm run dev
# 输出：
# App: http://127.0.0.1:5173/
# API: http://127.0.0.1:8787/api/health
```

Tauri 开发模式可配置为指向 Vite dev server：

```bash
cd desktop
npm run tauri dev
# WebView 加载 http://127.0.0.1:5173
# API 由上层 dev.mjs 启动
```

### 生产模式

生产模式下，桌面壳负责启动所有服务：

```
用户双击 Emerge.app / Emerge.exe
        │
        ▼
┌───────────────────┐
│  Tauri 主进程启动  │
└─────────┬─────────┘
          │
          ├─► 启动 API Server (sidecar)
          │   └─ node server/src/index.js
          │   └─ 等待 http://127.0.0.1:8787/api/health 可达
          │
          ├─► 加载 WebView
          │   └─ 读取 app/dist/index.html (Vite build 产物)
          │
          └─► 注入 Keychain Bridge
              └─ 暴露 Tauri command 给前端调用
```

### Sidecar 配置

Tauri 2 支持将 Node.js 应用打包为 sidecar：

```json
// desktop/tauri.conf.json (示意)
{
  "bundle": {
    "externalBin": ["../server"]
  }
}
```

实际实现时，server 目录需要：
1. 添加 `package.json` 的 `bin` 字段或打包为单文件
2. 或使用 `@yao-pkg/pkg` / `esbuild` 打包为独立可执行文件

## Keychain 策略

### 设计原则

1. **API key 永远不写入 settings.json** - 这是现有设计，桌面壳延续此约束。
2. **桌面模式使用 OS Keychain** - 通过 Tauri command 调用系统凭据存储。
3. **Web 模式保持 runtime-only** - 浏览器访问时 API key 仍通过环境变量或运行时传入。
4. **Keychain 读写对前端透明** - 前端通过统一接口调用，不感知底层实现。

### 存储键名约定

```
Service:  "emerge"
Account:  "openai-api-key"        # OpenAI-compatible provider 的 API key
          "openai-base-url"       # 可选：也存 baseUrl
          "ollama-base-url"       # 可选：Ollama 地址
```

### Rust 实现（示意）

```rust
// desktop/src-tauri/src/keychain.rs
use keyring::Entry;

const SERVICE: &str = "emerge";

#[tauri::command]
fn keychain_get(account: String) -> Result<String, String> {
    let entry = Entry::new(SERVICE, &account)
        .map_err(|e| e.to_string())?;
    entry.get_password()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn keychain_set(account: String, value: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE, &account)
        .map_err(|e| e.to_string())?;
    entry.set_password(&value)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn keychain_delete(account: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE, &account)
        .map_err(|e| e.to_string())?;
    entry.delete_password()
        .map_err(|e| e.to_string())
}
```

### 前端调用（示意）

```typescript
// app/src/api/keychain.ts
import { invoke } from "@tauri-apps/api/core";

export async function getKeychain(account: string): Promise<string | null> {
  try {
    return await invoke<string>("keychain_get", { account });
  } catch {
    return null;
  }
}

export async function setKeychain(account: string, value: string): Promise<void> {
  await invoke("keychain_set", { account, value });
}
```

### 与现有 config.js 的集成

桌面模式下，server 启动时优先从 Keychain 读取 API key：

```javascript
// server/src/config.js 中的 apiKey 初始化逻辑（示意）
const apiKey = process.env.OPENAI_API_KEY || "";

// 桌面模式：如果环境变量为空，尝试通过 IPC 从 keychain 读取
// 这需要 sidecar 与 Tauri 主进程通信，或通过启动参数传入
```

推荐方案：Tauri 主进程启动 sidecar 前，先从 Keychain 读取 API key，通过环境变量注入：

```rust
// Tauri 主进程启动 sidecar 时
let api_key = keychain_get("openai-api-key".to_string()).unwrap_or_default();
Command::new_sidecar("server")
    .env("OPENAI_API_KEY", api_key)
    .spawn()?;
```

这样 server 代码无需修改，仍通过 `process.env.OPENAI_API_KEY` 获取 key。

## 项目结构

实现后的目录结构：

```
desktop/
├── README.md              # 本文档
├── package.json           # Tauri CLI 依赖
├── src-tauri/
│   ├── Cargo.toml         # Rust 依赖（keyring, tauri）
│   ├── tauri.conf.json    # Tauri 配置
│   ├── src/
│   │   ├── main.rs        # 入口
│   │   ├── keychain.rs    # Keychain 读写
│   │   └── sidecar.rs     # Sidecar 管理
│   └── icons/             # 应用图标
└── scripts/
    └── build-server.mjs   # 打包 server 为 sidecar
```

## 实现步骤

### Phase 1：方案文档（当前）

- [x] 更新 `desktop/README.md`，写清楚架构、启动策略、Keychain 策略
- [ ] 不改业务代码

### Phase 2：最小桌面壳

- [ ] 在 `desktop/` 初始化 Tauri 项目
- [ ] 配置 WebView 指向 Vite build 产物
- [ ] 添加启动说明
- [ ] 验证桌面壳能打开 Emerge UI

### Phase 3：Sidecar 集成

- [ ] 配置 Tauri sidecar 启动 API server
- [ ] 添加健康检查等待逻辑
- [ ] 处理进程生命周期（退出时清理 sidecar）

### Phase 4：Keychain 集成

- [ ] 实现 Rust keychain 命令
- [ ] 前端检测桌面模式并调用 keychain API
- [ ] Tauri 主进程注入 key 到 sidecar 环境变量
- [ ] UI 显示 keychain 状态

## 开发环境要求

- Node.js 20+
- Rust toolchain（rustup）
- Tauri CLI：`cargo install tauri-cli`
- Windows: WebView2 Runtime（Windows 11 自带）
- macOS: Xcode Command Line Tools
- Linux: webkit2gtk

## 启动命令

### 开发

```bash
# 终端 1：启动 API + Vite（现有方式）
cd dev/web/emerge
npm run dev

# 终端 2：启动 Tauri 开发窗口
cd dev/web/emerge/desktop
npm run tauri dev
```

### 构建

```bash
cd dev/web/emerge/desktop

# 1. 构建前端
cd ../app && npm run build && cd ../desktop

# 2. 构建 Tauri 应用
npm run tauri build
# 产出在 desktop/src-tauri/target/release/bundle/
```

## 与现有 Web 模式的兼容性

| 场景 | Web 模式 | Desktop 模式 |
|------|----------|--------------|
| API key 存储 | 环境变量 / 运行时传入 | OS Keychain |
| settings.json | 存储非敏感配置 | 存储非敏感配置 |
| 启动方式 | `npm run dev` | 双击应用图标 |
| API 进程 | 手动或 dev.mjs 启动 | Tauri sidecar 自动启动 |
| 前端代码 | 无需修改 | 无需修改（可选添加 keychain 桥接） |

## 已知限制

1. **不做自动更新** - 用户需手动下载新版本。
2. **不做签名发布** - 开发阶段不处理代码签名。
3. **不做多平台安装包** - 当前只验证 Windows 构建。
4. **Sidecar 打包体积** - Node.js server 需要打包为独立可执行文件，可能增加 30-50 MB。

## 参考资源

- [Tauri 2 官方文档](https://v2.tauri.app/)
- [Tauri Sidecar 指南](https://v2.tauri.app/develop/sidecar/)
- [keyring crate](https://crates.io/crates/keyring)
- [Tauri Plugin Shell](https://v2.tauri.app/plugin/shell/)
