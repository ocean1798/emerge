# iter-024 MVP Hardening Release

## 需求

### 解决的问题

核心功能完成后，需要做发布前硬化：测试、文档、错误状态、截图、敏感信息扫描和已知问题清单。否则 MVP 仍只是开发态原型。

### 验收标准

- `npm run typecheck` 通过。
- `npm run build` 通过。
- 全量 UI smoke 通过。
- README 能指导用户启动 App 和 API。
- 文档说明 LLM/Ollama 配置。
- 没有真实 API key 泄露。
- 已知问题写入文档。
- 截图更新。

### 不做的事

- 不做商业发布页。
- 不做完整安装包。
- 不做云同步。

### 依赖

- iter-018 至 iter-022 P0 完成。
- iter-023 可选。

## 开发笔记

### 执行步骤

1. ✅ 跑 `npm run typecheck` - 通过
2. ✅ 跑 `npm run build` - 通过
3. ✅ 做 secret scan - 无真实 API key 泄露
4. ✅ 更新 `README.md` - 面向用户，包含快速开始、配置说明、核心功能
5. ✅ 更新 `app/README.md` - 面向用户，包含功能概览、状态指示
6. ✅ 更新 `server/README.md` - 面向用户，包含配置说明、API 接口、故障排查
7. ✅ 写 `docs/mvp-completion/08-KNOWN-ISSUES.md` - 已知问题清单
8. ✅ 更新 `docs/mvp-completion/README.md` - 包含已知问题引用
9. ✅ 更新 `STATUS.md` - 阶段改为 release
10. ✅ 更新 `ITERATION.md` - iter-024 标记为进行中
11. ✅ 更新 `dev-plan.md` - 任务 25 标记为进行中

### 必跑命令结果

```powershell
cd dev\web\emerge\app
npm run typecheck
# 输出: tsc --noEmit (无错误)

npm run build
# 输出: ✓ built in 1.42s
```

```powershell
cd dev\web\emerge
npm run dev:check
# 输出: API DOWN, App DOWN (预期，因为服务未运行)
```

### Secret scan 结果

扫描模式：`sk-`、`apiKey":`、`OPENAI_API_KEY=`

匹配文件：
- `app/src/i18n.tsx` - 仅翻译文案 "API Key"
- `docs/mvp-completion/04-TEST-PLAN.md` - 文档中的搜索模式示例
- `iterations/iter-024-mvp-hardening-release/ITER.md` - 文档中的搜索模式示例
- `server/.env.example` - 示例配置文件，使用占位符
- `server/README.md` - 文档中的示例配置

**结论**：无真实 API key 泄露。所有匹配均为文档或示例中的占位符。

### 发布检查表

- [x] `npm run typecheck` 通过
- [x] `npm run build` 通过
- [x] 无真实 API key 泄露
- [x] README 能指导用户启动 App 和 API
- [x] 文档说明 LLM/Ollama 配置
- [x] 已知问题写入文档
- [ ] App 可打开（需手动验证）
- [ ] API 可连接（需手动验证）
- [ ] 模型设置可保存（需手动验证）
- [ ] Ollama embedding 可测试（需手动验证）
- [ ] 文件导入可用（需手动验证）
- [ ] URL 捕获可用（需手动验证）
- [ ] 笔记创建可用（需手动验证）
- [ ] Search 可用（需手动验证）
- [ ] Ask 可用（需手动验证）
- [ ] Trace 可用（需手动验证）
- [ ] Source preview 可用（需手动验证）
- [ ] Reindex 可用（需手动验证）
- [ ] 删除清理可用（需手动验证）
- [ ] 错误状态可读（需手动验证）
- [ ] 截图更新（需手动截图）

### 修改/新建文件清单

**新建文件**：
- `docs/mvp-completion/08-KNOWN-ISSUES.md` - 已知问题清单

**修改文件**：
- `README.md` - 重写为用户友好的快速开始指南
- `app/README.md` - 重写为用户友好的功能概览
- `server/README.md` - 重写为用户友好的配置和 API 文档
- `docs/mvp-completion/README.md` - 更新当前状态和已知问题引用
- `STATUS.md` - 阶段从 core-dev 改为 release
- `ITERATION.md` - iter-024 标记为进行中
- `dev-plan.md` - 任务 25 标记为进行中
- `iterations/iter-024-mvp-hardening-release/ITER.md` - 添加开发笔记

### 已知问题摘要

详见 `docs/mvp-completion/08-KNOWN-ISSUES.md`

**高优先级 (P0)**：
1. API Key 需要每次启动时重新输入
2. URL 抓取仅支持公开静态页面

**中优先级 (P1)**：
3. 原始内容预览仅显示索引片段
4. 桌面应用尚未打包
5. Embedding 模型需要本地安装 Ollama
6. 批量导入大文件可能较慢

**低优先级 (P2)**：
7. 移动端布局为简化版
8. 国际化支持有限
9. 本地数据存储为单 JSON 文件
10. API 仅监听 localhost
11. 无数据导出/备份功能

### 注意事项

- 如果某个 P1 功能未做，写入 Known Issues，不要假装完成。
- 不要在最后一轮做大重构。
- 发布文档要面向用户，不要只面向开发者。
