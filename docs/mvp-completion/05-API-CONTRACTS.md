# 05 API Contracts

## 约定

所有 API 都运行在：

```text
http://127.0.0.1:8787
```

所有 JSON 成功响应应包含可判断字段。建议：

```ts
interface Success<T> {
  ok: true;
  [key: string]: unknown;
}
```

错误响应：

```ts
interface ApiError {
  ok: false;
  error: string;
  code?: string;
  details?: unknown;
}
```

前端调用入口统一写在：

```text
app/src/api/client.ts
```

## Health

```text
GET /api/health
```

返回：

```ts
interface HealthResponse {
  ok: boolean;
  providers: {
    port: number;
    openaiCompatible: {
      baseUrl: string;
      model: string;
      providerLabel: string;
      chatPath: string;
      apiKeyConfigured: boolean;
      providerSettingsPersisted: boolean;
      providerSettingsError?: string;
      apiKeyStorage: "runtime-only";
      organizationConfigured: boolean;
      projectConfigured: boolean;
    };
    ollama: {
      baseUrl: string;
      embedModel: string;
      providerSettingsPersisted: boolean;
      providerSettingsError?: string;
    };
  };
}
```

## Assets

```text
GET /api/assets
```

返回：

```ts
interface AssetsResponse {
  assets: Asset[];
  snapshots: Record<string, SemanticSnapshot>;
  pipelineRuns: PipelineRun[];
  index: {
    chunks: number;
    embeddedChunks: number;
  };
}
```

## Ingest

```text
POST /api/ingest
```

请求：

```ts
interface IngestRequest {
  kind?: "file" | "url" | "note" | "folder" | "collection";
  title: string;
  source_uri: string;
  mime_type?: string;
  size_bytes?: number;
  content: string;
}
```

返回：

```ts
interface IngestResponse {
  ok: true;
  asset: Asset;
  snapshot: SemanticSnapshot;
  pipelineRun: PipelineRun;
  index: {
    mode: "lexical" | "hybrid";
    error: string | null;
    model: string | null;
  };
}
```

后续要求：

- 保存 `SourceDocument`。
- 写入 trace events。
- 对失败文件返回可读错误，不影响其它文件导入。

## Search

```text
GET /api/search?q=:query&asset_id=:asset_id&limit=8
```

返回：

```ts
interface SearchResponse {
  query: string;
  asset_id?: string;
  results: Citation[];
  retrieval: {
    mode?: "lexical" | "hybrid";
    embeddingModel?: string | null;
    embeddingError?: string | null;
  };
}
```

后续要求：

- Search 应写入 `SearchRun`。
- Search 应写入 trace event。

## Ask

```text
POST /api/ask
```

请求：

```ts
interface AskRequest {
  question: string;
  assetId?: string;
  assetTitle?: string;
  context?: Array<{
    label?: string;
    asset_title?: string;
    quote?: string;
    text?: string;
  }>;
}
```

返回：

```ts
interface AskResponse {
  provider: "local-retrieval" | "openai-compatible" | string;
  providerLabel?: string;
  model: string;
  answer: string;
  citations?: Citation[];
  retrieval?: {
    mode?: "lexical" | "hybrid";
    embeddingModel?: string | null;
    embeddingError?: string | null;
  };
}
```

后续要求：

- 成功和失败都写 `AskRun`。
- 成功和失败都写 trace event。
- 错误不能泄露 API key。

## LLM Config

```text
POST /api/llm/config
```

请求：

```ts
interface LlmConfigRequest {
  baseUrl: string;
  providerLabel: string;
  model: string;
  chatPath?: string;
  apiKey?: string;
  embeddingBaseUrl?: string;
  embeddingModel?: string;
}
```

规则：

- `chatPath` 可为空，默认 `/chat/completions`。
- 如果 `baseUrl` 以 `/chat/completions` 结尾，后端应拆分。
- `apiKey` 只进入当前进程内存，不写入 `settings.json`。

返回：

```ts
interface LlmConfigResponse {
  ok: true;
  providers: HealthResponse["providers"];
  provider: HealthResponse["providers"]["openaiCompatible"];
  ollama: HealthResponse["providers"]["ollama"];
}
```

## LLM Test

```text
POST /api/llm/test
```

返回：

```ts
interface LlmTestResponse {
  ok: boolean;
  status: "missing_key" | "connected" | "request_failed";
  provider: HealthResponse["providers"]["openaiCompatible"];
  providerLabel?: string;
  model?: string;
  sample?: string;
  error?: string;
}
```

## Ollama Test

```text
POST /api/ollama/test
```

返回：

```ts
interface OllamaTestResponse {
  ok: boolean;
  status: "connected" | "request_failed";
  provider: HealthResponse["providers"]["ollama"];
  dimensions?: number | null;
  error?: string;
}
```

当前机器已验证：

```text
model: qwen3-embedding:8b
dimensions: 4096
```

## Trace

需要新增或补齐：

```text
GET /api/assets/:asset_id/trace
GET /api/trace?limit=50
```

返回：

```ts
interface ObjectTraceResponse {
  ok: true;
  trace: {
    asset_id: string;
    title: string;
    status: AssetStatus;
    runCount: number;
    eventCount: number;
    lastEventAt?: string;
    runs: PipelineRun[];
    events: TraceEvent[];
  };
}
```

## Source Document

需要新增：

```text
GET /api/assets/:asset_id/source
```

返回：

```ts
interface SourceDocumentResponse {
  ok: true;
  source: SourceDocument;
}
```

## Reindex

需要新增：

```text
GET  /api/index/status
POST /api/assets/:asset_id/reindex
POST /api/reindex
```

`GET /api/index/status` 返回：

```ts
interface IndexStatusResponse {
  ok: true;
  chunks: number;
  embeddedChunks: number;
  lexicalOnlyChunks: number;
  embeddingModel: string;
  staleChunks: number;
  assets: Array<{
    asset_id: string;
    title: string;
    chunks: number;
    embeddedChunks: number;
    staleChunks: number;
  }>;
}
```

Reindex 返回：

```ts
interface ReindexResponse {
  ok: true;
  asset_id?: string;
  updatedChunks: number;
  skippedChunks: number;
  mode: "hybrid" | "lexical";
  embeddingModel?: string | null;
  error?: string | null;
}
```

## History

需要新增：

```text
GET /api/history/ask?asset_id=:asset_id&limit=20
GET /api/history/search?asset_id=:asset_id&limit=20
```

返回：

```ts
interface AskHistoryResponse {
  ok: true;
  runs: AskRun[];
}

interface SearchHistoryResponse {
  ok: true;
  runs: SearchRun[];
}
```

## URL Fetch

```text
POST /api/url/fetch
```

请求：

```ts
interface UrlFetchRequest {
  url: string;
}
```

返回：

```ts
interface UrlFetchResponse {
  ok: boolean;
  url: string;
  finalUrl: string;
  title: string;
  contentType: string;
  text: string;
  truncated: boolean;
  fetchedAt: string;
}
```

限制：

- 只支持公开 `http` / `https`。
- 不承诺处理登录页、反爬、复杂 JS 渲染。
