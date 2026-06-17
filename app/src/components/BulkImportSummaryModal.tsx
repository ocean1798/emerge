import { CheckCircle2, ExternalLink, FileText, X, XCircle } from "lucide-react";

import { useI18n } from "../i18n";

export interface BulkImportSummaryItem {
  id: string;
  name: string;
  sizeBytes: number;
  status: "succeeded" | "failed";
  assetId?: string;
  title?: string;
  error?: string;
}

export interface BulkImportSummary {
  total: number;
  succeeded: number;
  failed: number;
  completedAt: string;
  items: BulkImportSummaryItem[];
}

interface BulkImportSummaryModalProps {
  summary: BulkImportSummary;
  onClose: () => void;
  onOpenAsset: (assetId: string) => void;
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function BulkImportSummaryModal({
  summary,
  onClose,
  onOpenAsset,
}: BulkImportSummaryModalProps) {
  const { t } = useI18n();

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby="bulk-import-summary-title"
        className="bulk-import-summary"
        role="dialog"
      >
        <div className="bulk-import-summary__header">
          <div>
            <span className="eyebrow">{t("bulkImport.eyebrow")}</span>
            <h2 id="bulk-import-summary-title">
              <FileText size={18} aria-hidden="true" />
              {t("bulkImport.title")}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            title={t("bulkImport.close")}
            type="button"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="bulk-import-summary__stats" aria-label={t("bulkImport.stats")}>
          <span>
            <strong>{summary.total}</strong>
            {t("bulkImport.total")}
          </span>
          <span className="bulk-import-summary__stat--success">
            <strong>{summary.succeeded}</strong>
            {t("bulkImport.succeeded")}
          </span>
          <span className={summary.failed === 0 ? "bulk-import-summary__stat--failed-muted" : "bulk-import-summary__stat--failed"}>
            <strong>{summary.failed}</strong>
            {t("bulkImport.failed")}
          </span>
        </div>

        <div className="bulk-import-summary__list">
          {summary.items.map((item) => (
            <article
              className={`bulk-import-item bulk-import-item--${item.status}`}
              key={item.id}
            >
              <div className="bulk-import-item__status">
                {item.status === "succeeded" ? (
                  <CheckCircle2 size={17} aria-hidden="true" />
                ) : (
                  <XCircle size={17} aria-hidden="true" />
                )}
              </div>
              <div className="bulk-import-item__body">
                <strong>{item.name}</strong>
                <small>
                  {item.status === "succeeded"
                    ? t("bulkImport.itemSucceeded")
                    : t("bulkImport.itemFailed")}
                  {" · "}
                  {formatBytes(item.sizeBytes)}
                </small>
                {item.error ? <p>{item.error}</p> : null}
              </div>
              {item.assetId ? (
                <button
                  className="icon-button"
                  onClick={() => onOpenAsset(item.assetId as string)}
                  title={t("bulkImport.openObject")}
                  type="button"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                </button>
              ) : null}
            </article>
          ))}
        </div>

        <div className="bulk-import-summary__actions">
          <button className="primary-command" onClick={onClose} type="button">
            {t("bulkImport.close")}
          </button>
        </div>
      </section>
    </div>
  );
}
