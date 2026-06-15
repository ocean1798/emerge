import { FormEvent, useState } from "react";
import { Save, X } from "lucide-react";

import { useI18n } from "../i18n";

interface NoteComposerProps {
  onCancel: () => void;
  onSave: (input: { title: string; content: string }) => Promise<void>;
}

export function NoteComposer({ onCancel, onSave }: NoteComposerProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedContent = content.trim();
    const trimmedTitle = title.trim() || t("note.defaultTitle");
    if (!trimmedContent || isSaving) return;

    setIsSaving(true);
    try {
      await onSave({ title: trimmedTitle, content: trimmedContent });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="note-composer" onSubmit={handleSubmit}>
        <div className="note-composer__header">
          <h2>{t("note.title")}</h2>
          <button
            className="icon-button"
            onClick={onCancel}
            title={t("note.cancel")}
            type="button"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <label>
          <span>{t("note.titleLabel")}</span>
          <input
            autoFocus
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("note.titlePlaceholder")}
            value={title}
          />
        </label>

        <label>
          <span>{t("note.contentLabel")}</span>
          <textarea
            onChange={(event) => setContent(event.target.value)}
            placeholder={t("note.contentPlaceholder")}
            value={content}
          />
        </label>

        <div className="note-composer__actions">
          <button onClick={onCancel} type="button">
            {t("note.cancel")}
          </button>
          <button className="primary-command" disabled={!content.trim() || isSaving} type="submit">
            <Save size={16} aria-hidden="true" />
            {isSaving ? t("note.saving") : t("note.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
