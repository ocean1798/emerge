import {
  AlertCircle,
  Braces,
  FileText,
  FolderOpen,
  Layers,
  Link2,
  Loader2,
  MoreHorizontal,
  NotebookText,
  Pencil,
  Search,
  SearchCheck,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { StatusPill } from "./StatusPill";
import { useI18n } from "../i18n";
import type {
  Asset,
  AssetKind,
  ObjectFilter,
  SearchResult,
  SearchStatus,
} from "../types/domain";

interface SemanticSearchState {
  status: SearchStatus;
  query: string;
  results: SearchResult[];
  retrievalMode?: "lexical" | "hybrid";
  embeddingError?: string | null;
  error?: string;
}

interface ObjectListProps {
  assets: Asset[];
  filter: ObjectFilter;
  query: string;
  semanticSearch: SemanticSearchState;
  selectedAssetId?: string;
  canEditSelected: boolean;
  canDeleteSelected: boolean;
  onFilterChange: (filter: ObjectFilter) => void;
  onEditSelected: () => void;
  onDeleteSelected: () => void;
  onOpenSearchResult: (result: SearchResult) => void;
  onQueryChange: (query: string) => void;
  onSelectAsset: (assetId: string) => void;
}

const filterLabelKeys: Record<ObjectFilter, string> = {
  all: "filter.all",
  ready: "filter.ready",
  "in-progress": "filter.inProgress",
  "needs-review": "filter.needsReview",
};

const filterOrder: ObjectFilter[] = ["all", "ready", "in-progress", "needs-review"];

const kindIcons: Record<AssetKind, LucideIcon> = {
  file: FileText,
  url: Link2,
  note: NotebookText,
  folder: FolderOpen,
  collection: Layers,
};

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatSize(size: number | undefined, noSize: string) {
  if (!size) return noSize;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 102.4) / 10} KB`;
  return `${Math.round(size / 1024 / 102.4) / 10} MB`;
}

function formatScore(score: number) {
  return Math.round(score * 100);
}

export function ObjectList({
  assets,
  filter,
  query,
  semanticSearch,
  selectedAssetId,
  canEditSelected,
  canDeleteSelected,
  onFilterChange,
  onEditSelected,
  onDeleteSelected,
  onOpenSearchResult,
  onQueryChange,
  onSelectAsset,
}: ObjectListProps) {
  const { locale, t } = useI18n();
  const semanticMode = semanticSearch.retrievalMode
    ? t(
        semanticSearch.retrievalMode === "hybrid"
          ? "semanticSearch.hybridMode"
          : "semanticSearch.lexicalMode",
      )
    : "";
  const hasSemanticHits =
    semanticSearch.status === "success" && semanticSearch.results.length > 0;

  return (
    <main className="object-panel" aria-label={t("objects.title")}>
      <div className="object-toolbar">
        <div>
          <h1>{t("objects.title")}</h1>
          <p>{t("objects.count", { count: assets.length })}</p>
        </div>

        <div className="toolbar-actions">
          <div className="search-field">
            <Search size={16} aria-hidden="true" />
            <input
              aria-label={t("objects.searchLabel")}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={t("objects.searchPlaceholder")}
              value={query}
            />
          </div>

          <button className="icon-button" type="button" title={t("objects.filterSettings")}>
            <SlidersHorizontal size={17} aria-hidden="true" />
          </button>

          <button
            className="icon-button"
            disabled={!canEditSelected}
            onClick={onEditSelected}
            type="button"
            title={
              canEditSelected
                ? t("objects.editSelected")
                : t("objects.editSelectedDisabled")
            }
          >
            <Pencil size={17} aria-hidden="true" />
          </button>

          <button
            className="icon-button"
            disabled={!canDeleteSelected}
            onClick={onDeleteSelected}
            type="button"
            title={
              canDeleteSelected
                ? t("objects.deleteSelected")
                : t("objects.deleteSelectedDisabled")
            }
          >
            <Trash2 size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="segmented-control" aria-label={t("objects.statusFilter")}>
        {filterOrder.map((item) => (
          <button
            aria-pressed={filter === item}
            className={filter === item ? "segment segment--active" : "segment"}
            key={item}
            onClick={() => onFilterChange(item)}
            type="button"
          >
            {t(filterLabelKeys[item])}
          </button>
        ))}
      </div>

      {semanticSearch.query ? (
        <section className="semantic-search-panel" aria-live="polite">
          <div className="semantic-search-head">
            <div>
              <SearchCheck size={16} aria-hidden="true" />
              <strong>{t("semanticSearch.title")}</strong>
            </div>
            <span>
              {semanticSearch.status === "success"
                ? t("semanticSearch.resultCount", {
                    count: semanticSearch.results.length,
                  })
                : semanticMode}
            </span>
          </div>

          {semanticSearch.status === "loading" ? (
            <div className="semantic-search-state">
              <Loader2 size={16} aria-hidden="true" />
              <span>{t("semanticSearch.loading")}</span>
            </div>
          ) : null}

          {semanticSearch.status === "error" ? (
            <div className="semantic-search-state semantic-search-state--error">
              <AlertCircle size={16} aria-hidden="true" />
              <span>
                {t("semanticSearch.error", {
                  message: semanticSearch.error ?? t("semanticSearch.unknownError"),
                })}
              </span>
            </div>
          ) : null}

          {semanticSearch.status === "success" && semanticSearch.results.length === 0 ? (
            <div className="semantic-search-state">
              <span>{t("semanticSearch.empty")}</span>
            </div>
          ) : null}

          {semanticSearch.status === "success" && semanticSearch.results.length > 0 ? (
            <div className="semantic-result-list">
              {semanticSearch.results.map((result) => (
                <button
                  className="semantic-result"
                  key={result.citation_id}
                  onClick={() => onOpenSearchResult(result)}
                  title={t("semanticSearch.open")}
                  type="button"
                >
                  <div className="semantic-result__head">
                    <strong>{result.label}</strong>
                    <span>
                      {t("semanticSearch.score", {
                        score: formatScore(result.score),
                      })}
                      {" · "}
                      {result.match_type === "hybrid"
                        ? t("semanticSearch.hybrid")
                        : t("semanticSearch.lexical")}
                    </span>
                  </div>
                  <p>{result.quote}</p>
                  <span className="semantic-result__source">
                    {result.source_uri ?? result.location?.section ?? result.asset_id}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {semanticSearch.embeddingError && semanticSearch.status === "success" ? (
            <p className="semantic-search-note">
              {t("semanticSearch.embeddingFallback", {
                message: semanticSearch.embeddingError,
              })}
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="object-list">
        {assets.length === 0 ? (
          <div className="empty-state">
            <Braces size={32} aria-hidden="true" />
            <strong>
              {hasSemanticHits
                ? t("objects.noTitleMatchTitle")
                : t("objects.emptyTitle")}
            </strong>
            <span>
              {hasSemanticHits
                ? t("objects.noTitleMatchHint")
                : t("objects.emptyHint")}
            </span>
          </div>
        ) : (
          assets.map((asset) => {
            const Icon = kindIcons[asset.kind];
            const isSelected = selectedAssetId === asset.asset_id;

            return (
              <button
                aria-pressed={isSelected}
                className={`object-row ${isSelected ? "object-row--selected" : ""}`}
                key={asset.asset_id}
                onClick={() => onSelectAsset(asset.asset_id)}
                type="button"
              >
                <div className={`object-kind object-kind--${asset.kind}`}>
                  <Icon size={20} aria-hidden="true" />
                </div>

                <div className="object-main">
                  <div className="object-title-line">
                    <strong>{asset.title}</strong>
                    <StatusPill status={asset.status} />
                  </div>
                  <span className="object-path">{asset.source_uri}</span>
                  <div className="tag-row">
                    {asset.tags.slice(0, 4).map((tag) => (
                      <span className="tag-chip" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="object-meta">
                  <span>{formatDate(asset.updated_at, locale)}</span>
                  <span>{formatSize(asset.size_bytes, t("objects.noSize"))}</span>
                </div>

                <div className="row-actions" aria-hidden="true">
                  <MoreHorizontal size={18} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </main>
  );
}
