import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
} from "react";
import { UploadCloud } from "lucide-react";

import {
  askLocalApi,
  configureLlmProvider,
  deleteLocalAsset,
  fetchUrlContent,
  getApiHealth,
  getLocalObjectPreview,
  getLocalObjectTrace,
  ingestLocalFile,
  listLocalAssets,
  searchLocalEvidence,
  testEmbeddingConnection,
  testLlmConnection,
  updateLocalAssetMetadata,
} from "./api/client";
import type {
  LlmConfigInput,
  OllamaEmbeddingConfig,
  OpenAICompatibleProviderConfig,
} from "./api/client";
import {
  BulkImportSummaryModal,
  type BulkImportSummary,
  type BulkImportSummaryItem,
} from "./components/BulkImportSummaryModal";
import { ModelSettingsModal } from "./components/ModelSettingsModal";
import { NoteComposer } from "./components/NoteComposer";
import { ObjectList } from "./components/ObjectList";
import { ObjectMetadataModal } from "./components/ObjectMetadataModal";
import { PipelineStrip } from "./components/PipelineStrip";
import { SemanticInspector } from "./components/SemanticInspector";
import { ShellHeader } from "./components/ShellHeader";
import { SourceSidebar } from "./components/SourceSidebar";
import { UrlCaptureModal } from "./components/UrlCaptureModal";
import { useI18n } from "./i18n";
import type {
  AskResult,
  Asset,
  ObjectFilter,
  ObjectPreview,
  ObjectTrace,
  PipelineRun,
  SearchResult,
  SearchStatus,
  SemanticSnapshot,
  SourceFilter,
  SuggestedAction,
} from "./types/domain";

function isNeedsReview(asset: Asset) {
  return asset.status === "partial" || asset.status === "error" || asset.status === "stale";
}

function matchesSource(asset: Asset, source: SourceFilter) {
  if (source === "all") return true;
  if (source === "needs-review") return isNeedsReview(asset);
  if (source === "local-files") return asset.kind === "file" || asset.kind === "folder";
  if (source === "notes") return asset.kind === "note";
  if (source === "urls") return asset.kind === "url";
  return asset.kind === "collection";
}

function matchesObjectFilter(asset: Asset, filter: ObjectFilter) {
  if (filter === "all") return true;
  if (filter === "ready") return asset.status === "ready";
  if (filter === "in-progress") return asset.status === "queued" || asset.status === "indexing";
  return isNeedsReview(asset);
}

function matchesQuery(asset: Asset, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [asset.title, asset.source_uri, ...asset.tags]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

function buildSourceCounts(assets: Asset[]): Record<SourceFilter, number> {
  return {
    all: assets.length,
    "local-files": assets.filter((asset) => matchesSource(asset, "local-files")).length,
    notes: assets.filter((asset) => matchesSource(asset, "notes")).length,
    urls: assets.filter((asset) => matchesSource(asset, "urls")).length,
    collections: assets.filter((asset) => matchesSource(asset, "collections")).length,
    "needs-review": assets.filter(isNeedsReview).length,
  };
}

function mergeAssets(seedAssets: Asset[], localAssets: Asset[]) {
  const seen = new Set(localAssets.map((asset) => asset.asset_id));
  return [...localAssets, ...seedAssets.filter((asset) => !seen.has(asset.asset_id))];
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "snapshot";
}

function isSupportedTextFile(file: File) {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  const supportedExtensions = new Set([
    "txt",
    "md",
    "markdown",
    "json",
    "csv",
    "html",
    "htm",
  ]);
  return (
    file.type.startsWith("text/") ||
    file.type === "application/json" ||
    supportedExtensions.has(extension)
  );
}

function hasDraggedFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer.types).includes("Files");
}

