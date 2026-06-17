import http from "node:http";

import {
  config,
  publicConfig,
  updateOpenAICompatibleConfig,
} from "./config.js";
import { readJsonBody, sendJson, sendOptions } from "./http.js";
import {
  askOpenAICompatible,
  testOpenAICompatible,
} from "./providers/openai-compatible.js";
import { embedWithOllama, getOllamaTags } from "./providers/ollama.js";
import { buildLocalRetrievalAnswer, searchStoreEvidence } from "./retrieval.js";
import {
  appendTraceEvent,
  createIngestRecord,
  deleteAsset,
  getAssetPreview,
  getAssetSource,
  getAssetTrace,
  getAskHistory,
  getIndexStatus,
  getSearchHistory,
  readStore,
  recordAskRun,
  recordSearchRun,
  saveIngestRecord,
  updateAssetMetadata,
  reindexChunks,
  applyReindexResults,
} from "./store.js";
import { fetchUrlContent } from "./url-fetcher.js";

async function embedQuery(input) {
  try {
    const result = await embedWithOllama(input);
    return {
      embedding: result.embeddings?.[0],
      error: null,
      model: result.model,
    };
  } catch (error) {
    return {
      embedding: null,
      error: error instanceof Error ? error.message : "Unknown embedding error",
      model: null,
    };
  }
}

async function enrichRecordWithEmbeddings(record) {
  if (!record.chunks?.length) {
    return { mode: "lexical", error: null, model: null };
  }

  try {
    const result = await embedWithOllama(record.chunks.map((chunk) => chunk.text));
    const embeddings = Array.isArray(result.embeddings) ? result.embeddings : [];
    const indexedAt = new Date().toISOString();
    record.chunks = record.chunks.map((chunk, index) => ({
      ...chunk,
      embedding: Array.isArray(embeddings[index]) ? embeddings[index] : null,
      embedding_model: Array.isArray(embeddings[index]) ? result.model : null,
      indexed_at: Array.isArray(embeddings[index]) ? indexedAt : null,
    }));
    return { mode: "hybrid", error: null, model: result.model };
  } catch (error) {
    return {
      mode: "lexical",
      error: error instanceof Error ? error.message : "Unknown embedding error",
      model: null,
    };
  }
}

function setPipelineStepMessage(record, stepName, message) {
  record.pipelineRun.steps = record.pipelineRun.steps.map((step) =>
    step.name === stepName ? { ...step, message } : step,
  );
}

