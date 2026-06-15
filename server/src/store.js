import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");
const dataDir = path.join(serverRoot, "local-data");
const storePath = path.join(dataDir, "store.json");

const emptyStore = {
  assets: [],
  snapshots: {},
  pipelineRuns: [],
  chunks: [],
  traceEvents: [],
};

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(storePath);
  } catch {
    await fs.writeFile(storePath, JSON.stringify(emptyStore, null, 2), "utf8");
  }
}

export async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(storePath, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return {
      assets: Array.isArray(parsed.assets) ? parsed.assets : [],
      snapshots: parsed.snapshots && typeof parsed.snapshots === "object" ? parsed.snapshots : {},
      pipelineRuns: Array.isArray(parsed.pipelineRuns) ? parsed.pipelineRuns : [],
      chunks: Array.isArray(parsed.chunks) ? parsed.chunks : [],
      traceEvents: Array.isArray(parsed.traceEvents) ? parsed.traceEvents : [],
    };
  } catch {
    return { ...emptyStore };
  }
}

export async function writeStore(nextStore) {
  await fs.mkdir(dataDir, { recursive: true });
  const tmpPath = path.join(dataDir, `store.${process.pid}.${Date.now()}.json.tmp`);
  await fs.writeFile(tmpPath, JSON.stringify(nextStore, null, 2), "utf8");
  await fs.rename(tmpPath, storePath);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function extractParagraphs(content) {
  return content
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function extractTopics(title, content) {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "this",
    "that",
    "from",
    "into",
    "your",
    "you",
    "are",
    "was",
    "were",
    "have",
    "has",
    "not",
    "but",
    "can",
    "will",
    "文件",
    "这个",
    "一个",
    "我们",
    "需要",
  ]);
  const words = `${title} ${content}`
    .toLowerCase()
    .match(/[\p{L}\p{N}][\p{L}\p{N}_-]{1,}/gu);
  if (!words) return [{ name: "imported", weight: 0.72 }];

  const counts = new Map();
  for (const word of words) {
    if (word.length < 2 || stopWords.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name], index) => ({
      name,
      weight: Math.max(0.52, 0.88 - index * 0.08),
    }));
}

function inferMimeTag(mimeType = "") {
  if (mimeType.includes("markdown")) return "markdown";
  if (mimeType.includes("json")) return "json";
  if (mimeType.includes("html")) return "html";
  if (mimeType.includes("text")) return "text";
  return "file";
}

function storageBucketForKind(kind) {
  if (kind === "note") return "notes";
  if (kind === "url") return "urls";
  return "imports";
}

function tagsForKind(kind, mimeTag) {
  if (kind === "note") return ["note", mimeTag, "local"];
  if (kind === "url") return ["url", "captured", "local"];
  return ["imported", mimeTag, "local"];
}

function actionIdsForKind(kind) {
  if (kind === "note") {
    return {
      ask: "act-note-ask",
      export: "act-note-export",
      askLabel: "Ask about this note",
    };
  }
  if (kind === "url") {
    return {
      ask: "act-url-ask",
      export: "act-url-export",
      askLabel: "Ask about this URL",
    };
  }
  return {
    ask: "act-imported-ask",
    export: "act-imported-export",
    askLabel: "Ask about this import",
  };
}

