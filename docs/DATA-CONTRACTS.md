# 数据契约草案

## Asset

```ts
type AssetKind = "file" | "url" | "note" | "folder" | "collection";
type AssetStatus = "queued" | "indexing" | "ready" | "partial" | "error" | "stale";

interface Asset {
  asset_id: string;
  kind: AssetKind;
  title: string;
  source_uri: string;
  storage_key?: string;
  mime_type?: string;
  size_bytes?: number;
  status: AssetStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
  snapshot_id?: string;
}
```

## SemanticSnapshot

```ts
interface SemanticSnapshot {
  snapshot_id: string;
  asset_id: string;
  schema_version: string;
  summary: string;
  topics: Topic[];
  entities: Entity[];
  evidence: Evidence[];
  relations: Relation[];
  suggested_actions: SuggestedAction[];
  confidence: number;
  freshness: "fresh" | "stale" | "unknown";
  generated_at: string;
}
```

## Evidence

```ts
interface Evidence {
  evidence_id: string;
  asset_id: string;
  quote: string;
  location?: {
    page?: number;
    section?: string;
    offset_start?: number;
    offset_end?: number;
  };
  confidence: number;
}
```

## PipelineRun

```ts
type PipelineStepStatus = "queued" | "running" | "succeeded" | "failed" | "skipped";

interface PipelineRun {
  run_id: string;
  asset_id: string;
  steps: PipelineStep[];
  started_at: string;
  finished_at?: string;
}

interface PipelineStep {
  name: "ingest" | "parse" | "snapshot" | "index" | "verify";
  status: PipelineStepStatus;
  message?: string;
  duration_ms?: number;
}
```

## AskResponse

```ts
interface AskResponse {
  provider: "local-retrieval" | "openai-compatible";
  providerLabel: string;
  model: string;
  answer: string;
  citations: Citation[];
  retrieval: {
    mode: "lexical" | "hybrid";
    embeddingModel?: string | null;
    embeddingError?: string | null;
  };
}

interface Citation {
  citation_id: string;
  asset_id: string;
  chunk_id?: string;
  evidence_id: string;
  label: string;
  quote: string;
  score: number;
  match_type: "lexical" | "hybrid";
  source_uri?: string;
  location?: Evidence["location"];
}
```

## SearchChunk

```ts
interface SearchChunk {
  chunk_id: string;
  asset_id: string;
  evidence_id: string;
  title: string;
  source_uri: string;
  text: string;
  location?: Evidence["location"];
  embedding?: number[] | null;
  embedding_model?: string | null;
  indexed_at?: string | null;
}
```

## ObjectPreview

```ts
interface ObjectPreview {
  asset_id: string;
  title: string;
  kind: AssetKind;
  source_uri: string;
  mime_type?: string;
  storage_key?: string;
  chunkCount: number;
  returnedChunks: number;
  indexedChars: number;
  isPartial: boolean;
  generated_at?: string;
  chunks: Array<{
    chunk_id: string;
    evidence_id: string;
    label: string;
    text: string;
    source_uri?: string;
    location?: Evidence["location"];
    embedding_model?: string | null;
    indexed_at?: string | null;
  }>;
}
```

`GET /api/assets/:asset_id/preview` 返回当前进入索引的内容片段。它不代表完整原文，只代表 Ask/Search 可用的索引材料。

## SearchResponse

```ts
interface SearchResponse {
  query: string;
  asset_id?: string;
  results: Citation[];
  retrieval: {
    mode: "lexical" | "hybrid";
    embeddingModel?: string | null;
    embeddingError?: string | null;
  };
}
```

`GET /api/search` 返回 evidence 级结果，前端可直接用于语义搜索结果带和 Ask citations。

## API 草案

```text
GET    /api/assets
GET    /api/assets/:asset_id
GET    /api/assets/:asset_id/snapshot
GET    /api/assets/:asset_id/preview
GET    /api/pipeline/runs?asset_id=:asset_id
GET    /api/search?q=:query&asset_id=:asset_id
GET    /api/health
GET    /api/ollama/tags
POST   /api/embed
POST   /api/url/fetch
POST   /api/llm/config
POST   /api/llm/test
POST   /api/ask
POST   /api/ingest
PATCH  /api/assets/:asset_id
DELETE /api/assets/:asset_id
```

第一阶段前端先用 mock adapter 实现同一组接口形状，后续替换为本地 API。

## ProviderHealth

```ts
interface ProviderHealth {
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
    };
  };
}
```

## EmbedRequest

```ts
interface EmbedRequest {
  input: string | string[];
}
```

## UrlFetchRequest

```ts
interface UrlFetchRequest {
  url: string;
}

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

`POST /api/url/fetch` 只接受 `http` / `https`。当前实现为 MVP 级 HTML 文本抽取，不保证复杂网页正文质量。

## LlmConfigRequest

```ts
interface LlmConfigRequest {
  baseUrl: string;
  providerLabel: string;
  model: string;
  chatPath: string;
  apiKey?: string;
}

interface LlmConfigResponse {
  ok: boolean;
  provider: ProviderHealth["providers"]["openaiCompatible"];
}
```

`baseUrl`、`providerLabel`、`model`、`chatPath` 会写入 `server/local-data/settings.json`。`apiKey` 只允许进入本地 API 运行时配置。响应和 settings 文件不得回传或保存真实 key。

## LlmTestResponse

```ts
interface LlmTestResponse {
  ok: boolean;
  status: "missing_key" | "connected" | "request_failed";
  provider: ProviderHealth["providers"]["openaiCompatible"];
  providerLabel?: string;
  model?: string;
  sample?: string;
  error?: string;
}
```

`missing_key` 表示 OpenAI-compatible 配置缺少 `OPENAI_API_KEY`；`connected` 才表示真实 LLM chat 请求已通过。

## AskRequest

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

## IngestRequest

```ts
interface IngestRequest {
  kind?: "file" | "url" | "note" | "folder" | "collection";
  title: string;
  source_uri?: string;
  mime_type?: string;
  size_bytes?: number;
  content: string;
}
```

笔记创建复用 `POST /api/ingest`，但 `kind` 必须传 `note`。前端快照导出不新增 API，直接把当前 `asset + snapshot` 下载为 JSON。

## UpdateAssetMetadataRequest

```ts
interface UpdateAssetMetadataRequest {
  title: string;
  tags: string[];
}

interface UpdateAssetMetadataResponse {
  ok: boolean;
  asset: Asset;
  snapshot: SemanticSnapshot | null;
}
```

`PATCH /api/assets/:asset_id` 只修改本地 store 元数据。标签会去空、去重，并限制数量；标题会同步到 chunks title。

## DeleteAssetResponse

```ts
interface DeleteAssetResponse {
  ok: boolean;
  asset_id: string;
  title: string;
}
```

`DELETE /api/assets/:asset_id` 只作用于本地 store。删除时必须同步移除同一 `asset_id` 下的 snapshot、pipeline runs 和 chunks。
