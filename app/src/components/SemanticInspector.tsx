import {
  ArrowUpRight,
  Bot,
  Download,
  FileText,
  FileQuestion,
  Network,
  ShieldCheck,
  Tags,
} from "lucide-react";

import { StatusPill } from "./StatusPill";
import { useI18n } from "../i18n";
import type {
  AskResult,
  Asset,
  ObjectPreview,
  SemanticSnapshot,
  SuggestedAction,
} from "../types/domain";

interface SemanticInspectorProps {
  asset?: Asset;
  snapshot?: SemanticSnapshot;
  preview?: ObjectPreview;
  previewStatus: "idle" | "loading" | "success" | "error";
  previewError?: string;
  askResult: AskResult;
  onAction: (action: SuggestedAction) => void;
}

function confidenceLabel(confidence: number) {
  return `${Math.round(confidence * 100)}%`;
}

function translateActionLabel(
  t: (key: string) => string,
  actionId: string,
  fallback: string,
) {
  const key = `action.${actionId}`;
  const translated = t(key);
  return translated === key ? fallback : translated;
}

export function SemanticInspector({
  asset,
  snapshot,
  preview,
  previewStatus,
  previewError,
  askResult,
  onAction,
}: SemanticInspectorProps) {
  const { t } = useI18n();

  if (!asset) {
    return (
      <aside className="inspector-panel" aria-label={t("inspector.title")}>
        <div className="empty-state empty-state--compact">
          <FileQuestion size={32} aria-hidden="true" />
          <strong>{t("inspector.noObjectTitle")}</strong>
          <span>{t("inspector.noObjectHint")}</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="inspector-panel" aria-label={t("inspector.title")}>
      <div className="inspector-header">
        <div>
          <span className="eyebrow">{t("inspector.title")}</span>
          <h2>{asset.title}</h2>
        </div>
        <StatusPill status={asset.status} />
      </div>

      {!snapshot ? (
        <div className="snapshot-missing">
          <FileQuestion size={24} aria-hidden="true" />
          <strong>{t("inspector.snapshotUnavailable")}</strong>
          <span>
            {asset.status === "error"
              ? t("inspector.parsingFailed")
              : t("inspector.snapshotPending")}
          </span>
          <button
            type="button"
            onClick={() =>
              onAction({
                action_id: "act-retry-snapshot",
                label: t("inspector.retry"),
                kind: "trace",
              })
            }
          >
            {t("inspector.retry")}
          </button>
        </div>
      ) : (
        <div className="inspector-scroll">
          <section className="inspector-section ask-result-section">
            <div className="section-heading">
              <Bot size={16} aria-hidden="true" />
              <span>{t("askResult.title")}</span>
            </div>
            {askResult.status === "idle" ? (
              <p className="summary-copy">{t("askResult.waiting")}</p>
            ) : askResult.status === "loading" ? (
              <p className="summary-copy">{t("askResult.loading")}</p>
            ) : askResult.status === "error" ? (
              <div className="ask-error">
                <strong>{t("askResult.errorTitle")}</strong>
                <span>{askResult.error}</span>
                <small>{t("askResult.hint")}</small>
              </div>
            ) : (
              <article className="ask-answer">
                {askResult.question ? (
                  <div className="ask-question">
                    <span>{t("askResult.question")}</span>
                    <strong>{askResult.question}</strong>
                  </div>
                ) : null}
                <p>{askResult.answer}</p>
                <div className="ask-answer-meta">
                  <span>
                    {t("askResult.provider")}:{" "}
                    {askResult.providerLabel ?? askResult.provider}
                  </span>
                  <span>
                    {t("askResult.model")}: {askResult.model}
                  </span>
                  {askResult.retrievalMode ? (
                    <span>
                      {t("askResult.retrieval")}:{" "}
                      {t(`retrieval.${askResult.retrievalMode}`)}
                    </span>
                  ) : null}
                </div>
                {askResult.embeddingError ? (
                  <small className="ask-retrieval-note">
                    {t("askResult.embeddingFallback")}
                  </small>
                ) : null}
                {askResult.citations?.length ? (
                  <div className="ask-citation-list">
                    <span>{t("askResult.citations")}</span>
                    {askResult.citations.slice(0, 4).map((citation) => (
                      <article className="ask-citation-card" key={citation.citation_id}>
                        <strong>
                          {citation.label} · {Math.round(citation.score * 100)}%
                        </strong>
                        <p>{citation.quote}</p>
                      </article>
                    ))}
                  </div>
                ) : null}
              </article>
            )}
          </section>

          <section className="inspector-section">
            <div className="section-heading">
              <Bot size={16} aria-hidden="true" />
              <span>{t("inspector.summary")}</span>
            </div>
            <p className="summary-copy">{snapshot.summary}</p>
          </section>

          <section className="inspector-section object-preview-section">
            <div className="section-heading">
              <FileText size={16} aria-hidden="true" />
              <span>{t("preview.title")}</span>
            </div>
            {previewStatus === "loading" ? (
              <p className="summary-copy">{t("preview.loading")}</p>
            ) : null}
            {previewError ? (
              <p className="preview-error">
                {t("preview.error", { message: previewError })}
              </p>
            ) : null}
            {preview ? (
              <div className="object-preview">
                <div className="preview-meta-grid">
                  <div>
                    <span>{t("preview.source")}</span>
                    <strong>{preview.source_uri}</strong>
                  </div>
                  <div>
                    <span>{t("preview.indexed")}</span>
                    <strong>
                      {t("preview.indexedValue", {
                        chunks: preview.chunkCount,
                        chars: preview.indexedChars,
                      })}
                    </strong>
                  </div>
                  <div>
                    <span>{t("preview.kind")}</span>
                    <strong>{preview.mime_type || preview.kind}</strong>
                  </div>
                </div>
                <div className="preview-chunk-list">
                  {preview.chunks.length > 0 ? (
                    preview.chunks.map((chunk) => (
                      <article className="preview-chunk" key={chunk.chunk_id}>
                        <div>
                          <strong>{chunk.label}</strong>
                          <span>
                            {chunk.embedding_model
                              ? t("preview.vectorIndexed")
                              : t("preview.lexicalIndexed")}
                          </span>
                        </div>
                        <p>{chunk.text}</p>
                      </article>
                    ))
                  ) : (
                    <p className="summary-copy">{t("preview.empty")}</p>
                  )}
                </div>
                {preview.isPartial ? (
                  <small className="preview-note">
                    {t("preview.partial", {
                      shown: preview.returnedChunks,
                      total: preview.chunkCount,
                    })}
                  </small>
                ) : null}
              </div>
            ) : previewStatus !== "loading" ? (
              <p className="summary-copy">{t("preview.unavailable")}</p>
            ) : null}
          </section>

          <section className="inspector-section">
            <div className="section-heading">
              <Tags size={16} aria-hidden="true" />
              <span>{t("inspector.topics")}</span>
            </div>
            <div className="topic-list">
              {snapshot.topics.map((topic) => (
                <span className="topic-chip" key={topic.name}>
                  {topic.name}
                  <strong>{confidenceLabel(topic.weight)}</strong>
                </span>
              ))}
            </div>
          </section>

          <section className="inspector-section">
            <div className="section-heading">
              <Network size={16} aria-hidden="true" />
              <span>{t("inspector.entities")}</span>
            </div>
            <div className="entity-list">
              {snapshot.entities.map((entity) => (
                <div className="entity-row" key={`${entity.kind}-${entity.name}`}>
                  <span>{entity.name}</span>
                  <small>
                    {t(`entity.${entity.kind}`)} · {confidenceLabel(entity.confidence)}
                  </small>
                </div>
              ))}
            </div>
          </section>

          <section className="inspector-section">
            <div className="section-heading">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>{t("inspector.evidence")}</span>
            </div>
            <div className="evidence-list">
              {snapshot.evidence.map((item) => (
                <article className="evidence-card" key={item.evidence_id}>
                  <p>{item.quote}</p>
                  <div>
                    <span>{item.location?.section ?? "source"}</span>
                    <strong>{confidenceLabel(item.confidence)}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="inspector-section">
            <div className="section-heading">
              <ArrowUpRight size={16} aria-hidden="true" />
              <span>{t("inspector.actions")}</span>
            </div>
            <div className="action-grid">
              {snapshot.suggested_actions.map((action) => (
                <button
                  key={action.action_id}
                  onClick={() => onAction(action)}
                  type="button"
                >
                  {translateActionLabel(t, action.action_id, action.label)}
                </button>
              ))}
            </div>
          </section>

          <section className="inspector-section">
            <div className="section-heading">
              <Download size={16} aria-hidden="true" />
              <span>{t("inspector.metadata")}</span>
            </div>
            <dl className="metadata-grid">
              <div>
                <dt>{t("inspector.schema")}</dt>
                <dd>{snapshot.schema_version}</dd>
              </div>
              <div>
                <dt>{t("inspector.confidence")}</dt>
                <dd>{confidenceLabel(snapshot.confidence)}</dd>
              </div>
              <div>
                <dt>{t("inspector.freshness")}</dt>
                <dd>{t(`freshness.${snapshot.freshness}`)}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </aside>
  );
}
