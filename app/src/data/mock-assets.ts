import type {
  Asset,
  PipelineRun,
  SemanticSnapshot,
  SourceFilter,
} from "../types/domain";

export const mockAssets: Asset[] = [
  {
    asset_id: "asset-whitepaper-v05",
    kind: "file",
    title: "Silicon Emergence Whitepaper v0.5",
    source_uri: "product/projects/20260609-硅基涌现白皮书/work/_drafts/MVP审视-v0.5白皮书对照分析.md",
    storage_key: "local://whitepaper/mvp-review-v05.md",
    mime_type: "text/markdown",
    size_bytes: 46238,
    status: "ready",
    tags: ["whitepaper", "strategy", "phase-1"],
    created_at: "2026-06-09T09:12:00+08:00",
    updated_at: "2026-06-13T15:42:00+08:00",
    snapshot_id: "snap-whitepaper-v05",
    owner: "Ocean",
  },
  {
    asset_id: "asset-prd-phase1",
    kind: "file",
    title: "Emerge Phase 1 PRD and Page Map",
    source_uri: "product/projects/20260609-硅基涌现白皮书/work/Emerge-Phase1-轻量PRD与页面地图.md",
    storage_key: "local://product/prd-phase1.md",
    mime_type: "text/markdown",
    size_bytes: 58814,
    status: "ready",
    tags: ["prd", "objects", "ui"],
    created_at: "2026-06-12T21:20:00+08:00",
    updated_at: "2026-06-13T18:16:00+08:00",
    snapshot_id: "snap-prd-phase1",
    owner: "Ocean",
  },
  {
    asset_id: "asset-hermes-claudecode",
    kind: "note",
    title: "Hermes, Claude Code, DeepSeek GUI strengths map",
    source_uri: "notes://product-inspiration/hermes-claudecode-deepseek",
    storage_key: "local://notes/inspiration-map.json",
    mime_type: "application/json",
    size_bytes: 16820,
    status: "indexing",
    tags: ["benchmark", "agent-ui", "workflow"],
    created_at: "2026-06-13T10:05:00+08:00",
    updated_at: "2026-06-13T19:04:00+08:00",
    snapshot_id: "snap-hermes-claudecode",
    owner: "Ocean",
  },
  {
    asset_id: "asset-gbrain-repo",
    kind: "url",
    title: "gbrain repository pattern notes",
    source_uri: "https://github.com/garrytan/gbrain",
    storage_key: "web://github/garrytan/gbrain",
    mime_type: "text/html",
    status: "partial",
    tags: ["github", "agent-memory", "open-source"],
    created_at: "2026-06-13T11:48:00+08:00",
    updated_at: "2026-06-13T18:57:00+08:00",
    snapshot_id: "snap-gbrain-repo",
    owner: "Ocean",
  },
  {
    asset_id: "asset-s3-object-model",
    kind: "note",
    title: "S3-compatible semantic object model",
    source_uri: "notes://architecture/s3-semantic-object-model",
    storage_key: "local://notes/s3-object-model.md",
    mime_type: "text/markdown",
    size_bytes: 14052,
    status: "stale",
    tags: ["storage", "s3", "semantic-object"],
    created_at: "2026-06-10T16:30:00+08:00",
    updated_at: "2026-06-11T13:18:00+08:00",
    snapshot_id: "snap-s3-object-model",
    owner: "Ocean",
  },
  {
    asset_id: "asset-local-rag-lab",
    kind: "collection",
    title: "Local RAG experiments and retrieval traces",
    source_uri: "collection://local-rag-lab",
    storage_key: "local://collections/rag-lab",
    status: "ready",
    tags: ["rag", "retrieval", "trace"],
    created_at: "2026-06-08T08:30:00+08:00",
    updated_at: "2026-06-13T12:02:00+08:00",
    snapshot_id: "snap-local-rag-lab",
    owner: "Ocean",
  },
  {
    asset_id: "asset-deepseek-gui",
    kind: "file",
    title: "DeepSeek GUI interaction reference screenshots",
    source_uri: "assets/ui-references/deepseek-gui-batch/",
    storage_key: "local://assets/deepseek-gui",
    mime_type: "image/png",
    status: "error",
    tags: ["visual", "reference", "needs-review"],
    created_at: "2026-06-12T23:10:00+08:00",
    updated_at: "2026-06-13T09:44:00+08:00",
    owner: "Ocean",
  },
  {
    asset_id: "asset-inbox-screens",
    kind: "folder",
    title: "Inbox screenshots waiting for semantic import",
    source_uri: "_inbox/product/screenshots/",
    storage_key: "local://inbox/product/screenshots",
    status: "queued",
    tags: ["inbox", "screenshots", "triage"],
    created_at: "2026-06-13T18:40:00+08:00",
    updated_at: "2026-06-13T18:40:00+08:00",
    owner: "Ocean",
  },
];

