export type AssetKind = "file" | "url" | "note" | "folder" | "collection";

export type AssetStatus =
  | "queued"
  | "indexing"
  | "ready"
  | "partial"
  | "error"
  | "stale";

export type SourceFilter =
  | "all"
  | "local-files"
  | "notes"
  | "urls"
  | "collections"
  | "needs-review";

export type ObjectFilter = "all" | "ready" | "in-progress" | "needs-review";

export interface Asset {
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
  owner?: string;
}

export interface Topic {
  name: string;
  weight: number;
}

export interface Entity {
  name: string;
  kind: "person" | "product" | "company" | "concept" | "system";
  confidence: number;
}

export interface Evidence {
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

export interface Relation {
  source: string;
  target: string;
  kind: "supports" | "extends" | "competes-with" | "depends-on";
  confidence: number;
}

export interface SuggestedAction {
  action_id: string;
  label: string;
  kind: "ask" | "summarize" | "compare" | "trace" | "export";
}

export interface SemanticSnapshot {
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

export type PipelineStepName =
  | "ingest"
  | "parse"
  | "snapshot"
  | "index"
  | "verify";

export type PipelineStepStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "skipped";

export interface PipelineStep {
  name: PipelineStepName;
  status: PipelineStepStatus;
  message?: string;
  duration_ms?: number;
}

export interface PipelineRun {
  run_id: string;
  asset_id: string;
  steps: PipelineStep[];
  started_at: string;
  finished_at?: string;
}

export interface TraceEvent {
  trace_id: string;
  asset_id: string;
  run_id?: string;
  kind: PipelineStepName | "metadata" | "ask" | "search" | string;
  status: PipelineStepStatus;
  title: string;
  message?: string;
  duration_ms?: number;
  created_at: string;
  details?: Record<string, unknown>;
}

export interface ObjectTrace {
  asset_id: string;
  title: string;
  status: AssetStatus;
  runCount: number;
  eventCount: number;
  lastEventAt?: string;
  runs: PipelineRun[];
  events: TraceEvent[];
}

export interface AskCitation {
  citation_id: string;
  asset_id: string;
  chunk_id?: string;
  evidence_id: string;
  label: string;
  quote: string;
  score: number;
  match_type: "lexical" | "hybrid";
  source_uri?: string;
  location?: {
    page?: number;
    section?: string;
    offset_start?: number;
    offset_end?: number;
  };
}

export interface SearchResult extends AskCitation {}

export type SearchStatus = "idle" | "loading" | "success" | "error";

export interface ObjectPreviewChunk {
  chunk_id: string;
  evidence_id: string;
  label: string;
  text: string;
  source_uri?: string;
  location?: Evidence["location"];
  embedding_model?: string | null;
  indexed_at?: string | null;
}

export interface ObjectPreview {
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
  chunks: ObjectPreviewChunk[];
}

export type AskStatus = "idle" | "loading" | "success" | "error";

export interface AskResult {
  status: AskStatus;
  question?: string;
  answer?: string;
  provider?: string;
  providerLabel?: string;
  model?: string;
  error?: string;
  citations?: AskCitation[];
  retrievalMode?: "lexical" | "hybrid";
  embeddingError?: string | null;
}

export interface IndexStatus {
  ok: boolean;
  assets: number;
  assetsWithChunks: number;
  totalChunks: number;
  embeddedChunks: number;
  lexicalChunks: number;
  staleChunks: number;
  embeddingModels: string[];
  currentModel: string | null;
}

export interface ReindexResult {
  ok: boolean;
  reindexed: number;
  embedded?: number;
  model?: string;
  error?: string;
  fallback?: string;
}

export interface SourceDocument {
  source_id: string;
  asset_id: string;
  content: string;
  char_count: number;
  truncated: boolean;
  created_at: string;
}

export interface AskRun {
  run_id: string;
  asset_id?: string;
  question: string;
  answer_preview: string;
  provider?: string;
  retrieval_mode?: "lexical" | "hybrid";
  citations_count: number;
  status: "succeeded" | "failed";
  error?: string;
  created_at: string;
}

export interface SearchRun {
  run_id: string;
  asset_id?: string;
  query: string;
  result_count: number;
  retrieval_mode?: "lexical" | "hybrid";
  status: "succeeded" | "failed";
  error?: string;
  created_at: string;
}

export interface AskRun {
  run_id: string;
  asset_id?: string;
  question: string;
  answer_preview: string;
  provider?: string;
  retrieval_mode?: "lexical" | "hybrid";
  citations_count: number;
  status: "succeeded" | "failed";
  error?: string;
  created_at: string;
}

export interface SearchRun {
  run_id: string;
  asset_id?: string;
  query: string;
  result_count: number;
  retrieval_mode?: "lexical" | "hybrid";
  status: "succeeded" | "failed";
  error?: string;
  created_at: string;
}
