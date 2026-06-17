import type {
  AskCitation,
  AskRun,
  Asset,
  IndexStatus,
  ObjectTrace,
  ObjectPreview,
  PipelineRun,
  ReindexResult,
  SearchResult,
  SearchRun,
  SemanticSnapshot,
} from "../types/domain";

export interface AskContextItem {
  label?: string;
  asset_title?: string;
  quote?: string;
  text?: string;
}

export interface AskApiResponse {
  provider: string;
  providerLabel?: string;
  model: string;
  answer: string;
  citations?: AskCitation[];
  retrieval?: {
    mode?: "lexical" | "hybrid";
    embeddingModel?: string | null;
    embeddingError?: string | null;
  };
}

export interface LlmTestResponse {
  ok: boolean;
  status: "missing_key" | "connected" | "request_failed";
  provider: OpenAICompatibleProviderConfig;
  providerLabel?: string;
  model?: string;
  sample?: string;
  error?: string;
}

export interface OpenAICompatibleProviderConfig {
  apiKeyConfigured: boolean;
  providerSettingsPersisted: boolean;
  providerSettingsError?: string;
  apiKeyStorage: "runtime-only";
  providerLabel: string;
  model: string;
  baseUrl: string;
  chatPath: string;
}

export interface OllamaEmbeddingConfig {
  baseUrl: string;
  embedModel: string;
  providerSettingsPersisted: boolean;
  providerSettingsError?: string;
}

export interface LlmConfigInput {
  baseUrl: string;
  providerLabel: string;
  model: string;
  chatPath?: string;
  apiKey?: string;
  embeddingBaseUrl?: string;
  embeddingModel?: string;
}

export async function askLocalApi(input: {
  question: string;
  assetId?: string;
  assetTitle?: string;
  context?: AskContextItem[];
}) {
  const response = await fetch("http://127.0.0.1:8787/api/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }

  return payload as AskApiResponse;
}

export async function getApiHealth() {
  const response = await fetch("http://127.0.0.1:8787/api/health");
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }

  return payload as {
    ok: boolean;
    providers: {
      openaiCompatible: {
        apiKeyConfigured: boolean;
        providerLabel: string;
        model: string;
        baseUrl: string;
        chatPath: string;
        providerSettingsPersisted: boolean;
        providerSettingsError?: string;
        apiKeyStorage: "runtime-only";
      };
      ollama: {
        baseUrl: string;
        embedModel: string;
        providerSettingsPersisted: boolean;
        providerSettingsError?: string;
      };
    };
  };
}

export async function testLlmConnection() {
  const response = await fetch("http://127.0.0.1:8787/api/llm/test", {
    method: "POST",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok && payload.status !== "request_failed") {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }

  return payload as LlmTestResponse;
}

export async function configureLlmProvider(input: LlmConfigInput) {
  const response = await fetch("http://127.0.0.1:8787/api/llm/config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("LLM config endpoint is unavailable; restart the local API.");
    }
    throw new Error(payload.error || `API failed with ${response.status}`);
  }

  return payload as {
    ok: boolean;
    providers: {
      openaiCompatible: OpenAICompatibleProviderConfig;
      ollama: OllamaEmbeddingConfig;
    };
    provider: OpenAICompatibleProviderConfig;
    ollama: OllamaEmbeddingConfig;
  };
}

export async function testEmbeddingConnection() {
  const response = await fetch("http://127.0.0.1:8787/api/ollama/test", {
    method: "POST",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok && payload.status !== "request_failed") {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }

  return payload as {
    ok: boolean;
    status: "connected" | "request_failed";
    provider: OllamaEmbeddingConfig;
    dimensions?: number | null;
    error?: string;
  };
}

export interface IngestApiResponse {
  ok: boolean;
  asset: Asset;
  snapshot: SemanticSnapshot;
  pipelineRun: PipelineRun;
}

export interface UrlFetchResponse {
  ok: boolean;
  url: string;
  finalUrl: string;
  title: string;
  contentType: string;
  text: string;
  truncated: boolean;
  fetchedAt: string;
}

export async function listLocalAssets() {
  const response = await fetch("http://127.0.0.1:8787/api/assets");
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }
  return {
    assets: (payload.assets ?? []) as Asset[],
    snapshots: (payload.snapshots ?? {}) as Record<string, SemanticSnapshot>,
    pipelineRuns: (payload.pipelineRuns ?? []) as PipelineRun[],
  };
}

