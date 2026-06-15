import { AlertTriangle, CheckCircle2, Clock3, ListTree } from "lucide-react";

import { useI18n } from "../i18n";
import type { ObjectTrace, PipelineStepStatus, TraceEvent } from "../types/domain";

interface ObjectTracePanelProps {
  trace?: ObjectTrace;
  status: "idle" | "loading" | "success" | "error";
  error?: string;
}

const statusIcons: Record<PipelineStepStatus, typeof CheckCircle2> = {
  queued: Clock3,
  running: Clock3,
  succeeded: CheckCircle2,
  failed: AlertTriangle,
  skipped: Clock3,
};

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

function detailsText(event: TraceEvent) {
  if (!event.details || Object.keys(event.details).length === 0) return "";
  return JSON.stringify(event.details, null, 2);
}

export function ObjectTracePanel({ trace, status, error }: ObjectTracePanelProps) {
  const { t } = useI18n();
  const events = trace?.events ?? [];

  return (
    <section className="object-trace-panel" aria-label={t("trace.title")}>
      <div className="object-trace-head">
        <div>
          <span className="eyebrow">{t("trace.title")}</span>
          <strong>
            {trace
              ? t("trace.eventCount", { count: trace.eventCount })
              : t("trace.noSelection")}
          </strong>
        </div>
        <ListTree size={18} aria-hidden="true" />
      </div>

      {status === "loading" ? (
        <p className="object-trace-state">{t("trace.loading")}</p>
      ) : null}

      {status === "error" ? (
        <p className="object-trace-state object-trace-state--error">
          {t("trace.error", { message: error ?? t("trace.unknownError") })}
        </p>
      ) : null}

      {status !== "loading" && status !== "error" && events.length === 0 ? (
        <p className="object-trace-state">{t("trace.empty")}</p>
      ) : null}

      {events.length > 0 ? (
        <ol className="object-trace-list">
          {events.slice(0, 10).map((event) => {
            const Icon = statusIcons[event.status] ?? Clock3;
            const detail = detailsText(event);
            return (
              <li className={`object-trace-event object-trace-event--${event.status}`} key={event.trace_id}>
                <div className="object-trace-event__icon">
                  <Icon size={15} aria-hidden="true" />
                </div>
                <div className="object-trace-event__body">
                  <div>
                    <strong>{event.title || event.kind}</strong>
                    <span>{formatTime(event.created_at)}</span>
                  </div>
                  <p>{event.message || t(`trace.kind.${event.kind}`)}</p>
                  <small>
                    {event.kind}
                    {event.duration_ms ? ` · ${event.duration_ms}ms` : ""}
                  </small>
                  {detail ? (
                    <details>
                      <summary>{t("trace.details")}</summary>
                      <pre>{detail}</pre>
                    </details>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}
