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

### 建议步骤

1. 跑所有测试。
2. 修复所有 P0 回归。
3. 更新 `README.md`、`app/README.md`、`server/README.md`。
4. 更新 `docs/mvp-completion/`。
5. 更新截图。
6. 做 secret scan。
7. 写 `docs/mvp-completion/08-KNOWN-ISSUES.md`。
8. 更新 `STATUS.md` 阶段。

### 必跑命令

```powershell
cd dev\web\emerge\app
npm run typecheck
npm run build
```

```powershell
python test-temp\emerge\run-ui-smokes-with-api.py
```

```powershell
cd dev\web\emerge
npm run dev:check
```

### Secret scan

```powershell
Get-ChildItem -Recurse dev\web\emerge -File |
  Select-String -Pattern 'sk-','apiKey":','OPENAI_API_KEY='
```

### 发布检查表

- [ ] App 可打开。
- [ ] API 可连接。
- [ ] 模型设置可保存。
- [ ] Ollama embedding 可测试。
- [ ] 文件导入可用。
- [ ] URL 捕获可用。
- [ ] 笔记创建可用。
- [ ] Search 可用。
- [ ] Ask 可用。
- [ ] Trace 可用。
- [ ] Source preview 可用。
- [ ] Reindex 可用。
- [ ] 删除清理可用。
- [ ] 错误状态可读。
- [ ] 没有真实 key。

### 注意事项

- 如果某个 P1 功能未做，写入 Known Issues，不要假装完成。
- 不要在最后一轮做大重构。
- 发布文档要面向用户，不要只面向开发者。
