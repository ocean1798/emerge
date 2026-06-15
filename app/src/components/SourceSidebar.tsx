import {
  AlertCircle,
  Boxes,
  FileText,
  FolderOpen,
  Link2,
  NotebookText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useI18n } from "../i18n";
import type { SourceFilter } from "../types/domain";

interface SourceSidebarProps {
  activeSource: SourceFilter;
  counts: Record<SourceFilter, number>;
  onSourceChange: (source: SourceFilter) => void;
}

const sourceIcons: Record<SourceFilter, LucideIcon> = {
  all: Boxes,
  "local-files": FolderOpen,
  notes: NotebookText,
  urls: Link2,
  collections: FileText,
  "needs-review": AlertCircle,
};

const sourceOrder: SourceFilter[] = [
  "all",
  "local-files",
  "notes",
  "urls",
  "collections",
  "needs-review",
];

const sourceLabelKeys: Record<SourceFilter, string> = {
  all: "sources.all",
  "local-files": "sources.localFiles",
  notes: "sources.notes",
  urls: "sources.urls",
  collections: "sources.collections",
  "needs-review": "sources.needsReview",
};

export function SourceSidebar({
  activeSource,
  counts,
  onSourceChange,
}: SourceSidebarProps) {
  const { t } = useI18n();

  return (
    <aside className="source-sidebar" aria-label={t("sources.title")}>
      <div className="panel-title">
        <span>{t("sources.title")}</span>
        <strong>{counts.all}</strong>
      </div>

      <div className="source-list">
        {sourceOrder.map((source) => {
          const Icon = sourceIcons[source];
          const isActive = activeSource === source;

          return (
            <button
              aria-pressed={isActive}
              className={`source-item ${isActive ? "source-item--active" : ""}`}
              key={source}
              onClick={() => onSourceChange(source)}
              type="button"
            >
              <Icon size={18} aria-hidden="true" />
              <span>{t(sourceLabelKeys[source])}</span>
              <strong>{counts[source]}</strong>
            </button>
          );
        })}
      </div>

      <div className="storage-meter" aria-label={t("sources.store")}>
        <div>
          <span>{t("sources.store")}</span>
          <strong>2.8 GB</strong>
        </div>
        <div className="meter-track">
          <span style={{ width: "42%" }} />
        </div>
      </div>
    </aside>
  );
}
