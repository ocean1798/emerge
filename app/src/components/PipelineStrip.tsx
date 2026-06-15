import { Activity, AlertTriangle, CheckCircle2, Clock3, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ObjectTracePanel } from "./ObjectTracePanel";
import { StatusPill } from "./StatusPill";
import { useI18n } from "../i18n";
import type { Asset, ObjectTrace, PipelineRun, PipelineStepStatus } from "../types/domain";

interface PipelineStripProps {
  asset?: Asset;
  run?: PipelineRun;
  recentRuns: PipelineRun[];
  trace?: ObjectTrace;
  traceStatus: "idle" | "loading" | "success" | "error";
  traceError?: string;
}

const stepIcons: Record<PipelineStepStatus, LucideIcon> = {
  queued: Clock3,
  running: Loader2,
  succeeded: CheckCircle2,
  failed: AlertTriangle,
  skipped: Clock3,
};

const stepLabelKeys = {
  ingest: "pipeline.ingest",
  parse: "pipeline.parse",
  snapshot: "pipeline.snapshot",
  index: "pipeline.index",
  verify: "pipeline.verify",
};

export function PipelineStrip({
  asset,
  run,
  recentRuns,
  trace,
  traceStatus,
  traceError,
}: PipelineStripProps) {
  const { t } = useI18n();

  return (
    <section className="pipeline-strip" aria-label={t("pipeline.title")}>
      <div className="pipeline-head">
        <div>
          <span className="eyebrow">{t("pipeline.title")}</span>
          <strong>{asset ? asset.title : t("pipeline.recentJobs")}</strong>
        </div>
        <span>{t("pipeline.trackedRuns", { count: recentRuns.length })}</span>
      </div>

      {run ? (
        <div className="pipeline-steps">
          {run.steps.map((step) => {
            const Icon = stepIcons[step.status];
            return (
              <div className={`pipeline-step pipeline-step--${step.status}`} key={step.name}>
                <div className="step-icon">
                  <Icon size={16} aria-hidden="true" />
                </div>
                <div>
                  <strong>{t(stepLabelKeys[step.name])}</strong>
                  <span>{step.message ?? <StatusPill status={step.status} type="pipeline" />}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="pipeline-empty">
          <Activity size={18} aria-hidden="true" />
          <span>{t("pipeline.empty")}</span>
        </div>
      )}

      <ObjectTracePanel trace={trace} status={traceStatus} error={traceError} />
    </section>
  );
}
