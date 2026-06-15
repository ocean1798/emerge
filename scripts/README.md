# scripts

项目脚本目录。

后续可放：

- mock data generator
- schema validation
- local migration
- snapshot export
- visual regression helpers

重复超过三次的手工操作，应沉淀为这里的脚本。

## dev.mjs

一键本地开发启动器。

```bash
cd dev/web/emerge
npm run dev
```

行为：

- 如果 API 或前端已在对应端口运行，会复用已有服务。
- 如果未运行，会分别启动 `server/npm run dev` 和 `app/npm run dev`。
- `npm run dev:check` 只做健康检查，不启动服务。