export const mockSnapshots: Record<string, SemanticSnapshot> = {
  "asset-whitepaper-v05": {
    snapshot_id: "snap-whitepaper-v05",
    asset_id: "asset-whitepaper-v05",
    schema_version: "0.1.0",
    summary:
      "Phase 1 should preserve the whitepaper ambition while narrowing delivery to a local-first semantic asset cockpit. The MVP risk is drifting into a generic chat shell instead of proving the object-centric workflow.",
    topics: [
      { name: "local-first", weight: 0.92 },
      { name: "semantic asset", weight: 0.88 },
      { name: "MVP cutline", weight: 0.74 },
    ],
    entities: [
      { name: "Emerge", kind: "product", confidence: 0.96 },
      { name: "Brain Layer", kind: "concept", confidence: 0.91 },
      { name: "RRF", kind: "system", confidence: 0.76 },
    ],
    evidence: [
      {
        evidence_id: "ev-whitepaper-01",
        asset_id: "asset-whitepaper-v05",
        quote:
          "原文档应该保留白皮书级愿景，但 Phase 1 需要收束为可验证的语义资产操作台。",
        location: { section: "修复建议" },
        confidence: 0.91,
      },
      {
        evidence_id: "ev-whitepaper-02",
        asset_id: "asset-whitepaper-v05",
        quote:
          "Objects 应成为默认入口，文件、快照、证据和操作历史必须在第一屏可见。",
        location: { section: "MVP 对照" },
        confidence: 0.89,
      },
    ],
    relations: [
      {
        source: "Whitepaper Vision",
        target: "Phase 1 Cutline",
        kind: "supports",
        confidence: 0.88,
      },
      {
        source: "Object-centric UI",
        target: "Generic Chat Shell",
        kind: "competes-with",
        confidence: 0.81,
      },
    ],
    suggested_actions: [
      { action_id: "act-whitepaper-ask", label: "Ask against MVP risks", kind: "ask" },
      { action_id: "act-whitepaper-compare", label: "Compare with PRD", kind: "compare" },
      { action_id: "act-whitepaper-export", label: "Export snapshot", kind: "export" },
    ],
    confidence: 0.9,
    freshness: "fresh",
    generated_at: "2026-06-13T18:42:00+08:00",
  },
  "asset-prd-phase1": {
    snapshot_id: "snap-prd-phase1",
    asset_id: "asset-prd-phase1",
    schema_version: "0.1.0",
    summary:
      "The PRD defines Phase 1 as a local-first personal Brain Layer. Its strongest product move is making Objects the default first screen, with semantic snapshots and pipeline visibility as primary UI material.",
    topics: [
      { name: "objects first", weight: 0.96 },
      { name: "semantic inspector", weight: 0.86 },
      { name: "pipeline visibility", weight: 0.82 },
    ],
    entities: [
      { name: "Objects", kind: "concept", confidence: 0.98 },
      { name: "Semantic Inspector", kind: "system", confidence: 0.93 },
      { name: "Pipeline Strip", kind: "system", confidence: 0.88 },
    ],
    evidence: [
      {
        evidence_id: "ev-prd-01",
        asset_id: "asset-prd-phase1",
        quote:
          "默认第一屏是 Objects，而不是 Chat：用户先看到自己的文件、语义快照、状态、证据和操作历史。",
        location: { section: "页面地图" },
        confidence: 0.95,
      },
      {
        evidence_id: "ev-prd-02",
        asset_id: "asset-prd-phase1",
        quote:
          "S3 产品隐喻不是存文件，而是让每个对象拥有稳定身份、快照版本和可迁移指针。",
        location: { section: "S3 产品隐喻" },
        confidence: 0.89,
      },
    ],
    relations: [
      {
        source: "Objects",
        target: "Semantic Inspector",
        kind: "depends-on",
        confidence: 0.9,
      },
      {
        source: "Pipeline Strip",
        target: "Trust",
        kind: "supports",
        confidence: 0.84,
      },
    ],
    suggested_actions: [
      { action_id: "act-prd-trace", label: "Open page trace", kind: "trace" },
      { action_id: "act-prd-summary", label: "Create build brief", kind: "summarize" },
      { action_id: "act-prd-ask", label: "Ask implementation scope", kind: "ask" },
    ],
    confidence: 0.93,
    freshness: "fresh",
    generated_at: "2026-06-13T18:46:00+08:00",
  },
  "asset-hermes-claudecode": {
    snapshot_id: "snap-hermes-claudecode",
    asset_id: "asset-hermes-claudecode",
    schema_version: "0.1.0",
    summary:
      "This note maps desirable qualities from agentic coding tools and GUI assistants: command confidence, traceability, fast file navigation, and visible reasoning artifacts.",
    topics: [
      { name: "agent workflow", weight: 0.88 },
      { name: "command surface", weight: 0.77 },
      { name: "traceable execution", weight: 0.7 },
    ],
    entities: [
      { name: "Claude Code", kind: "product", confidence: 0.96 },
      { name: "DeepSeek GUI", kind: "product", confidence: 0.78 },
      { name: "Hermes", kind: "product", confidence: 0.71 },
    ],
    evidence: [
      {
        evidence_id: "ev-hermes-01",
        asset_id: "asset-hermes-claudecode",
        quote:
          "产品应该吸收 coding agent 的执行透明度，但将入口重心放回个人资产。",
        location: { section: "benchmark notes" },
        confidence: 0.74,
      },
    ],
    relations: [
      {
        source: "Agent UI",
        target: "Semantic Asset Cockpit",
        kind: "extends",
        confidence: 0.72,
      },
    ],
    suggested_actions: [
      { action_id: "act-hermes-ask", label: "Extract UI patterns", kind: "ask" },
      { action_id: "act-hermes-compare", label: "Compare inspirations", kind: "compare" },
    ],
    confidence: 0.68,
    freshness: "unknown",
    generated_at: "2026-06-13T19:06:00+08:00",
  },
  "asset-gbrain-repo": {
    snapshot_id: "snap-gbrain-repo",
    asset_id: "asset-gbrain-repo",
    schema_version: "0.1.0",
    summary:
      "The repository has been imported as a web object, but only partial page metadata is available. It should remain visible without pretending that code-level analysis has completed.",
    topics: [
      { name: "memory", weight: 0.66 },
      { name: "github", weight: 0.62 },
      { name: "partial import", weight: 0.58 },
    ],
    entities: [
      { name: "gbrain", kind: "product", confidence: 0.7 },
      { name: "GitHub", kind: "company", confidence: 0.87 },
    ],
    evidence: [
      {
        evidence_id: "ev-gbrain-01",
        asset_id: "asset-gbrain-repo",
        quote:
          "Only repository metadata and README-level signals are currently available.",
        location: { section: "import log" },
        confidence: 0.61,
      },
    ],
    relations: [
      {
        source: "gbrain",
        target: "Personal Brain Layer",
        kind: "supports",
        confidence: 0.56,
      },
    ],
    suggested_actions: [
      { action_id: "act-gbrain-retry", label: "Retry repository import", kind: "trace" },
      { action_id: "act-gbrain-ask", label: "Ask what is missing", kind: "ask" },
    ],
    confidence: 0.58,
    freshness: "unknown",
    generated_at: "2026-06-13T19:02:00+08:00",
  },
  "asset-s3-object-model": {
    snapshot_id: "snap-s3-object-model",
    asset_id: "asset-s3-object-model",
    schema_version: "0.0.8",
    summary:
      "The object model note describes stable asset identity, storage keys, semantic snapshots, index pointers, and operation history. The snapshot is stale relative to the latest PRD language.",
    topics: [
      { name: "object identity", weight: 0.86 },
      { name: "snapshot versioning", weight: 0.8 },
      { name: "S3-compatible", weight: 0.74 },
    ],
    entities: [
      { name: "S3", kind: "system", confidence: 0.93 },
      { name: "SemanticSnapshot", kind: "system", confidence: 0.88 },
    ],
    evidence: [
      {
        evidence_id: "ev-s3-01",
        asset_id: "asset-s3-object-model",
        quote:
          "对象存储的意义是为语义资产提供稳定身份，而不是把文件换个地方保存。",
        location: { section: "storage intent" },
        confidence: 0.86,
      },
    ],
    relations: [
      {
        source: "Storage Key",
        target: "SemanticSnapshot",
        kind: "depends-on",
        confidence: 0.82,
      },
    ],
    suggested_actions: [
      { action_id: "act-s3-refresh", label: "Refresh snapshot", kind: "trace" },
      { action_id: "act-s3-export", label: "Export contract", kind: "export" },
    ],
    confidence: 0.84,
    freshness: "stale",
    generated_at: "2026-06-11T14:00:00+08:00",
  },
  "asset-local-rag-lab": {
    snapshot_id: "snap-local-rag-lab",
    asset_id: "asset-local-rag-lab",
    schema_version: "0.1.0",
    summary:
      "The collection contains retrieval experiments, trace logs, and reranking notes. It is useful for validating evidence-first answers in Ask Emerge.",
    topics: [
      { name: "retrieval trace", weight: 0.9 },
      { name: "rerank", weight: 0.72 },
      { name: "evidence merge", weight: 0.69 },
    ],
    entities: [
      { name: "RAG", kind: "concept", confidence: 0.94 },
      { name: "Trace Run", kind: "system", confidence: 0.87 },
    ],
    evidence: [
      {
        evidence_id: "ev-rag-01",
        asset_id: "asset-local-rag-lab",
        quote:
          "用户信任来自可回放的检索路径，而不是更自信的自然语言回答。",
        location: { section: "trace findings" },
        confidence: 0.88,
      },
    ],
    relations: [
      {
        source: "Trace Run",
        target: "Ask Emerge",
        kind: "supports",
        confidence: 0.86,
      },
    ],
    suggested_actions: [
      { action_id: "act-rag-trace", label: "Open latest trace", kind: "trace" },
      { action_id: "act-rag-compare", label: "Compare retrieval runs", kind: "compare" },
    ],
    confidence: 0.88,
    freshness: "fresh",
    generated_at: "2026-06-13T12:10:00+08:00",
  },
};

