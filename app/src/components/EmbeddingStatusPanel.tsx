import { useEffect, useState } from "react";
import { Database, RefreshCw } from "lucide-react";

import { useI18n } from "../i18n";
import { getIndexStatus, reindexAll, reindexAsset } from "../api/client";
import type { IndexStatus, ReindexResult } from "../types/domain";

interface EmbeddingStatusPanelProps {
  assetId?: string;
  disabled?: boolean;
}

type ReindexTarget = "all" | "single" | null;

export function EmbeddingStatusPanel({ assetId, disabled }: EmbeddingStatusPanelProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<IndexStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reindexTarget, setReindexTarget] = useState<ReindexTarget>(null);
  const [lastResult, setLastResult] = useState<ReindexResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getIndexStatus();
      setStatus(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function handleReindex(target: ReindexTarget) {
    if (!target) return;
    setReindexTarget(target);
    setLastResult(null);
    setError(null);

    try {
      const result = target === "single" && assetId
        ? await reindexAsset(assetId)
        : await reindexAll();
      setLastResult(result);
      if (!result.ok) {
        setError(result.error || "Reindex failed");
      }
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setReindexTarget(null);
    }
  }

  const isReindexing = reindexTarget !== null;
  const hasStale = status ? status.staleChunks > 0 : false;
  const hasChunks = status ? status.totalChunks > 0 : false;

  return (
    <div className="embedding-status-panel">
      <div className="embedding-status-panel__header">
        <Database size={16} aria-hidden="true" />
        <span>{t("embeddingStatus.title")}</span>
        <button
          className="icon-button"
          disabled={isLoading || isReindexing}
          onClick={() => void loadStatus()}
          title={t("embeddingStatus.refresh")}
          type="button"
        >
          <RefreshCw size={14} className={isLoading ? "spin" : ""} aria-hidden="true" />
        </button>
      </div>

      {error ? (
        <div className="embedding-status-panel__error" role="alert">
          {error}
        </div>
      ) : null}

      {status ? (
        <div className="embedding-status-panel__grid">
          <div>
            <span>{t("embeddingStatus.model")}</span>
            <strong>{status.currentModel ?? t("embeddingStatus.noModel")}</strong>
          </div>
          <div>
            <span>{t("embeddingStatus.totalChunks")}</span>
            <strong>{status.totalChunks}</strong>
          </div>
          <div>
            <span>{t("embeddingStatus.embedded")}</span>
            <strong className={status.embeddedChunks > 0 ? "text-success" : ""}>
              {status.embeddedChunks}
            </strong>
          </div>
          <div>
            <span>{t("embeddingStatus.lexical")}</span>
            <strong>{status.lexicalChunks}</strong>
          </div>
          {status.staleChunks > 0 ? (
            <div>
              <span>{t("embeddingStatus.stale")}</span>
              <strong className="text-warn">{status.staleChunks}</strong>
            </div>
          ) : null}
          {status.embeddingModels.length > 0 ? (
            <div>
              <span>{t("embeddingStatus.models")}</span>
              <strong>{status.embeddingModels.join(", ")}</strong>
            </div>
          ) : null}
        </div>
      ) : isLoading ? (
        <p className="embedding-status-panel__loading">{t("embeddingStatus.loading")}</p>
      ) : null}

      {lastResult ? (
        <div
          className={`embedding-status-panel__result ${lastResult.ok ? "embedding-status-panel__result--ok" : "embedding-status-panel__result--fail"}`}
          role="status"
        >
          {lastResult.ok
            ? t("embeddingStatus.reindexDone", {
                count: lastResult.reindexed,
                model: lastResult.model ?? "-",
              })
            : t("embeddingStatus.reindexFailed", {
                message: lastResult.error ?? "unknown",
              })}
          {lastResult.fallback ? (
            <small>{t("embeddingStatus.fallback", { mode: lastResult.fallback })}</small>
          ) : null}
        </div>
      ) : null}

      <div className="embedding-status-panel__actions">
        {assetId ? (
          <button
            className="icon-text-button"
            disabled={!hasChunks || isReindexing || disabled}
            onClick={() => void handleReindex("single")}
            type="button"
          >
            <RefreshCw size={14} className={reindexTarget === "single" ? "spin" : ""} aria-hidden="true" />
            {reindexTarget === "single"
              ? t("embeddingStatus.reindexing")
              : t("embeddingStatus.reindexSelected")}
          </button>
        ) : null}
        <button
          className="icon-text-button"
          disabled={!hasChunks || isReindexing || disabled}
          onClick={() => void handleReindex("all")}
          type="button"
        >
          <RefreshCw size={14} className={reindexTarget === "all" ? "spin" : ""} aria-hidden="true" />
          {reindexTarget === "all"
            ? t("embeddingStatus.reindexing")
            : t("embeddingStatus.reindexAll")}
        </button>
      </div>

      {hasStale && !isReindexing ? (
        <small className="embedding-status-panel__hint">
          {t("embeddingStatus.staleHint")}
        </small>
      ) : null}
    </div>
  );
}
