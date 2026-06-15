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
  getAssetTrace,
  readStore,
  saveIngestRecord,
  updateAssetMetadata,
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
    const store = await readStore();
    const snapshot = store.snapshots[snapshotMatch[1]];
    if (!snapshot) {
      sendJson(response, 404, { ok: false, error: "Snapshot not found" });
      return;
    }
    sendJson(response, 200, { snapshot });
    return;
  }

  const previewMatch = url.pathname.match(/^\/api\/assets\/([^/]+)\/preview$/);
  if (request.method === "GET" && previewMatch) {
    const preview = await getAssetPreview(previewMatch[1], {
      limit: Number(url.searchParams.get("limit") || 6),
    });
    if (!preview) {
      sendJson(response, 404, { ok: false, error: "Asset preview not found" });
      return;
    }
    sendJson(response, 200, { ok: true, preview });
    return;
  }

  const traceMatch = url.pathname.match(/^\/api\/assets\/([^/]+)\/trace$/);
  if (request.method === "GET" && traceMatch) {
    const trace = await getAssetTrace(traceMatch[1]);
    if (!trace) {
      sendJson(response, 404, { ok: false, error: "Asset trace not found" });
      return;
    }
    sendJson(response, 200, { ok: true, trace });
    return;
  }

  const assetMatch = url.pathname.match(/^\/api\/assets\/([^/]+)$/);
  if (request.method === "PATCH" && assetMatch) {
    const body = await readJsonBody(request);
    const updated = await updateAssetMetadata(assetMatch[1], body);
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
    const deletedAsset = await deleteAsset(assetMatch[1]);
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

  if (request.method === "GET" && url.pathname === "/api/search") {
    const query = url.searchParams.get("q") || "";
    const assetId = url.searchParams.get("asset_id") || undefined;
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
      await recordRetrievalTrace({
        kind: "ask",
        question: body.question,
        assetId: body.assetId,
        retrieval,
      });
      sendJson(response, 200, {
        provider: "local-retrieval",
        providerLabel: "Local Retrieval",
        model: retrieval.mode,
        answer: buildLocalRetrievalAnswer({
          question: body.question,
          results: retrieval.results,
        }),
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
      await recordRetrievalTrace({
        kind: "ask",
        question: body.question,
        assetId: body.assetId,
        retrieval,
        status: "failed",
        error: toPublicProviderError(error),
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
