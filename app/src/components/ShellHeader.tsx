import {
  Bot,
  Database,
  Languages,
  Link2,
  Plug,
  PlugZap,
  Plus,
  Search,
  Settings,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { ChangeEvent, FormEvent, useRef, useState } from "react";

import { useI18n } from "../i18n";

interface ShellHeaderProps {
  totalObjects: number;
  readyObjects: number;
  reviewObjects: number;
  apiStatus: "checking" | "online" | "offline";
  llmStatus: "unknown" | "missing-key" | "checking" | "online" | "error";
  selectedTitle?: string;
  onAsk: (question: string) => void;
  onCreateNote: () => void;
  onCaptureUrl: () => void;
  onImportFiles: (files: File[]) => void;
  onOpenModelSettings: () => void;
  onTestLlm: () => void;
}

export function ShellHeader({
  totalObjects,
  readyObjects,
  reviewObjects,
  apiStatus,
  llmStatus,
  selectedTitle,
  onAsk,
  onCaptureUrl,
  onCreateNote,
  onImportFiles,
  onOpenModelSettings,
  onTestLlm,
}: ShellHeaderProps) {
  const { locale, setLocale, t } = useI18n();
  const [question, setQuestion] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    onAsk(trimmed);
    setQuestion("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) onImportFiles(files);
    event.target.value = "";
  }

  return (
    <header className="shell-header">
      <div className="brand-cluster" aria-label="Emerge workspace">
        <div className="brand-mark">
          <Sparkles size={20} aria-hidden="true" />
        </div>
        <div className="brand-copy">
          <strong>Emerge</strong>
          <span>{t("brand.subtitle")}</span>
        </div>
      </div>

      <nav className="mode-switcher" aria-label="Primary modes">
        <button className="mode-button mode-button--active" type="button">
          <Database size={16} aria-hidden="true" />
          {t("mode.objects")}
        </button>
        <button className="mode-button" type="button">
          <Bot size={16} aria-hidden="true" />
          {t("mode.ask")}
        </button>
        <button className="mode-button" type="button">
          <Search size={16} aria-hidden="true" />
          {t("mode.trace")}
        </button>
      </nav>

      <div className="workspace-stats" aria-label="Workspace status">
        <span>{t("stats.objects", { count: totalObjects })}</span>
        <span>{t("stats.ready", { count: readyObjects })}</span>
        <span>{t("stats.review", { count: reviewObjects })}</span>
        <span
          className={`api-status api-status--${apiStatus}`}
          title={t(`apiStatus.${apiStatus}Hint`)}
        >
          {apiStatus === "online" ? (
            <PlugZap size={13} aria-hidden="true" />
          ) : (
            <Plug size={13} aria-hidden="true" />
          )}
          {t(`apiStatus.${apiStatus}`)}
        </span>
        <button
          className={`llm-status llm-status--${llmStatus}`}
          onClick={onTestLlm}
          title={t(`llmStatus.${llmStatus}Hint`)}
          type="button"
        >
          {llmStatus === "online" ? (
            <Sparkles size={13} aria-hidden="true" />
          ) : (
            <Bot size={13} aria-hidden="true" />
          )}
          {t(`llmStatus.${llmStatus}`)}
        </button>
      </div>

      <form className="ask-form" onSubmit={handleSubmit}>
        <Search size={16} aria-hidden="true" />
        <input
          aria-label={t("ask.label")}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={
            selectedTitle
              ? t("ask.placeholder.asset", { title: selectedTitle })
              : t("ask.placeholder.global")
          }
          value={question}
        />
        <button className="icon-button icon-button--primary" type="submit" title={t("ask.submit")}>
          <Sparkles size={16} aria-hidden="true" />
        </button>
      </form>

      <div className="header-actions" aria-label="Object actions">
        <div className="language-toggle" aria-label={t("language.label")}>
          <Languages size={16} aria-hidden="true" />
          <button
            aria-pressed={locale === "zh-CN"}
            className={locale === "zh-CN" ? "language-button language-button--active" : "language-button"}
            onClick={() => setLocale("zh-CN")}
            type="button"
          >
            {t("language.zh")}
          </button>
          <button
            aria-pressed={locale === "en"}
            className={locale === "en" ? "language-button language-button--active" : "language-button"}
            onClick={() => setLocale("en")}
            type="button"
          >
            {t("language.en")}
          </button>
        </div>
        <input
          accept=".txt,.md,.markdown,.json,.csv,.html,.htm,text/*,application/json"
          className="visually-hidden"
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />
        <button
          className="icon-button"
          onClick={onOpenModelSettings}
          type="button"
          title={t("actions.modelSettings")}
        >
          <Settings size={18} aria-hidden="true" />
        </button>
        <button
          className="icon-button"
          onClick={onCaptureUrl}
          type="button"
          title={t("actions.captureUrl")}
        >
          <Link2 size={18} aria-hidden="true" />
        </button>
        <button
          className="icon-button"
          onClick={() => fileInputRef.current?.click()}
          type="button"
          title={t("actions.import")}
        >
          <UploadCloud size={18} aria-hidden="true" />
        </button>
        <button
          className="icon-button"
          onClick={onCreateNote}
          type="button"
          title={t("actions.createNote")}
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
