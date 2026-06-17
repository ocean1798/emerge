import { useEffect, useState } from "react";
import { FileText, AlertTriangle } from "lucide-react";

import { useI18n } from "../i18n";
import { getLocalObjectSource } from "../api/client";
import type { ObjectSourceResponse } from "../api/client";

interface SourcePreviewPanelProps {
  assetId: string;
}

export function SourcePreviewPanel({ assetId }: SourcePreviewPanelProps) {
  const { t } = useI18n();
  const [source, setSource] = useState<ObjectSourceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSource() {
      setIsLoading(true);
      setError(null);
      setSource(null);
      try {
        const result = await getLocalObjectSource(assetId);
        if (!cancelled) {
          setSource(result.source);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSource();

    return () => {
      cancelled = true;
    };
  }, [assetId]);

  return (
    <div className="source-preview-panel">
      <div className="source-preview-panel__header">
        <FileText size={16} aria-hidden="true" />
        <span>{t("sourcePreview.title")}</span>
      </div>

      <p className="source-preview-panel__desc">
        {t("sourcePreview.description")}
      </p>

      {isLoading ? (
        <p className="source-preview-panel__loading">
          {t("sourcePreview.loading")}
        </p>
      ) : null}

      {error ? (
        <p className="source-preview-panel__error">
          {t("sourcePreview.error", { message: error })}
        </p>
      ) : null}

      {source ? (
        <>
          <div className="source-preview-panel__meta">
            <div>
              <span>{t("sourcePreview.charCount")}</span>
              <strong>{source.char_count.toLocaleString()}</strong>
            </div>
            <div>
              <span>{t("sourcePreview.source")}</span>
              <strong>{source.source_uri}</strong>
            </div>
          </div>

          <div className="source-preview-panel__content">
            <pre>{source.content}</pre>
          </div>

          {source.truncated ? (
            <div className="source-preview-panel__truncated" role="status">
              <AlertTriangle size={14} aria-hidden="true" />
              <span>
                {t("sourcePreview.truncated", {
                  total: source.char_count.toLocaleString(),
                })}
              </span>
            </div>
          ) : null}
        </>
      ) : !isLoading && !error ? (
        <p className="source-preview-panel__loading">
          {t("sourcePreview.unavailable")}
        </p>
      ) : null}
    </div>
  );
}
