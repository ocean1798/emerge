import { FormEvent, useMemo, useState } from "react";
import { DownloadCloud, Link2, Save, X } from "lucide-react";

import { useI18n } from "../i18n";
import type { UrlFetchResponse } from "../api/client";

interface UrlCaptureModalProps {
  onCancel: () => void;
  onFetch: (url: string) => Promise<UrlFetchResponse>;
  onSave: (input: { title: string; url: string; content: string }) => Promise<void>;
}

function titleFromUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "") || value;
  } catch {
    return value;
  }
}

export function UrlCaptureModal({ onCancel, onFetch, onSave }: UrlCaptureModalProps) {
  const { t } = useI18n();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [fetched, setFetched] = useState<UrlFetchResponse | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const trimmedUrl = url.trim();
  const inferredTitle = useMemo(() => titleFromUrl(trimmedUrl), [trimmedUrl]);
  const canSave = trimmedUrl.length > 0 && !isSaving;
  const previewText = fetched?.text.trim() ?? "";

  async function handleFetch() {
    if (!trimmedUrl || isFetching) return;

    setFetchError("");
    setIsFetching(true);
    try {
      const result = await onFetch(trimmedUrl);
      setFetched(result);
      if (!title.trim() && result.title) setTitle(result.title);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setFetchError(message);
    } finally {
      setIsFetching(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;

    const finalTitle = title.trim() || inferredTitle || t("url.defaultTitle");
    const content = [
      `# ${finalTitle}`,
      "",
      `${t("url.source")}: ${trimmedUrl}`,
      fetched?.finalUrl && fetched.finalUrl !== trimmedUrl
        ? `${t("url.finalUrl")}: ${fetched.finalUrl}`
        : "",
      fetched?.fetchedAt ? `${t("url.fetchedAt")}: ${fetched.fetchedAt}` : "",
      "",
      notes.trim() ? `## ${t("url.notesHeading")}\n\n${notes.trim()}` : "",
      previewText ? `## ${t("url.fetchedHeading")}\n\n${previewText}` : t("url.emptyNotes"),
    ]
      .filter(Boolean)
      .join("\n");

    setIsSaving(true);
    try {
      await onSave({
        title: finalTitle,
        url: trimmedUrl,
        content,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="note-composer" onSubmit={handleSubmit}>
        <div className="note-composer__header">
          <h2>
            <Link2 size={18} aria-hidden="true" />
            {t("url.title")}
          </h2>
          <button
            className="icon-button"
            onClick={onCancel}
            title={t("url.cancel")}
            type="button"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <label>
          <span>{t("url.urlLabel")}</span>
          <div className="url-fetch-row">
            <input
              autoFocus
              onChange={(event) => {
                setUrl(event.target.value);
                setFetched(null);
                setFetchError("");
              }}
              placeholder={t("url.urlPlaceholder")}
              required
              type="url"
              value={url}
            />
            <button
              className="icon-text-button"
              disabled={!trimmedUrl || isFetching}
              onClick={handleFetch}
              type="button"
            >
              <DownloadCloud size={16} aria-hidden="true" />
              {isFetching ? t("url.fetching") : t("url.fetch")}
            </button>
          </div>
        </label>

        {fetchError ? <p className="url-fetch-error">{t("url.fetchError", { message: fetchError })}</p> : null}

        <label>
          <span>{t("url.titleLabel")}</span>
          <input
            onChange={(event) => setTitle(event.target.value)}
            placeholder={inferredTitle || t("url.titlePlaceholder")}
            value={title}
          />
        </label>

        <label>
          <span>{t("url.notesLabel")}</span>
          <textarea
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t("url.notesPlaceholder")}
            value={notes}
          />
        </label>

        {fetched ? (
          <section className="url-fetch-preview">
            <div>
              <strong>{t("url.previewTitle")}</strong>
              <span>
                {t("url.previewMeta", {
                  count: previewText.length,
                  status: fetched.truncated ? t("url.truncated") : t("url.complete"),
                })}
              </span>
            </div>
            <p>{previewText || t("url.emptyFetch")}</p>
          </section>
        ) : null}

        <div className="note-composer__actions">
          <button onClick={onCancel} type="button">
            {t("url.cancel")}
          </button>
          <button className="primary-command" disabled={!canSave} type="submit">
            <Save size={16} aria-hidden="true" />
            {isSaving ? t("url.saving") : t("url.save")}
          </button>
        </div>
      </form>
    </div>
  );
}