type ApiStatus = "checking" | "online" | "offline";
type LlmStatus = "unknown" | "missing-key" | "checking" | "online" | "error";
type SemanticSearchState = {
  status: SearchStatus;
  query: string;
  results: SearchResult[];
  retrievalMode?: "lexical" | "hybrid";
  embeddingError?: string | null;
  error?: string;
};
type ObjectPreviewState = {
  status: "idle" | "loading" | "success" | "error";
  preview?: ObjectPreview;
  error?: string;
};
type ObjectTraceState = {
  status: "idle" | "loading" | "success" | "error";
  trace?: ObjectTrace;
  error?: string;
};
type BulkImportProgress = {
  total: number;
  completed: number;
  currentName?: string;
};

function buildPreviewFromSnapshot(
  asset: Asset | undefined,
  snapshot: SemanticSnapshot | undefined,
): ObjectPreview | undefined {
  if (!asset || !snapshot) return undefined;
  const chunks = snapshot.evidence.slice(0, 6).map((item, index) => ({
    chunk_id: `mock-preview-${item.evidence_id}`,
    evidence_id: item.evidence_id,
    label: item.location?.section || `evidence ${index + 1}`,
    text: item.quote,
    source_uri: asset.source_uri,
    location: item.location,
    embedding_model: null,
    indexed_at: snapshot.generated_at,
  }));

  return {
    asset_id: asset.asset_id,
    title: asset.title,
    kind: asset.kind,
    source_uri: asset.source_uri,
    mime_type: asset.mime_type,
    storage_key: asset.storage_key,
    chunkCount: snapshot.evidence.length,
    returnedChunks: chunks.length,
    indexedChars: snapshot.evidence.reduce(
      (total, item) => total + item.quote.length,
      0,
    ),
    isPartial: snapshot.evidence.length > chunks.length,
    generated_at: snapshot.generated_at,
    chunks,
  };
}

function buildTraceFromPipelineRun(
  asset: Asset | undefined,
  run: PipelineRun | undefined,
): ObjectTrace | undefined {
  if (!asset || !run) return undefined;
  let elapsedMs = 0;
  const events = run.steps.map((step) => {
    const createdAt = run.started_at
      ? new Date(new Date(run.started_at).getTime() + elapsedMs).toISOString()
      : new Date().toISOString();
    elapsedMs += Number(step.duration_ms || 0);
    return {
      trace_id: `mock-trace-${run.run_id}-${step.name}`,
      asset_id: asset.asset_id,
      run_id: run.run_id,
      kind: step.name,
      status: step.status,
      title: step.name,
      message: step.message,
      duration_ms: step.duration_ms,
      created_at: createdAt,
      details: {
        pipeline_step: step.name,
      },
    };
  });

  return {
    asset_id: asset.asset_id,
    title: asset.title,
    status: asset.status,
    runCount: 1,
    eventCount: events.length,
    lastEventAt: events[events.length - 1]?.created_at ?? run.finished_at ?? run.started_at,
    runs: [run],
    events: events.sort((a, b) =>
      String(b.created_at || "").localeCompare(String(a.created_at || "")),
    ),
  };
}