export const mockPipelineRuns: PipelineRun[] = [
  {
    run_id: "run-whitepaper-v05",
    asset_id: "asset-whitepaper-v05",
    started_at: "2026-06-13T18:40:00+08:00",
    finished_at: "2026-06-13T18:42:00+08:00",
    steps: [
      { name: "ingest", status: "succeeded", duration_ms: 240 },
      { name: "parse", status: "succeeded", duration_ms: 480 },
      { name: "snapshot", status: "succeeded", duration_ms: 1840 },
      { name: "index", status: "succeeded", duration_ms: 960 },
      { name: "verify", status: "succeeded", duration_ms: 320 },
    ],
  },
  {
    run_id: "run-hermes-claudecode",
    asset_id: "asset-hermes-claudecode",
    started_at: "2026-06-13T19:04:00+08:00",
    steps: [
      { name: "ingest", status: "succeeded", duration_ms: 280 },
      { name: "parse", status: "succeeded", duration_ms: 640 },
      { name: "snapshot", status: "running", message: "Extracting benchmark claims" },
      { name: "index", status: "queued" },
      { name: "verify", status: "queued" },
    ],
  },
  {
    run_id: "run-gbrain-repo",
    asset_id: "asset-gbrain-repo",
    started_at: "2026-06-13T18:57:00+08:00",
    steps: [
      { name: "ingest", status: "succeeded", duration_ms: 410 },
      { name: "parse", status: "succeeded", duration_ms: 730 },
      { name: "snapshot", status: "succeeded", duration_ms: 1220 },
      { name: "index", status: "failed", message: "Repository tree requires retry" },
      { name: "verify", status: "skipped" },
    ],
  },
  {
    run_id: "run-deepseek-gui",
    asset_id: "asset-deepseek-gui",
    started_at: "2026-06-13T09:44:00+08:00",
    steps: [
      { name: "ingest", status: "succeeded", duration_ms: 520 },
      { name: "parse", status: "failed", message: "Image OCR adapter unavailable" },
      { name: "snapshot", status: "skipped" },
      { name: "index", status: "skipped" },
      { name: "verify", status: "skipped" },
    ],
  },
  {
    run_id: "run-inbox-screens",
    asset_id: "asset-inbox-screens",
    started_at: "2026-06-13T18:40:00+08:00",
    steps: [
      { name: "ingest", status: "queued" },
      { name: "parse", status: "queued" },
      { name: "snapshot", status: "queued" },
      { name: "index", status: "queued" },
      { name: "verify", status: "queued" },
    ],
  },
];

export const sourceLabels: Record<SourceFilter, string> = {
  all: "All Objects",
  "local-files": "Local Files",
  notes: "Notes",
  urls: "URLs",
  collections: "Collections",
  "needs-review": "Needs Review",
};
