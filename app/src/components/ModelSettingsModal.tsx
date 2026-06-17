import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Settings, Sparkles, X } from "lucide-react";

import { EmbeddingStatusPanel } from "./EmbeddingStatusPanel";
import { useI18n } from "../i18n";
import type {
  LlmConfigInput,
  OllamaEmbeddingConfig,
  OpenAICompatibleProviderConfig,
} from "../api/client";

interface ModelSettingsModalProps {
  provider: OpenAICompatibleProviderConfig | null;
  embedding: OllamaEmbeddingConfig | null;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (input: LlmConfigInput) => void;
}

export function ModelSettingsModal({
  provider,
  embedding,
  isSaving,
  onCancel,
  onSave,
}: ModelSettingsModalProps) {
  const { t } = useI18n();
  const [baseUrl, setBaseUrl] = useState(provider?.baseUrl ?? "https://api.deepseek.com");
  const [providerLabel, setProviderLabel] = useState(
    provider?.providerLabel ?? "OpenAI-compatible",
  );
  const [model, setModel] = useState(provider?.model ?? "deepseek-v4-flash");
  const [chatPath, setChatPath] = useState(provider?.chatPath ?? "");
  const [embeddingBaseUrl, setEmbeddingBaseUrl] = useState(
    embedding?.baseUrl ?? "http://localhost:11434",
  );
  const [embeddingModel, setEmbeddingModel] = useState(
    embedding?.embedModel ?? "embeddinggemma",
  );
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    if (!provider) return;
    setBaseUrl(provider.baseUrl);
    setProviderLabel(provider.providerLabel);
    setModel(provider.model);
    setChatPath(provider.chatPath ?? "");
  }, [provider]);

  useEffect(() => {
    if (!embedding) return;
    setEmbeddingBaseUrl(embedding.baseUrl);
    setEmbeddingModel(embedding.embedModel);
  }, [embedding]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: LlmConfigInput = {
      baseUrl,
      providerLabel,
      model,
      chatPath: chatPath.trim(),
      embeddingBaseUrl,
      embeddingModel,
    };
    if (apiKey.trim()) input.apiKey = apiKey.trim();
    onSave(input);
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="model-settings" onSubmit={handleSubmit}>
        <div className="model-settings__header">
          <div>
            <span className="eyebrow">{t("modelSettings.eyebrow")}</span>
            <h2>
              <Settings size={18} aria-hidden="true" />
              {t("modelSettings.title")}
            </h2>
          </div>
          <button
            className="icon-button"
            onClick={onCancel}
            title={t("modelSettings.close")}
            type="button"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="provider-state">
          <KeyRound size={16} aria-hidden="true" />
          <span>
            <strong>
              {provider?.apiKeyConfigured
                ? t("modelSettings.keyConfigured")
                : t("modelSettings.keyMissing")}
            </strong>
            <small>
              {provider?.providerSettingsError
                ? t("modelSettings.providerPersistError", {
                    message: provider.providerSettingsError,
                  })
                : provider?.providerSettingsPersisted
                ? t("modelSettings.providerPersisted")
                : t("modelSettings.providerNotPersisted")}
            </small>
            <small>{t("modelSettings.keyRuntimeOnly")}</small>
          </span>
        </div>

        <div className="model-settings__grid">
          <div className="model-settings__section">
            <span>{t("modelSettings.llmSection")}</span>
            <small>{t("modelSettings.llmSectionHint")}</small>
          </div>
          <label>
            {t("modelSettings.baseUrl")}
            <input
              onChange={(event) => setBaseUrl(event.target.value)}
              placeholder="https://api.openai.com/v1"
              required
              type="url"
              value={baseUrl}
            />
          </label>
          <label>
            {t("modelSettings.model")}
            <input
              onChange={(event) => setModel(event.target.value)}
              placeholder="gpt-4.1-mini"
              required
              value={model}
            />
          </label>
          <label>
            {t("modelSettings.providerLabel")}
            <input
              onChange={(event) => setProviderLabel(event.target.value)}
              placeholder="OpenAI-compatible"
              required
              value={providerLabel}
            />
          </label>
          <label>
            {t("modelSettings.chatPath")}
            <input
              onChange={(event) => setChatPath(event.target.value)}
              placeholder="/chat/completions"
              value={chatPath}
            />
            <small>{t("modelSettings.chatPathHint")}</small>
          </label>

          <div className="model-settings__section">
            <span>{t("modelSettings.embeddingSection")}</span>
            <small>{t("modelSettings.embeddingSectionHint")}</small>
          </div>
          <label>
            {t("modelSettings.embeddingBaseUrl")}
            <input
              onChange={(event) => setEmbeddingBaseUrl(event.target.value)}
              placeholder="http://localhost:11434"
              required
              type="url"
              value={embeddingBaseUrl}
            />
          </label>
          <label>
            {t("modelSettings.embeddingModel")}
            <input
              onChange={(event) => setEmbeddingModel(event.target.value)}
              placeholder="embeddinggemma"
              required
              value={embeddingModel}
            />
          </label>
        </div>

        <label className="model-settings__key">
          {t("modelSettings.apiKey")}
          <input
            autoComplete="off"
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={t("modelSettings.apiKeyPlaceholder")}
            type="password"
            value={apiKey}
          />
        </label>

        <EmbeddingStatusPanel disabled={isSaving} />

        <div className="model-settings__actions">
          <button className="icon-text-button" onClick={onCancel} type="button">
            {t("modelSettings.cancel")}
          </button>
          <button className="primary-command" disabled={isSaving} type="submit">
            <Sparkles size={16} aria-hidden="true" />
            {isSaving ? t("modelSettings.saving") : t("modelSettings.saveAndTest")}
          </button>
        </div>
      </form>
    </div>
  );
}
