import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Search,
} from "lucide-react";

import { getAskHistory, getSearchHistory } from "../api/client";
import { useI18n } from "../i18n";
import type { AskRun, SearchRun } from "../types/domain";

interface HistoryPanelProps {
  assetId?: string;
}

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryPanel({ assetId }: HistoryPanelProps) {
  const { t } = useI18n();
  const [askRuns, setAskRuns] = useState<AskRun[]>([]);
  const [searchRuns, setSearchRuns] = useState<SearchRun[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string>();
  const [expanded, setExpanded] = useState(false);

  const loadHistory = useCallback(async () => {
    setStatus("loading");
    setError(undefined);
    try {
      const [askRes, searchRes] = await Promise.all([
        getAskHistory({ assetId, limit: 10 }),
        getSearchHistory({ assetId, limit: 10 }),
      ]);
      setAskRuns(askRes.runs);
      setSearchRuns(searchRes.runs);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : t("history.unknownError"));
    }
  }, [assetId, t]);

  useEffect(() => {
    if (expanded) {
      loadHistory();
    }
  }, [expanded, loadHistory]);

  const totalRuns = askRuns.length + searchRuns.length;

  return (
    <section className="history-panel" aria-label={t("history.title")}>
      <button
        type="button"
        className="history-panel__toggle"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <span className="history-panel__toggle-label">
          {t("history.title")}
          {status === "success" ? (
            <small>{t("history.count", { count: totalRuns })}</small>
          ) : null}
        </span>
        <span className="history-panel__toggle-arrow">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded ? (
        <div className="history-panel__body">
          {status === "loading" ? (
            <p className="history-panel__state">{t("history.loading")}</p>
          ) : null}

          {status === "error" ? (
            <p className="history-panel__state history-panel__state--error">
              {t("history.error", { message: error ?? t("history.unknownError") })}
            </p>
          ) : null}

          {status === "success" && totalRuns === 0 ? (
            <p className="history-panel__state">{t("history.empty")}</p>
          ) : null}

          {askRuns.length > 0 ? (
            <div className="history-panel__section">
              <div className="history-panel__section-head">
                <MessageSquare size={14} aria-hidden="true" />
                <span>{t("history.askRuns")}</span>
              </div>
              <ol className="history-panel__list">
                {askRuns.map((run) => (
                  <li
                    className={`history-panel__item history-panel__item--${run.status}`}
                    key={run.run_id}
                  >
                    <div className="history-panel__item-icon">
                      {run.status === "succeeded" ? (
                        <CheckCircle2 size={13} aria-hidden="true" />
                      ) : (
                        <AlertTriangle size={13} aria-hidden="true" />
                      )}
                    </div>
                    <div className="history-panel__item-body">
                      <div className="history-panel__item-row">
                        <strong className="history-panel__item-query">{run.question}</strong>
                        <span className="history-panel__item-time">{formatTime(run.created_at)}</span>
                      </div>
                      <div className="history-panel__item-meta">
                        {run.provider ? <span>{run.provider}</span> : null}
                        {run.retrieval_mode ? (
                          <span>{t(`retrieval.${run.retrieval_mode}`)}</span>
                        ) : null}
                        <span>{t("history.citations", { count: run.citations_count })}</span>
                        <span className={`history-panel__status history-panel__status--${run.status}`}>
                          {t(`status.${run.status}`)}
                        </span>
                      </div>
                      {run.answer_preview ? (
                        <p className="history-panel__item-preview">{run.answer_preview}</p>
                      ) : null}
                      {run.error ? (
                        <p className="history-panel__item-error">{run.error}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {searchRuns.length > 0 ? (
            <div className="history-panel__section">
              <div className="history-panel__section-head">
                <Search size={14} aria-hidden="true" />
                <span>{t("history.searchRuns")}</span>
              </div>
              <ol className="history-panel__list">
                {searchRuns.map((run) => (
                  <li
                    className={`history-panel__item history-panel__item--${run.status}`}
                    key={run.run_id}
                  >
                    <div className="history-panel__item-icon">
                      {run.status === "succeeded" ? (
                        <CheckCircle2 size={13} aria-hidden="true" />
                      ) : (
                        <AlertTriangle size={13} aria-hidden="true" />
                      )}
                    </div>
                    <div className="history-panel__item-body">
                      <div className="history-panel__item-row">
                        <strong className="history-panel__item-query">{run.query}</strong>
                        <span className="history-panel__item-time">{formatTime(run.created_at)}</span>
                      </div>
                      <div className="history-panel__item-meta">
                        {run.retrieval_mode ? (
                          <span>{t(`retrieval.${run.retrieval_mode}`)}</span>
                        ) : null}
                        <span>{t("history.results", { count: run.result_count })}</span>
                        <span className={`history-panel__status history-panel__status--${run.status}`}>
                          {t(`status.${run.status}`)}
                        </span>
                      </div>
                      {run.error ? (
                        <p className="history-panel__item-error">{run.error}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