export default function App() {
  const { t } = useI18n();
  const [activeSource, setActiveSource] = useState<SourceFilter>("all");
  const [objectFilter, setObjectFilter] = useState<ObjectFilter>("all");
  const [query, setQuery] = useState("");
  const [localAssets, setLocalAssets] = useState<Asset[]>([]);
  const [localSnapshots, setLocalSnapshots] = useState<Record<string, SemanticSnapshot>>({});
  const [localPipelineRuns, setLocalPipelineRuns] = useState<PipelineRun[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | undefined>(undefined);
  const [notice, setNotice] = useState(t("app.ready"));
  const [askResult, setAskResult] = useState<AskResult>({ status: "idle" });
  const [isNoteComposerOpen, setIsNoteComposerOpen] = useState(false);
  const [isUrlCaptureOpen, setIsUrlCaptureOpen] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isSavingMetadata, setIsSavingMetadata] = useState(false);
  const [isModelSettingsOpen, setIsModelSettingsOpen] = useState(false);
  const [isSavingModelSettings, setIsSavingModelSettings] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [llmStatus, setLlmStatus] = useState<LlmStatus>("unknown");
  const [llmProvider, setLlmProvider] = useState<OpenAICompatibleProviderConfig | null>(null);
  const [embeddingProvider, setEmbeddingProvider] = useState<OllamaEmbeddingConfig | null>(null);
  const [semanticSearch, setSemanticSearch] = useState<SemanticSearchState>({
    status: "idle",
    query: "",
    results: [],
  });
  const [objectPreview, setObjectPreview] = useState<ObjectPreviewState>({
    status: "idle",
  });
  const [objectTrace, setObjectTrace] = useState<ObjectTraceState>({
    status: "idle",
  });
  const [bulkImportProgress, setBulkImportProgress] =
    useState<BulkImportProgress | null>(null);
  const [bulkImportSummary, setBulkImportSummary] =
    useState<BulkImportSummary | null>(null);
  const [dragDepth, setDragDepth] = useState(0);

  const assets = localAssets;
  const snapshots = localSnapshots;
  const pipelineRuns = localPipelineRuns;

  const sourceCounts = useMemo(() => buildSourceCounts(assets), [assets]);

  const filteredAssets = useMemo(
    () =>
      assets.filter(
        (asset) =>
          matchesSource(asset, activeSource) &&
          matchesObjectFilter(asset, objectFilter) &&
          matchesQuery(asset, query),
      ),
    [activeSource, assets, objectFilter, query],
  );

  const selectedAsset =
    filteredAssets.find((asset) => asset.asset_id === selectedAssetId) ??
    filteredAssets[0] ??
    assets.find((asset) => asset.asset_id === selectedAssetId);

  const selectedSnapshot = selectedAsset
    ? snapshots[selectedAsset.asset_id]
    : undefined;

  const selectedRun = selectedAsset
    ? pipelineRuns.find((run) => run.asset_id === selectedAsset.asset_id)
    : undefined;

  const readyObjects = assets.filter((asset) => asset.status === "ready").length;
  const reviewObjects = assets.filter(isNeedsReview).length;
  const canDeleteSelected = selectedAsset
    ? localAssets.some((asset) => asset.asset_id === selectedAsset.asset_id)
    : false;
  const canEditSelected = canDeleteSelected;
  const isBulkImporting = bulkImportProgress !== null;
  const isDragActive = dragDepth > 0;

  useEffect(() => {
    setNotice(t("app.ready"));
  }, [t]);

  const refreshLocalRuntime = useCallback(
    async (options: { showLoadedNotice?: boolean } = {}) => {
      try {
        const health = await getApiHealth();
        setApiStatus("online");
        setLlmProvider(health.providers.openaiCompatible);
        setEmbeddingProvider(health.providers.ollama);
        setLlmStatus(
          health.providers.openaiCompatible.apiKeyConfigured
            ? "unknown"
            : "missing-key",
        );

        try {
          const store = await listLocalAssets();
          setLocalAssets(store.assets);
          setLocalSnapshots(store.snapshots);
          setLocalPipelineRuns(store.pipelineRuns);
          if (options.showLoadedNotice && store.assets.length > 0) {
            setNotice(t("app.localAssetsLoaded", { count: store.assets.length }));
          }
        } catch (error) {
          console.warn("Local asset store is unavailable while API health is OK.", error);
        }

        return true;
      } catch {
        setApiStatus("offline");
        setLlmStatus("unknown");
        setLlmProvider(null);
        setEmbeddingProvider(null);
        return false;
      }
    },
    [t],
  );

  useEffect(() => {
    void refreshLocalRuntime({ showLoadedNotice: true });
  }, [refreshLocalRuntime]);

  useEffect(() => {
    if (apiStatus !== "offline") return;
    const retryTimer = window.setInterval(() => {
      void refreshLocalRuntime();
    }, 2500);
    return () => window.clearInterval(retryTimer);
  }, [apiStatus, refreshLocalRuntime]);

  useEffect(() => {
    const searchQuery = query.trim();
    if (!searchQuery) {
      setSemanticSearch({ status: "idle", query: "", results: [] });
      return;
    }

    if (apiStatus === "offline") {
      setSemanticSearch({
        status: "error",
        query: searchQuery,
        results: [],
        error: t("semanticSearch.apiOffline"),
      });
      return;
    }

    if (apiStatus === "checking") {
      setSemanticSearch({ status: "loading", query: searchQuery, results: [] });
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setSemanticSearch({ status: "loading", query: searchQuery, results: [] });
      searchLocalEvidence({ query: searchQuery, limit: 8 })
        .then((response) => {
          if (cancelled) return;
          setSemanticSearch({
            status: "success",
            query: response.query,
            results: response.results,
            retrievalMode: response.retrieval.mode,
            embeddingError: response.retrieval.embeddingError,
          });
          setNotice(
            response.results.length > 0
              ? t("app.semanticSearchReady", {
                  count: response.results.length,
                  query: searchQuery,
                })
              : t("app.semanticSearchEmpty", { query: searchQuery }),
          );
        })
        .catch((error) => {
          if (cancelled) return;
          const message = error instanceof Error ? error.message : "Unknown error";
          setSemanticSearch({
            status: "error",
            query: searchQuery,
            results: [],
            error: message,
          });
          setNotice(t("app.semanticSearchError", { message }));
        });
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [apiStatus, query, t]);

  useEffect(() => {
    if (!selectedAsset) {
      setObjectPreview({ status: "idle" });
      return;
    }

    const fallbackPreview = buildPreviewFromSnapshot(selectedAsset, selectedSnapshot);
    const isLocalAsset = localAssets.some(
      (asset) => asset.asset_id === selectedAsset.asset_id,
    );
    if (!isLocalAsset || apiStatus !== "online") {
      setObjectPreview(
        fallbackPreview
          ? { status: "success", preview: fallbackPreview }
          : { status: "idle" },
      );
      return;
    }

    let cancelled = false;
    setObjectPreview({
      status: "loading",
      preview: fallbackPreview,
    });
    getLocalObjectPreview(selectedAsset.asset_id, 6)
      .then((response) => {
        if (cancelled) return;
        setObjectPreview({
          status: "success",
          preview: response.preview,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Unknown error";
        setObjectPreview({
          status: fallbackPreview ? "success" : "error",
          preview: fallbackPreview,
          error: message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [apiStatus, localAssets, selectedAsset, selectedSnapshot]);

  useEffect(() => {
    if (!selectedAsset) {
      setObjectTrace({ status: "idle" });
      return;
    }

    const fallbackTrace = buildTraceFromPipelineRun(selectedAsset, selectedRun);
    const isLocalAsset = localAssets.some(
      (asset) => asset.asset_id === selectedAsset.asset_id,
    );
    if (!isLocalAsset || apiStatus !== "online") {
      setObjectTrace(
        fallbackTrace
          ? { status: "success", trace: fallbackTrace }
          : { status: "idle" },
      );
      return;
    }

    let cancelled = false;
    setObjectTrace({
      status: "loading",
      trace: fallbackTrace,
    });
    getLocalObjectTrace(selectedAsset.asset_id)
      .then((response) => {
        if (cancelled) return;
        setObjectTrace({
          status: "success",
          trace: response.trace,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Unknown error";
        setObjectTrace({
          status: fallbackTrace ? "success" : "error",
          trace: fallbackTrace,
          error: message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [apiStatus, localAssets, selectedAsset, selectedRun]);

  function handleSelectAsset(assetId: string) {
    const asset = assets.find((item) => item.asset_id === assetId);
    setSelectedAssetId(assetId);
    setNotice(
      asset
        ? t("app.objectSelected", { title: asset.title })
        : t("app.objectSelectedFallback"),
    );
  }

  function handleOpenSearchResult(result: SearchResult) {
    const asset = assets.find((item) => item.asset_id === result.asset_id);
    setActiveSource("all");
    setObjectFilter("all");
    setSelectedAssetId(result.asset_id);
    setNotice(
      asset
        ? t("app.searchResultSelected", { title: asset.title })
        : t("app.objectSelectedFallback"),
    );
  }

  async function handleAsk(question: string) {
    setAskResult({ status: "loading", question });
    setNotice(t("app.askLoading", { question }));

    try {
      const response = await askLocalApi({
        question,
        assetId: selectedAsset?.asset_id,
        assetTitle: selectedAsset?.title,
        context:
          selectedSnapshot?.evidence.map((item) => ({
            label: item.location?.section ?? item.evidence_id,
            quote: item.quote,
          })) ?? [],
      });

      setAskResult({
        status: "success",
        question,
        answer: response.answer,
        provider: response.provider,
        providerLabel: response.providerLabel,
        model: response.model,
        citations: response.citations ?? [],
        retrievalMode: response.retrieval?.mode,
        embeddingError: response.retrieval?.embeddingError,
      });
      setNotice(t("app.askDone"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setAskResult({
        status: "error",
        question,
        error: message,
      });
      setNotice(t("app.askError", { message }));
    }
  }

  async function ensureApiOnline(offlineNotice: string) {
    if (apiStatus === "online") return true;
    const refreshed = await refreshLocalRuntime();
    if (refreshed) return true;
    setNotice(offlineNotice);
    return false;
  }

  async function handleTestLlm() {
    if (!(await ensureApiOnline(t("app.llmApiOffline")))) {
      setLlmStatus("error");
      return;
    }

    setLlmStatus("checking");
    setNotice(t("app.llmChecking"));

    try {
      const response = await testLlmConnection();
      setLlmProvider(response.provider);
      if (response.ok) {
        setLlmStatus("online");
        setNotice(
          t("app.llmConnected", {
            model: response.model ?? response.provider.model,
          }),
        );
        return;
      }

      if (response.status === "missing_key") {
        setLlmStatus("missing-key");
        setNotice(t("app.llmMissingKey"));
        return;
      }

      setLlmStatus("error");
      setNotice(
        t("app.llmError", {
          message: response.error ?? response.status,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setLlmStatus("error");
      setNotice(t("app.llmError", { message }));
    }
  }

  async function handleTestEmbedding() {
    if (!(await ensureApiOnline(t("app.embeddingApiOffline")))) {
      return false;
    }

    try {
      const response = await testEmbeddingConnection();
      setEmbeddingProvider(response.provider);
      if (response.ok) {
        setNotice(
          t("app.embeddingConnected", {
            model: response.provider.embedModel,
            dimensions: response.dimensions ?? "-",
          }),
        );
        return true;
      }
      setNotice(
        t("app.embeddingError", {
          message: response.error ?? response.status,
        }),
      );
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setNotice(t("app.embeddingError", { message }));
      return false;
    }
  }

  async function handleSaveModelSettings(input: LlmConfigInput) {
    if (!(await ensureApiOnline(t("app.llmApiOffline")))) {
      return;
    }

    setIsSavingModelSettings(true);
    setNotice(t("app.modelSettingsSaving"));

    try {
      const response = await configureLlmProvider(input);
      setLlmProvider(response.provider);
      setEmbeddingProvider(response.ollama);
      setIsModelSettingsOpen(false);
      setNotice(t("app.modelSettingsSaved"));
      await handleTestEmbedding();
      await handleTestLlm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setNotice(t("app.modelSettingsError", { message }));
      setLlmStatus("error");
    } finally {
      setIsSavingModelSettings(false);
    }
  }

  function handleInspectorAction(action: SuggestedAction) {
    const translatedLabel = t(`action.${action.action_id}`);
    const label = translatedLabel === `action.${action.action_id}` ? action.label : translatedLabel;

    if (action.kind === "export" && selectedAsset && selectedSnapshot) {
      downloadJson(`${safeFilename(selectedAsset.title)}-snapshot.json`, {
        asset: selectedAsset,
        snapshot: selectedSnapshot,
      });
      setNotice(t("app.snapshotExported", { title: selectedAsset.title }));
      return;
    }

    setNotice(t("app.actionQueued", { action: label, title: selectedAsset?.title ?? t("app.selectedObject") }));
  }

  async function handleImportFiles(files: File[]) {
    if (files.length === 0) {
      setNotice(t("app.importEmpty"));
      return;
    }
    if (isBulkImporting) {
      setNotice(t("app.importBusy"));
      return;
    }
    if (!(await ensureApiOnline(t("app.importApiOffline")))) {
      setBulkImportSummary({
        total: files.length,
        succeeded: 0,
        failed: files.length,
        completedAt: new Date().toISOString(),
        items: files.map((file, index) => ({
          id: `offline-${index}-${file.name}`,
          name: file.name,
          sizeBytes: file.size,
          status: "failed",
          error: t("app.importApiOffline"),
        })),
      });
      return;
    }

    const results: BulkImportSummaryItem[] = [];
    setBulkImportSummary(null);
    setBulkImportProgress({ total: files.length, completed: 0 });
    setNotice(t("app.importBatchStarting", { count: files.length }));

    for (const [index, file] of files.entries()) {
      setBulkImportProgress({
        total: files.length,
        completed: index,
        currentName: file.name,
      });
      try {
        if (!isSupportedTextFile(file)) {
          throw new Error(t("app.importUnsupportedFile"));
        }

        setNotice(
          t("app.importProgress", {
            completed: index + 1,
            total: files.length,
            name: file.name,
          }),
        );
        const content = await file.text();
        const record = await ingestLocalFile({
          title: file.name,
          source_uri: `browser-file://${file.name}`,
          mime_type: file.type || "text/plain",
          size_bytes: file.size,
          content,
        });

        setLocalAssets((current) => mergeAssets([], [record.asset, ...current]));
        setLocalSnapshots((current) => ({
          ...current,
          [record.asset.asset_id]: record.snapshot,
        }));
        setLocalPipelineRuns((current) => [record.pipelineRun, ...current]);
        results.push({
          id: `success-${record.asset.asset_id}`,
          name: file.name,
          sizeBytes: file.size,
          status: "succeeded",
          assetId: record.asset.asset_id,
          title: record.asset.title,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        results.push({
          id: `failed-${index}-${file.name}`,
          name: file.name,
          sizeBytes: file.size,
          status: "failed",
          error: message,
        });
      } finally {
        setBulkImportProgress({
          total: files.length,
          completed: index + 1,
          currentName: file.name,
        });
      }
    }

    const succeeded = results.filter((item) => item.status === "succeeded").length;
    const failed = results.length - succeeded;
    const lastImported = [...results].reverse().find((item) => item.assetId);
    if (lastImported?.assetId) {
      setSelectedAssetId(lastImported.assetId);
      setActiveSource("local-files");
      setObjectFilter("all");
      setQuery("");
      setAskResult({ status: "idle" });
    }
    setBulkImportProgress(null);
    setBulkImportSummary({
      total: results.length,
      succeeded,
      failed,
      completedAt: new Date().toISOString(),
      items: results,
    });
    setNotice(
      t("app.importBatchDone", {
        succeeded,
        failed,
        total: results.length,
      }),
    );
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    setDragDepth((current) => current + 1);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    setDragDepth((current) => Math.max(0, current - 1));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) return;
    event.preventDefault();
    setDragDepth(0);
    const files = Array.from(event.dataTransfer.files);
    void handleImportFiles(files);
  }

  function handleOpenImportedAsset(assetId: string) {
    setSelectedAssetId(assetId);
    setActiveSource("local-files");
    setObjectFilter("all");
    setQuery("");
    setBulkImportSummary(null);
    setNotice(t("app.objectSelectedFallback"));
  }

  async function handleCreateNote(input: { title: string; content: string }) {
    try {
      setNotice(t("app.noteSaving", { title: input.title }));
      const content = `# ${input.title}\n\n${input.content}`;
      const record = await ingestLocalFile({
        kind: "note",
        title: input.title,
        source_uri: `note://${Date.now()}`,
        mime_type: "text/markdown",
        size_bytes: new Blob([content]).size,
        content,
      });

      setLocalAssets((current) => mergeAssets([], [record.asset, ...current]));
      setLocalSnapshots((current) => ({
        ...current,
        [record.asset.asset_id]: record.snapshot,
      }));
      setLocalPipelineRuns((current) => [record.pipelineRun, ...current]);
      setSelectedAssetId(record.asset.asset_id);
      setActiveSource("notes");
      setAskResult({ status: "idle" });
      setIsNoteComposerOpen(false);
      setNotice(t("app.noteSaved", { title: input.title }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setNotice(t("app.noteError", { message }));
    }
  }

  async function handleCaptureUrl(input: { title: string; url: string; content: string }) {
    try {
      setNotice(t("app.urlSaving", { title: input.title }));
      const record = await ingestLocalFile({
        kind: "url",
        title: input.title,
        source_uri: input.url,
        mime_type: "text/markdown",
        size_bytes: new Blob([input.content]).size,
        content: input.content,
      });

      setLocalAssets((current) => mergeAssets([], [record.asset, ...current]));
      setLocalSnapshots((current) => ({
        ...current,
        [record.asset.asset_id]: record.snapshot,
      }));
      setLocalPipelineRuns((current) => [record.pipelineRun, ...current]);
      setSelectedAssetId(record.asset.asset_id);
      setActiveSource("urls");
      setAskResult({ status: "idle" });
      setIsUrlCaptureOpen(false);
      setNotice(t("app.urlSaved", { title: input.title }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setNotice(t("app.urlError", { message }));
    }
  }

  async function handleDeleteSelectedAsset() {
    if (!selectedAsset || !canDeleteSelected) return;
    const confirmed = window.confirm(t("app.deleteConfirm", { title: selectedAsset.title }));
    if (!confirmed) return;

    try {
      const deleted = await deleteLocalAsset(selectedAsset.asset_id);
      setLocalAssets((current) =>
        current.filter((asset) => asset.asset_id !== deleted.asset_id),
      );
      setLocalSnapshots((current) => {
        const next = { ...current };
        delete next[deleted.asset_id];
        return next;
      });
      setLocalPipelineRuns((current) =>
        current.filter((run) => run.asset_id !== deleted.asset_id),
      );
      setAskResult({ status: "idle" });
      setSelectedAssetId(undefined);
      setNotice(t("app.deleteDone", { title: deleted.title }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setNotice(t("app.deleteError", { message }));
    }
  }

  async function handleSaveMetadata(input: { title: string; tags: string[] }) {
    if (!selectedAsset || !canEditSelected) return;

    setIsSavingMetadata(true);
    setNotice(t("app.metadataSaving", { title: input.title }));
    try {
      const response = await updateLocalAssetMetadata({
        assetId: selectedAsset.asset_id,
        title: input.title,
        tags: input.tags,
      });
      setLocalAssets((current) =>
        current.map((asset) =>
          asset.asset_id === response.asset.asset_id ? response.asset : asset,
        ),
      );
      if (response.snapshot) {
        setLocalSnapshots((current) => ({
          ...current,
          [response.asset.asset_id]: response.snapshot as SemanticSnapshot,
        }));
      }
      setIsMetadataOpen(false);
      setNotice(t("app.metadataSaved", { title: response.asset.title }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setNotice(t("app.metadataError", { message }));
    } finally {
      setIsSavingMetadata(false);
    }
  }

  return (
    <div
      className={`app-shell${isDragActive ? " app-shell--dragging" : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragActive ? (
        <div className="drop-overlay" role="status">
          <div className="drop-overlay__panel">
            <UploadCloud size={40} aria-hidden="true" />
            <strong>{t("bulkImport.dropTitle")}</strong>
            <span>{t("bulkImport.dropHint")}</span>
          </div>
        </div>
      ) : null}
      <ShellHeader
        apiStatus={apiStatus}
        llmStatus={llmStatus}
        onAsk={handleAsk}
        onCaptureUrl={() => setIsUrlCaptureOpen(true)}
        onCreateNote={() => setIsNoteComposerOpen(true)}
        onImportFiles={handleImportFiles}
        onOpenModelSettings={() => setIsModelSettingsOpen(true)}
        onTestLlm={handleTestLlm}
        readyObjects={readyObjects}
        reviewObjects={reviewObjects}
        selectedTitle={selectedAsset?.title}
        totalObjects={assets.length}
      />

      <div className="notice-bar" role="status">
        {notice}
      </div>

      {bulkImportProgress ? (
        <div className="bulk-import-progress" role="status">
          <span>
            {t("bulkImport.progress", {
              completed: bulkImportProgress.completed,
              total: bulkImportProgress.total,
              name: bulkImportProgress.currentName ?? "-",
            })}
          </span>
          <progress
            max={bulkImportProgress.total}
            value={bulkImportProgress.completed}
          />
        </div>
      ) : null}

      <div className="workspace-grid">
        <SourceSidebar
          activeSource={activeSource}
          counts={sourceCounts}
          onSourceChange={(source) => {
            setActiveSource(source);
            setNotice(t("app.sourceChanged", { count: sourceCounts[source] }));
          }}
        />

        <ObjectList
          assets={filteredAssets}
          canEditSelected={canEditSelected}
          canDeleteSelected={canDeleteSelected}
          filter={objectFilter}
          onEditSelected={() => {
            if (canEditSelected) setIsMetadataOpen(true);
          }}
          onDeleteSelected={handleDeleteSelectedAsset}
          onFilterChange={(filter) => {
            setObjectFilter(filter);
            setNotice(t("app.filterApplied", { filter }));
          }}
          onOpenSearchResult={handleOpenSearchResult}
          onQueryChange={(nextQuery) => {
            setQuery(nextQuery);
            setNotice(
              nextQuery.trim()
                ? t("app.searchApplied", { query: nextQuery.trim() })
                : t("app.ready"),
            );
          }}
          onSelectAsset={handleSelectAsset}
          query={query}
          semanticSearch={semanticSearch}
          selectedAssetId={selectedAsset?.asset_id}
        />

        <SemanticInspector
          askResult={askResult}
          asset={selectedAsset}
          onAction={handleInspectorAction}
          preview={objectPreview.preview}
          previewError={objectPreview.error}
          previewStatus={objectPreview.status}
          snapshot={selectedSnapshot}
        />

        <PipelineStrip
          asset={selectedAsset}
          recentRuns={pipelineRuns}
          run={selectedRun}
          trace={objectTrace.trace}
          traceError={objectTrace.error}
          traceStatus={objectTrace.status}
        />
      </div>
      {isNoteComposerOpen ? (
        <NoteComposer
          onCancel={() => setIsNoteComposerOpen(false)}
          onSave={handleCreateNote}
        />
      ) : null}
      {isUrlCaptureOpen ? (
        <UrlCaptureModal
          onCancel={() => setIsUrlCaptureOpen(false)}
          onFetch={fetchUrlContent}
          onSave={handleCaptureUrl}
        />
      ) : null}
      {isMetadataOpen && selectedAsset ? (
        <ObjectMetadataModal
          asset={selectedAsset}
          isSaving={isSavingMetadata}
          onCancel={() => setIsMetadataOpen(false)}
          onSave={handleSaveMetadata}
        />
      ) : null}
      {isModelSettingsOpen ? (
        <ModelSettingsModal
          isSaving={isSavingModelSettings}
          embedding={embeddingProvider}
          onCancel={() => setIsModelSettingsOpen(false)}
          onSave={handleSaveModelSettings}
          provider={llmProvider}
        />
      ) : null}
      {bulkImportSummary ? (
        <BulkImportSummaryModal
          onClose={() => setBulkImportSummary(null)}
          onOpenAsset={handleOpenImportedAsset}
          summary={bulkImportSummary}
        />
      ) : null}
    </div>
  );
}