function inferAssetKind(kind) {
  return ["file", "url", "note", "folder", "collection"].includes(kind) ? kind : "file";
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return undefined;
  const seen = new Set();
  return tags
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

function traceEventsFromPipelineRun(run) {
  if (!run) return [];
  let elapsedMs = 0;
  return (run.steps || []).map((step) => {
    const timestamp = run.started_at
      ? new Date(new Date(run.started_at).getTime() + elapsedMs).toISOString()
      : new Date().toISOString();
    elapsedMs += Number(step.duration_ms || 0);
    return {
      trace_id: `trace-${run.run_id}-${step.name}`,
      asset_id: run.asset_id,
      run_id: run.run_id,
      kind: step.name,
      status: step.status,
      title: step.name,
      message: step.message || "",
      duration_ms: step.duration_ms,
      created_at: timestamp,
      details: {
        pipeline_step: step.name,
      },
    };
  });
}

function buildChunks(asset, paragraphs, content) {
  const fallback = content.trim() || `${asset.title} has been imported.`;
  const chunkTexts = paragraphs.length > 0 ? paragraphs : [fallback];

  return chunkTexts.slice(0, 16).map((text, index) => ({
    chunk_id: `chunk-${asset.asset_id}-${index + 1}`,
    asset_id: asset.asset_id,
    evidence_id: `ev-${asset.asset_id}-${index + 1}`,
    title: asset.title,
    source_uri: asset.source_uri,
    text: truncate(text, 900),
    location: {
      section: index === 0 ? "imported content" : `paragraph ${index + 1}`,
    },
    embedding: null,
    embedding_model: null,
    indexed_at: null,
  }));
}

export function createIngestRecord(input) {
  const now = new Date().toISOString();
  const title = input.title || input.filename || "Imported file";
  const slug = slugify(title) || "imported-file";
  const assetId = `asset-import-${Date.now()}-${slug}`;
  const snapshotId = `snap-${assetId}`;
  const runId = `run-${assetId}`;
  const content = typeof input.content === "string" ? input.content : "";
  const paragraphs = extractParagraphs(content);
  const summarySource = paragraphs[0] || content || `${title} has been imported.`;
  const mimeTag = inferMimeTag(input.mime_type);
  const kind = inferAssetKind(input.kind);
  const actionIds = actionIdsForKind(kind);

  const asset = {
    asset_id: assetId,
    kind,
    title,
    source_uri: input.source_uri || (kind === "note" ? `note://${slug}` : `browser-file://${title}`),
    storage_key: `local://${storageBucketForKind(kind)}/${assetId}`,
    mime_type: input.mime_type || "text/plain",
    size_bytes: Number(input.size_bytes || Buffer.byteLength(content, "utf8")),
    status: "ready",
    tags: tagsForKind(kind, mimeTag),
    created_at: now,
    updated_at: now,
    snapshot_id: snapshotId,
    owner: "Local",
  };

  const chunks = buildChunks(asset, paragraphs, content);
  const evidenceParagraphs = chunks.slice(0, 4);
  const evidence = evidenceParagraphs.map((quote, index) => ({
    evidence_id: `ev-${assetId}-${index + 1}`,
    asset_id: assetId,
    quote: truncate(quote.text, 220),
    location: quote.location,
    confidence: Math.max(0.72, 0.88 - index * 0.07),
  }));

  const snapshot = {
    snapshot_id: snapshotId,
    asset_id: assetId,
    schema_version: "0.1.0",
    summary: truncate(summarySource, 260),
    topics: extractTopics(title, content),
    entities: [
      {
        name: title,
        kind: "concept",
        confidence: 0.72,
      },
    ],
    evidence,
    relations: [],
    suggested_actions: [
      {
        action_id: actionIds.ask,
        label: actionIds.askLabel,
        kind: "ask",
      },
      {
        action_id: actionIds.export,
        label: "Export snapshot",
        kind: "export",
      },
    ],
    confidence: 0.78,
    freshness: "fresh",
    generated_at: now,
  };

  const pipelineRun = {
    run_id: runId,
    asset_id: assetId,
    started_at: now,
    finished_at: now,
    steps: [
      { name: "ingest", status: "succeeded", duration_ms: 120 },
      { name: "parse", status: "succeeded", duration_ms: 180 },
      { name: "snapshot", status: "succeeded", duration_ms: 260 },
      { name: "index", status: "succeeded", duration_ms: 140 },
      { name: "verify", status: "succeeded", duration_ms: 80 },
    ],
  };

  return { asset, snapshot, pipelineRun, chunks };
}

export async function saveIngestRecord(record) {
  const store = await readStore();
  const traceEvents = traceEventsFromPipelineRun(record.pipelineRun);
  const nextStore = {
    assets: [record.asset, ...store.assets],
    snapshots: {
      ...store.snapshots,
      [record.asset.asset_id]: record.snapshot,
    },
    pipelineRuns: [record.pipelineRun, ...store.pipelineRuns],
    chunks: [
      ...(record.chunks || []),
      ...store.chunks.filter((chunk) => chunk.asset_id !== record.asset.asset_id),
    ],
    traceEvents: [
      ...traceEvents,
      ...store.traceEvents.filter((event) => event.asset_id !== record.asset.asset_id),
    ],
  };
  await writeStore(nextStore);
  return record;
}

export async function ingestAsset(input) {
  const record = createIngestRecord(input);
  return saveIngestRecord(record);
}

export async function deleteAsset(assetId) {
  const store = await readStore();
  const deletedAsset = store.assets.find((asset) => asset.asset_id === assetId);
  if (!deletedAsset) return null;

  const nextSnapshots = { ...store.snapshots };
  delete nextSnapshots[assetId];

  await writeStore({
    assets: store.assets.filter((asset) => asset.asset_id !== assetId),
    snapshots: nextSnapshots,
    pipelineRuns: store.pipelineRuns.filter((run) => run.asset_id !== assetId),
    chunks: store.chunks.filter((chunk) => chunk.asset_id !== assetId),
    traceEvents: store.traceEvents.filter((event) => event.asset_id !== assetId),
  });

  return deletedAsset;
}

export async function updateAssetMetadata(assetId, input = {}) {
  const store = await readStore();
  const currentAsset = store.assets.find((asset) => asset.asset_id === assetId);
  if (!currentAsset) return null;

  const nextTitle =
    typeof input.title === "string" && input.title.trim()
      ? input.title.trim()
      : currentAsset.title;
  const nextTags = normalizeTags(input.tags) ?? currentAsset.tags;
  const updatedAt = new Date().toISOString();
  const updatedAsset = {
    ...currentAsset,
    title: nextTitle,
    tags: nextTags,
    updated_at: updatedAt,
  };

  const nextSnapshots = { ...store.snapshots };
  const snapshot = nextSnapshots[assetId];
  if (snapshot) {
    nextSnapshots[assetId] = {
      ...snapshot,
      entities: Array.isArray(snapshot.entities)
        ? snapshot.entities.map((entity, index) =>
            index === 0 ? { ...entity, name: nextTitle } : entity,
          )
        : snapshot.entities,
      generated_at: updatedAt,
    };
  }

  await writeStore({
    assets: store.assets.map((asset) =>
      asset.asset_id === assetId ? updatedAsset : asset,
    ),
    snapshots: nextSnapshots,
    pipelineRuns: store.pipelineRuns,
    chunks: store.chunks.map((chunk) =>
      chunk.asset_id === assetId ? { ...chunk, title: nextTitle } : chunk,
    ),
    traceEvents: [
      {
        trace_id: `trace-${assetId}-metadata-${Date.now()}`,
        asset_id: assetId,
        kind: "metadata",
        status: "succeeded",
        title: "metadata",
        message: "Object title or tags updated",
        created_at: updatedAt,
        details: {
          title: nextTitle,
          tags: nextTags,
        },
      },
      ...store.traceEvents,
    ],
  });

  return {
    asset: updatedAsset,
    snapshot: nextSnapshots[assetId] ?? null,
  };
}

export async function appendTraceEvent(input = {}) {
  const store = await readStore();
  const now = new Date().toISOString();
  const event = {
    trace_id: input.trace_id || `trace-${input.asset_id || "global"}-${input.kind || "event"}-${Date.now()}`,
    asset_id: input.asset_id,
    run_id: input.run_id,
    kind: input.kind || "event",
    status: input.status || "succeeded",
    title: input.title || input.kind || "event",
    message: input.message || "",
    duration_ms: input.duration_ms,
    created_at: input.created_at || now,
    details: input.details || {},
  };

  await writeStore({
    ...store,
    traceEvents: [event, ...store.traceEvents],
  });

  return event;
}

export async function getAssetTrace(assetId) {
  const store = await readStore();
  const asset = store.assets.find((item) => item.asset_id === assetId);
  if (!asset) return null;

  const runs = store.pipelineRuns
    .filter((run) => run.asset_id === assetId)
    .sort((a, b) => String(b.started_at || "").localeCompare(String(a.started_at || "")));
  const persistedEvents = store.traceEvents.filter((event) => event.asset_id === assetId);
  const derivedEvents = runs.flatMap(traceEventsFromPipelineRun);
  const seen = new Set();
  const events = [...persistedEvents, ...derivedEvents]
    .filter((event) => {
      const key = event.trace_id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));

  return {
    asset_id: assetId,
    title: asset.title,
    status: asset.status,
    runCount: runs.length,
    eventCount: events.length,
    lastEventAt: events[0]?.created_at ?? asset.updated_at,
    runs,
    events,
  };
}

export async function getAssetPreview(assetId, { limit = 6 } = {}) {
  const store = await readStore();
  const asset = store.assets.find((item) => item.asset_id === assetId);
  if (!asset) return null;

  const chunks = store.chunks
    .filter((chunk) => chunk.asset_id === assetId)
    .slice(0, Math.max(1, Math.min(12, Number(limit) || 6)));
  const allChunks = store.chunks.filter((chunk) => chunk.asset_id === assetId);

  return {
    asset_id: asset.asset_id,
    title: asset.title,
    kind: asset.kind,
    source_uri: asset.source_uri,
    mime_type: asset.mime_type,
    storage_key: asset.storage_key,
    chunkCount: allChunks.length,
    returnedChunks: chunks.length,
    indexedChars: allChunks.reduce((total, chunk) => total + String(chunk.text || "").length, 0),
    isPartial: allChunks.length > chunks.length,
    generated_at: new Date().toISOString(),
    chunks: chunks.map((chunk, index) => ({
      chunk_id: chunk.chunk_id,
      evidence_id: chunk.evidence_id,
      label: chunk.location?.section || `chunk ${index + 1}`,
      text: chunk.text || "",
      source_uri: chunk.source_uri,
      location: chunk.location,
      embedding_model: chunk.embedding_model,
      indexed_at: chunk.indexed_at,
    })),
  };
}
