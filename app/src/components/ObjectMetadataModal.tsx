import { FormEvent, useMemo, useState } from "react";
import { Save, Tags, X } from "lucide-react";

import { useI18n } from "../i18n";
import type { Asset } from "../types/domain";

interface ObjectMetadataModalProps {
  asset: Asset;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (input: { title: string; tags: string[] }) => void;
}

function parseTags(value: string) {
  const seen = new Set<string>();
  return value
    .split(/[,，\n]/g)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

export function ObjectMetadataModal({
  asset,
  isSaving,
  onCancel,
  onSave,
}: ObjectMetadataModalProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState(asset.title);
  const [tagsText, setTagsText] = useState(asset.tags.join(", "));
  const parsedTags = useMemo(() => parseTags(tagsText), [tagsText]);
  const canSave = title.trim().length > 0 && !isSaving;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    onSave({
      title: title.trim(),
      tags: parsedTags,
    });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="note-composer object-metadata" onSubmit={handleSubmit}>
        <div className="note-composer__header">
          <h2>
            <Tags size={18} aria-hidden="true" />
            {t("metadata.title")}
          </h2>
          <button
            className="icon-button"
            onClick={onCancel}
            title={t("metadata.cancel")}
            type="button"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <label>
          <span>{t("metadata.titleLabel")}</span>
          <input
            autoFocus
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>

        <label>
          <span>{t("metadata.tagsLabel")}</span>
          <textarea
            className="metadata-tags-input"
            onChange={(event) => setTagsText(event.target.value)}
            placeholder={t("metadata.tagsPlaceholder")}
            value={tagsText}
          />
        </label>

        <div className="tag-row">
          {parsedTags.length > 0 ? (
            parsedTags.map((tag) => (
              <span className="tag-chip" key={tag}>
                {tag}
              </span>
            ))
          ) : (
            <span className="object-path">{t("metadata.noTags")}</span>
          )}
        </div>

        <div className="note-composer__actions">
          <button onClick={onCancel} type="button">
            {t("metadata.cancel")}
          </button>
          <button className="primary-command" disabled={!canSave} type="submit">
            <Save size={16} aria-hidden="true" />
            {isSaving ? t("metadata.saving") : t("metadata.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
