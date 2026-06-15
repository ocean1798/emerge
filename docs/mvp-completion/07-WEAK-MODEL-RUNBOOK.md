# 07 Weak Model Runbook

## 适用对象

如果后续 Codex 额度用完，需要用能力较弱的模型继续开发，请把这份文档给它。它应该按本文档执行，不要自由发挥。

## 永远先做这 5 步

1. 读 `docs/mvp-completion/00-HANDOFF-CONTEXT.md`。
2. 读当前迭代的 `iterations/iter-NNN-*/ITER.md`。
3. 用 `rg` 搜索相关函数和组件。
4. 先改最小文件集合。
5. 跑测试。

## 不要做

- 不要重写整个 App。
- 不要替换技术栈。
- 不要安装大型新依赖。
- 不要改根目录。
- 不要写真实 API key。
- 不要删除历史文件。
- 不要把 mock 数据当唯一真相。
- 不要把 API offline 当成 LLM 失败。

## 常用命令

从工作区根目录：

```powershell
cd dev\web\emerge
npm run dev
```

检查：

```powershell
npm run dev:check
```

前端：

```powershell
cd dev\web\emerge\app
npm run typecheck
npm run build
```

Smoke：

```powershell
python test-temp\emerge\run-ui-smokes-with-api.py
```

## 常见问题

### 问题：页面显示“本地 API 未连接”

原因通常是只启动了 Vite 前端，没有启动本地 API。

处理：

1. 在 `dev/web/emerge` 运行 `npm run dev`。
2. 现在 `dev/web/emerge/app` 下的 `npm run dev` 也会委托到上层统一启动器；`npm run dev:vite` 会先检查并自动拉起本地 API。
3. 如果 API 仍离线，运行：

```powershell
cd dev\web\emerge
npm run dev:check
```

### 问题：模型设置保存失败

检查：

- API 是否在线。
- `/api/llm/config` 是否存在。
- 请求体是否是 JSON。
- `chatPath` 是否允许为空。

### 问题：LLM 未配置

这不是 API offline。含义是本地 API 在线，但没有 runtime API key。

解决：

- 在模型设置中临时输入 key。
- 或在 `server/.env.local` 配置。

禁止：

- 不要把 key 写进 README。
- 不要把 key 写进 `settings.json`。

### 问题：Embedding 不可用

检查：

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:11434/api/tags
```

检查 Emerge API：

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8787/api/ollama/test
```

如果 Ollama 不可用，系统必须回退到词法检索。

## 开发顺序模板

每个迭代按这个顺序：

1. 修改 `types/domain.ts`。
2. 修改 `server/src/store.js`。
3. 修改 `server/src/index.js`。
4. 修改 `app/src/api/client.ts`。
5. 修改 UI 组件。
6. 修改 i18n。
7. 增加或更新 smoke test。
8. 更新文档。

如果某一步不需要，写在迭代文档里说明“不需要”。

## API 开发模板

新增 API 时：

1. 在 `server/src/index.js` 加路由。
2. 业务逻辑放到 `store.js` 或 provider，不要堆在路由里。
3. 返回 `{ ok: true, ... }`。
4. 错误返回 `{ ok: false, error }`。
5. 前端在 `app/src/api/client.ts` 加函数。
6. 写一个测试脚本或 smoke。

## UI 开发模板

新增 UI 时：

1. 先确定放在哪个现有区域。
2. 新组件放 `app/src/components/`。
3. 文案放 `i18n.tsx`。
4. 样式放 `styles.css`。
5. 必须有 loading、empty、error 状态。
6. 截图放 `artifacts/`。

## 测试脚本模板

Playwright 脚本放：

```text
test-temp/emerge/feature-name-smoke.py
```

基本结构：

```py
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 920})
    page.goto("http://127.0.0.1:5173/")
    page.wait_for_load_state("networkidle")
    # actions
    # assertions
    browser.close()
```

如果需要 API，优先让 `run-ui-smokes-with-api.py` 统一启动。

## 完成标准

一个迭代完成必须满足：

- 功能可用。
- UI 有错误状态。
- 相关 smoke 通过。
- `npm run typecheck` 通过。
- 文档已更新。
- 没有真实 key 泄露。

## 交接回复模板

完成后回复用户：

```text
已完成 iter-NNN：<名称>。

改动：
- <文件/功能>

验证：
- <命令> 通过

注意：
- <未完成或后续事项>
```

不要写长篇无关解释。
