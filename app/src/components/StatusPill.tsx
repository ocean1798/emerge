import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { AssetStatus, PipelineStepStatus } from "../types/domain";
import { useI18n } from "../i18n";

interface StatusMeta {
  labelKey: string;
  icon: LucideIcon;
  tone: string;
}

const assetStatusMeta: Record<AssetStatus, StatusMeta> = {
  queued: { labelKey: "status.queued", icon: Clock3, tone: "neutral" },
  indexing: { labelKey: "status.indexing", icon: Loader2, tone: "info" },
  ready: { labelKey: "status.ready", icon: CheckCircle2, tone: "success" },
  partial: { labelKey: "status.partial", icon: CircleDashed, tone: "warning" },
  error: { labelKey: "status.error", icon: AlertTriangle, tone: "danger" },
  stale: { labelKey: "status.stale", icon: RefreshCw, tone: "muted" },
};

const pipelineStatusMeta: Record<PipelineStepStatus, StatusMeta> = {
  queued: { labelKey: "status.queued", icon: Clock3, tone: "neutral" },
  running: { labelKey: "status.running", icon: Loader2, tone: "info" },
  succeeded: { labelKey: "status.succeeded", icon: CheckCircle2, tone: "success" },
  failed: { labelKey: "status.failed", icon: AlertTriangle, tone: "danger" },
  skipped: { labelKey: "status.skipped", icon: CircleDashed, tone: "muted" },
};

interface StatusPillProps {
  status: AssetStatus | PipelineStepStatus;
  type?: "asset" | "pipeline";
}

export function StatusPill({ status, type = "asset" }: StatusPillProps) {
  const { t } = useI18n();
  const meta =
    type === "asset"
      ? assetStatusMeta[status as AssetStatus]
      : pipelineStatusMeta[status as PipelineStepStatus];
  const Icon = meta.icon;

  return (
    <span className={`status-pill status-pill--${meta.tone}`}>
      <Icon size={14} aria-hidden="true" />
      {t(meta.labelKey)}
    </span>
  );
}