export async function deleteLocalAsset(assetId: string) {
  const response = await fetch(
    `http://127.0.0.1:8787/api/assets/${encodeURIComponent(assetId)}`,
    {
      method: "DELETE",
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }

  return payload as {
    ok: boolean;
    asset_id: string;
    title: string;
  };
}

export async function updateLocalAssetMetadata(input: {
  assetId: string;
  title: string;
  tags: string[];
}) {
  const response = await fetch(
    `http://127.0.0.1:8787/api/assets/${encodeURIComponent(input.assetId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: input.title,
        tags: input.tags,
      }),
    },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }

  return payload as {
    ok: boolean;
    asset: Asset;
    snapshot: SemanticSnapshot | null;
  };
}

export async function getLocalObjectPreview(assetId: string, limit = 6) {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await fetch(
    `http://127.0.0.1:8787/api/assets/${encodeURIComponent(assetId)}/preview?${params}`,
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }

  return payload as {
    ok: boolean;
    preview: ObjectPreview;
  };
}

export interface ObjectSourceResponse {
  source_id: string;
  asset_id: string;
  title: string;
  kind: string;
  source_uri: string;
  content: string;
  char_count: number;
  truncated: boolean;
  created_at: string;
}

export async function getLocalObjectSource(assetId: string) {
  const response = await fetch(
    `http://127.0.0.1:8787/api/assets/${encodeURIComponent(assetId)}/source`,
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }

  return payload as {
    ok: boolean;
    source: ObjectSourceResponse;
  };
}

export async function getLocalObjectTrace(assetId: string) {
  const response = await fetch(
    `http://127.0.0.1:8787/api/assets/${encodeURIComponent(assetId)}/trace`,
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }

  return payload as {
    ok: boolean;
    trace: ObjectTrace;
  };
}

export async function searchLocalEvidence(input: {
  query: string;
  assetId?: string;
  limit?: number;
}) {
  const params = new URLSearchParams({
    q: input.query,
    limit: String(input.limit ?? 8),
  });
  if (input.assetId) params.set("asset_id", input.assetId);

  const response = await fetch(`http://127.0.0.1:8787/api/search?${params}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }

  return payload as {
    query: string;
    asset_id?: string;
    results: SearchResult[];
    retrieval: {
      mode?: "lexical" | "hybrid";
      embeddingModel?: string | null;
      embeddingError?: string | null;
    };
  };
}

export async function fetchUrlContent(url: string) {
  const response = await fetch("http://127.0.0.1:8787/api/url/fetch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }

  return payload as UrlFetchResponse;
}

export async function ingestLocalFile(input: {
  kind?: Asset["kind"];
  title: string;
  source_uri: string;
  mime_type?: string;
  size_bytes?: number;
  content: string;
}) {
  const response = await fetch("http://127.0.0.1:8787/api/ingest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }

  return payload as IngestApiResponse;
}

export async function getIndexStatus() {
  const response = await fetch("http://127.0.0.1:8787/api/index/status");
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }
  return payload as IndexStatus;
}

export async function reindexAsset(assetId: string) {
  const response = await fetch(
    `http://127.0.0.1:8787/api/assets/${encodeURIComponent(assetId)}/reindex`,
    { method: "POST" },
  );
  const payload = await response.json().catch(() => ({}));
  if (!response.ok && !payload.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }
  return payload as ReindexResult;
}

export async function reindexAll() {
  const response = await fetch("http://127.0.0.1:8787/api/reindex", {
    method: "POST",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok && !payload.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }
  return payload as ReindexResult;
}

export async function getAskHistory(input?: { assetId?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (input?.assetId) params.set("asset_id", input.assetId);
  if (input?.limit) params.set("limit", String(input.limit));
  const qs = params.toString();
  const response = await fetch(`http://127.0.0.1:8787/api/history/ask${qs ? `?${qs}` : ""}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }
  return payload as { ok: boolean; runs: AskRun[] };
}

export async function getSearchHistory(input?: { assetId?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (input?.assetId) params.set("asset_id", input.assetId);
  if (input?.limit) params.set("limit", String(input.limit));
  const qs = params.toString();
  const response = await fetch(`http://127.0.0.1:8787/api/history/search${qs ? `?${qs}` : ""}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `API failed with ${response.status}`);
  }
  return payload as { ok: boolean; runs: SearchRun[] };
}