function mergeAskContext(suppliedContext, retrievedEvidence) {
  const seen = new Set();
  return [...retrievedEvidence, ...suppliedContext]
    .map((item) => ({
      label: item.label || item.asset_title || item.evidence_id,
      quote: item.quote || item.text || "",
      asset_id: item.asset_id,
      evidence_id: item.evidence_id,
    }))
    .filter((item) => {
      const key = `${item.asset_id || ""}:${item.evidence_id || ""}:${item.quote}`;
      if (!item.quote || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function toPublicProviderError(error) {
  const message = error instanceof Error ? error.message : "Unknown provider error";
  return config.openaiCompatible.apiKey
    ? message.split(config.openaiCompatible.apiKey).join("[redacted]")
    : message;
}

async function retrieveEvidenceForQuestion({ question, assetId, limit = 6 }) {
  const store = await readStore();
  const queryEmbedding = await embedQuery(question);
  const results = searchStoreEvidence(store, {
    query: question,
    assetId,
    limit,
    queryEmbedding: queryEmbedding.embedding,
  });
  return {
    results,
    mode: results.some((item) => item.match_type === "hybrid") ? "hybrid" : "lexical",
    embeddingModel: queryEmbedding.model,
    embeddingError: queryEmbedding.error,
  };
}

function uniqueAssetIdsFromResults(results, fallbackAssetId) {
  const ids = new Set();
  if (fallbackAssetId) ids.add(fallbackAssetId);
  for (const result of results || []) {
    if (result.asset_id) ids.add(result.asset_id);
    if (ids.size >= 5) break;
  }
  return [...ids];
}

async function recordRetrievalTrace({ kind, question, assetId, retrieval, status = "succeeded", error }) {
  const assetIds = uniqueAssetIdsFromResults(retrieval?.results || [], assetId);
  for (const targetAssetId of assetIds) {
    await appendTraceEvent({
      asset_id: targetAssetId,
      kind,
      status,
      title: kind,
      message:
        kind === "ask"
          ? `Ask: ${question}`
          : `Search: ${question}`,
      details: {
        query: question,
        retrieval_mode: retrieval?.mode,
        result_count: retrieval?.results?.length || 0,
        embedding_model: retrieval?.embeddingModel,
        embedding_error: retrieval?.embeddingError,
        error,
      },
    });
  }
}

async function route(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    sendOptions(response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      providers: publicConfig(),
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/ollama/tags") {
    const tags = await getOllamaTags();
    sendJson(response, 200, tags);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ollama/test") {
    try {
      const result = await embedWithOllama("Emerge embedding diagnostic.");
      sendJson(response, 200, {
        ok: true,
        status: "connected",
        provider: publicConfig().ollama,
        dimensions: Array.isArray(result.embeddings?.[0])
          ? result.embeddings[0].length
          : null,
      });
    } catch (error) {
      sendJson(response, 502, {
        ok: false,
        status: "request_failed",
        provider: publicConfig().ollama,
        error: error instanceof Error ? error.message : "Unknown embedding error",
      });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/llm/test") {
    const provider = publicConfig().openaiCompatible;

    if (!config.openaiCompatible.apiKey) {
      sendJson(response, 200, {
        ok: false,
        status: "missing_key",
        provider,
      });
      return;
    }

    try {
      const result = await testOpenAICompatible();
      sendJson(response, 200, {
        ok: true,
        status: "connected",
        provider,
        ...result,
      });
    } catch (error) {
      sendJson(response, 502, {
        ok: false,
        status: "request_failed",
        provider,
        error: toPublicProviderError(error),
      });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/llm/config") {
    const body = await readJsonBody(request);
    const providers = updateOpenAICompatibleConfig(body);
    sendJson(response, 200, {
      ok: true,
      providers,
      provider: providers.openaiCompatible,
      ollama: providers.ollama,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/assets") {
    const store = await readStore();
    sendJson(response, 200, {
      assets: store.assets,
      snapshots: store.snapshots,
      pipelineRuns: store.pipelineRuns,
      index: {
        chunks: store.chunks.length,
        embeddedChunks: store.chunks.filter((chunk) => Array.isArray(chunk.embedding)).length,
      },
    });
    return;
  }

  const snapshotMatch = url.pathname.match(/^\/api\/assets\/([^/]+)\/snapshot$/);
  if (request.method === "GET" && snapshotMatch) {
    const snapshotId = decodeURIComponent(snapshotMatch[1]);
    const store = await readStore();
    const snapshot = store.snapshots[snapshotId];
    if (!snapshot) {
      sendJson(response, 404, { ok: false, error: "Snapshot not found" });
      return;
    }
    sendJson(response, 200, { snapshot });
    return;
  }

  const previewMatch = url.pathname.match(/^\/api\/assets\/([^/]+)\/preview$/);
  if (request.method === "GET" && previewMatch) {
    const previewId = decodeURIComponent(previewMatch[1]);
    const preview = await getAssetPreview(previewId, {
      limit: Number(url.searchParams.get("limit") || 6),
    });
    if (!preview) {
      sendJson(response, 404, { ok: false, error: "Asset preview not found" });
      return;
    }
    sendJson(response, 200, { ok: true, preview });
    return;
  }

  const sourceMatch = url.pathname.match(/^\/api\/assets\/([^/]+)\/source$/);
  if (request.method === "GET" && sourceMatch) {
    const decodedId = decodeURIComponent(sourceMatch[1]);
    const source = await getAssetSource(decodedId);

    if (!source) {
      sendJson(response, 404, { ok: false, error: "Source document not found" });
      return;
    }
    sendJson(response, 200, { ok: true, source });
    return;
  }

  const traceMatch = url.pathname.match(/^\/api\/assets\/([^/]+)\/trace$/);
  if (request.method === "GET" && traceMatch) {
    const traceId = decodeURIComponent(traceMatch[1]);
    const trace = await getAssetTrace(traceId);
    if (!trace) {
      sendJson(response, 404, { ok: false, error: "Asset trace not found" });
      return;
    }
    sendJson(response, 200, { ok: true, trace });
    return;
  }

  const assetMatch = url.pathname.match(/^\/api\/assets\/([^/]+)$/);
  if (request.method === "PATCH" && assetMatch) {
    const assetId = decodeURIComponent(assetMatch[1]);
    const body = await readJsonBody(request);
    const updated = await updateAssetMetadata(assetId, body);
    if (!updated) {
      sendJson(response, 404, { ok: false, error: "Asset not found" });
      return;
    }
    sendJson(response, 200, {
      ok: true,
      ...updated,
    });
    return;
  }

  if (request.method === "DELETE" && assetMatch) {
    const deleteId = decodeURIComponent(assetMatch[1]);
    const deletedAsset = await deleteAsset(deleteId);
    if (!deletedAsset) {
      sendJson(response, 404, { ok: false, error: "Asset not found" });
      return;
    }
    sendJson(response, 200, {
      ok: true,
      asset_id: deletedAsset.asset_id,
      title: deletedAsset.title,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/pipeline/runs") {
    const store = await readStore();
    const assetId = url.searchParams.get("asset_id");
    const runs = assetId
      ? store.pipelineRuns.filter((run) => run.asset_id === assetId)
      : store.pipelineRuns;
    sendJson(response, 200, { runs });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/history/ask") {
    const assetId = url.searchParams.get("asset_id") || undefined;
    const limit = Number(url.searchParams.get("limit") || 20);
    const runs = await getAskHistory({ assetId, limit });
    sendJson(response, 200, { ok: true, runs });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/history/search") {
    const assetId = url.searchParams.get("asset_id") || undefined;
    const limit = Number(url.searchParams.get("limit") || 20);
    const runs = await getSearchHistory({ assetId, limit });
    sendJson(response, 200, { ok: true, runs });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/search") {
    const query = url.searchParams.get("q") || "";
    const assetId = url.searchParams.get("asset_id") || undefined;
    try {
      const retrieval = await retrieveEvidenceForQuestion({
        question: query,
        assetId,
        limit: Number(url.searchParams.get("limit") || 6),
      });
      await recordRetrievalTrace({
        kind: "search",
        question: query,
        assetId,
        retrieval,
      });
      await recordSearchRun({
        asset_id: assetId,
        query,
        result_count: retrieval.results.length,
        retrieval_mode: retrieval.mode,
        status: "succeeded",
      });
      sendJson(response, 200, {
        query,
        asset_id: assetId,
        results: retrieval.results,
        retrieval: {
          mode: retrieval.mode,
          embeddingModel: retrieval.embeddingModel,
          embeddingError: retrieval.embeddingError,
        },
      });
    } catch (error) {
      await recordSearchRun({
        asset_id: assetId,
        query,
        result_count: 0,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/embed") {
    const body = await readJsonBody(request);
    const result = await embedWithOllama(body.input);
    sendJson(response, 200, result);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/url/fetch") {
    const body = await readJsonBody(request);
    if (!body.url) {
      sendJson(response, 400, { ok: false, error: "url is required" });
      return;
    }

    const result = await fetchUrlContent(body.url);
    sendJson(response, 200, result);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ask") {
    const body = await readJsonBody(request);
    if (!body.question) {
      sendJson(response, 400, { ok: false, error: "question is required" });
      return;
    }

    const retrieval = await retrieveEvidenceForQuestion({
      question: body.question,
      assetId: body.assetId,
    });
    const context = mergeAskContext(body.context || [], retrieval.results);

    if (!config.openaiCompatible.apiKey) {
      const localAnswer = buildLocalRetrievalAnswer({
        question: body.question,
        results: retrieval.results,
      });
      await recordRetrievalTrace({
        kind: "ask",
        question: body.question,
        assetId: body.assetId,
        retrieval,
      });
      await recordAskRun({
        asset_id: body.assetId,
        question: body.question,
        answer: localAnswer,
        provider: "local-retrieval",
        retrieval_mode: retrieval.mode,
        citations_count: retrieval.results.length,
        status: "succeeded",
      });
      sendJson(response, 200, {
        provider: "local-retrieval",
        providerLabel: "Local Retrieval",
        model: retrieval.mode,
        answer: localAnswer,
        citations: retrieval.results,
        retrieval: {
          mode: retrieval.mode,
          embeddingModel: retrieval.embeddingModel,
          embeddingError: retrieval.embeddingError,
        },
      });
      return;
    }

    try {
      const result = await askOpenAICompatible({
        question: body.question,
        context,
        assetTitle: body.assetTitle,
      });
      await recordRetrievalTrace({
        kind: "ask",
        question: body.question,
        assetId: body.assetId,
        retrieval,
      });
      await recordAskRun({
        asset_id: body.assetId,
        question: body.question,
        answer: result.answer,
        provider: result.provider,
        retrieval_mode: retrieval.mode,
        citations_count: retrieval.results.length,
        status: "succeeded",
      });
      sendJson(response, 200, {
        ...result,
        citations: retrieval.results,
        retrieval: {
          mode: retrieval.mode,
          embeddingModel: retrieval.embeddingModel,
          embeddingError: retrieval.embeddingError,
        },
      });
    } catch (error) {
      const publicError = toPublicProviderError(error);
      await recordRetrievalTrace({
        kind: "ask",
        question: body.question,
        assetId: body.assetId,
        retrieval,
        status: "failed",
        error: publicError,
      });
      await recordAskRun({
        asset_id: body.assetId,
        question: body.question,
        answer: "",
        provider: "openai-compatible",
        retrieval_mode: retrieval.mode,
        citations_count: 0,
        status: "failed",
        error: publicError,
      });
      throw error;
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ingest") {
    const body = await readJsonBody(request);
    if (!body.title && !body.filename) {
      sendJson(response, 400, { ok: false, error: "title or filename is required" });
      return;
    }
    if (typeof body.content !== "string") {
      sendJson(response, 400, { ok: false, error: "content must be a string" });
      return;
    }

    const record = createIngestRecord(body);
    const indexResult = await enrichRecordWithEmbeddings(record);
    const indexMessage =
      indexResult.mode === "hybrid"
        ? `Hybrid index ready via ${indexResult.model}`
        : indexResult.error
          ? `Lexical index ready; vector skipped: ${indexResult.error}`
          : "Lexical index ready";
    setPipelineStepMessage(record, "index", indexMessage);

    await saveIngestRecord(record);
    sendJson(response, 201, {
      ok: true,
      ...record,
      index: indexResult,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/index/status") {
    const status = await getIndexStatus(config.ollama.embedModel);
    sendJson(response, 200, { ok: true, ...status });
    return;
  }

  async function handleReindex(assetId) {
    const { store, targetChunks } = await reindexChunks(assetId);
    if (targetChunks.length === 0) {
      return { ok: false, error: "No chunks found for reindex", reindexed: 0 };
    }

    const now = new Date().toISOString();
    const assetIds = new Set(targetChunks.map((c) => c.asset_id));

    try {
      const result = await embedWithOllama(targetChunks.map((c) => c.text));
      const embeddings = Array.isArray(result.embeddings) ? result.embeddings : [];
      const updatedChunks = targetChunks.map((chunk, index) => ({
        ...chunk,
        embedding: Array.isArray(embeddings[index]) ? embeddings[index] : chunk.embedding,
        embedding_model: Array.isArray(embeddings[index]) ? result.model : chunk.embedding_model,
        indexed_at: Array.isArray(embeddings[index]) ? now : chunk.indexed_at,
      }));

      const embeddedCount = updatedChunks.filter((c) =>
        Array.isArray(c.embedding),
      ).length;
      const traceEvents = [...assetIds].map((id) => ({
        trace_id: `trace-${id}-reindex-${Date.now()}`,
        asset_id: id,
        kind: "index",
        status: "succeeded",
        title: "reindex",
        message: `Reindexed ${updatedChunks.length} chunks via ${result.model}`,
        created_at: now,
        details: {
          model: result.model,
          chunkCount: updatedChunks.length,
          embeddedCount,
        },
      }));

      await applyReindexResults(updatedChunks, traceEvents);
      return {
        ok: true,
        reindexed: updatedChunks.length,
        embedded: embeddedCount,
        model: result.model,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown embedding error";
      const traceEvents = [...assetIds].map((id) => ({
        trace_id: `trace-${id}-reindex-${Date.now()}`,
        asset_id: id,
        kind: "index",
        status: "failed",
        title: "reindex",
        message: `Reindex failed: ${errorMessage}`,
        created_at: now,
        details: { error: errorMessage },
      }));

      await applyReindexResults([], traceEvents);
      return {
        ok: false,
        error: errorMessage,
        reindexed: 0,
        fallback: "lexical",
      };
    }
  }

  const reindexAssetMatch = url.pathname.match(/^\/api\/assets\/([^/]+)\/reindex$/);
  if (request.method === "POST" && reindexAssetMatch) {
    const assetId = decodeURIComponent(reindexAssetMatch[1]);
    const store = await readStore();
    const asset = store.assets.find((a) => a.asset_id === assetId);
    if (!asset) {
      sendJson(response, 404, { ok: false, error: "Asset not found" });
      return;
    }
    const result = await handleReindex(assetId);
    sendJson(response, result.ok ? 200 : 502, result);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/reindex") {
    const result = await handleReindex(null);
    sendJson(response, result.ok ? 200 : 502, result);
    return;
  }

  sendJson(response, 404, {
    ok: false,
    error: "Not found",
  });
}

const server = http.createServer((request, response) => {
  route(request, response).catch((error) => {
    sendJson(response, error.statusCode || 500, {
      ok: false,
      error: error.message,
    });
  });
});

server.listen(config.port, "127.0.0.1", () => {
  console.log(`Emerge local API listening on http://127.0.0.1:${config.port}`);
});
