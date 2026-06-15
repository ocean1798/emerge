import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");
const localDataDir = path.join(serverRoot, "local-data");
const settingsPath = path.join(localDataDir, "settings.json");
const DEFAULT_CHAT_PATH = "/chat/completions";
const CHAT_COMPLETIONS_SUFFIX = "/chat/completions";

function loadEnvFile(filename) {
  const envPath = path.join(serverRoot, filename);
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

function cleanBaseUrl(value, fallback = "") {
  const baseUrl = String(value || fallback).trim();
  return baseUrl.replace(/\/+$/, "");
}

function cleanChatPath(value, fallback = DEFAULT_CHAT_PATH) {
  const rawPath =
    typeof value === "string" && value.trim() ? value.trim() : fallback;
  const chatPath = rawPath.replace(/^\/+|\/+$/g, "");
  return `/${chatPath}`;
}

function parseJsonEnv(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function cleanPersistedOpenAICompatibleSettings(value) {
  if (!value || typeof value !== "object") return {};

  const next = {};
  if (typeof value.baseUrl === "string" && value.baseUrl.trim()) {
    try {
      next.baseUrl = assertValidUrl(value.baseUrl.trim());
    } catch {
      // Ignore invalid persisted settings so a bad local file cannot prevent boot.
    }
  }
  if (typeof value.model === "string" && value.model.trim()) {
    next.model = value.model.trim();
  }
  if (typeof value.providerLabel === "string" && value.providerLabel.trim()) {
    next.providerLabel = value.providerLabel.trim();
  }
  if (typeof value.chatPath === "string" && value.chatPath.trim()) {
    next.chatPath = cleanChatPath(value.chatPath);
  }
  return next;
}

function cleanPersistedOllamaSettings(value) {
  if (!value || typeof value !== "object") return {};

  const next = {};
  if (typeof value.baseUrl === "string" && value.baseUrl.trim()) {
    try {
      next.baseUrl = assertValidUrl(value.baseUrl.trim());
    } catch {
      // Ignore invalid persisted settings so a bad local file cannot prevent boot.
    }
  }
  if (typeof value.embedModel === "string" && value.embedModel.trim()) {
    next.embedModel = value.embedModel.trim();
  }
  return next;
}

function loadLocalSettings() {
  if (!fs.existsSync(settingsPath)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistModelSettings() {
  try {
    fs.mkdirSync(localDataDir, { recursive: true });
    const current = loadLocalSettings();
    const next = {
      ...current,
      schemaVersion: "0.1.0",
      updatedAt: new Date().toISOString(),
      openaiCompatible: {
        baseUrl: config.openaiCompatible.baseUrl,
        model: config.openaiCompatible.model,
        providerLabel: config.openaiCompatible.providerLabel,
        chatPath: config.openaiCompatible.chatPath,
      },
      ollama: {
        baseUrl: config.ollama.baseUrl,
        embedModel: config.ollama.embedModel,
      },
    };
    const tmpPath = path.join(
      localDataDir,
      `settings.${process.pid}.${Date.now()}.json.tmp`,
    );
    fs.writeFileSync(tmpPath, JSON.stringify(next, null, 2), "utf8");
    fs.renameSync(tmpPath, settingsPath);
    config.openaiCompatible.providerSettingsPersisted = true;
    config.openaiCompatible.providerSettingsError = "";
    config.ollama.providerSettingsPersisted = true;
    config.ollama.providerSettingsError = "";
  } catch (error) {
    config.openaiCompatible.providerSettingsPersisted = false;
    config.openaiCompatible.providerSettingsError =
      error instanceof Error ? error.message : "Unable to persist provider settings";
    config.ollama.providerSettingsPersisted = false;
    config.ollama.providerSettingsError =
      error instanceof Error ? error.message : "Unable to persist embedding settings";
  }
}

function assertValidUrl(value) {
  try {
    return new URL(value).toString().replace(/\/+$/, "");
  } catch {
    const error = new Error("baseUrl must be a valid URL");
    error.statusCode = 400;
    throw error;
  }
}

function normalizeOpenAICompatibleEndpoint(baseUrl, chatPath) {
  const parsed = new URL(assertValidUrl(baseUrl));
  let normalizedPath = cleanChatPath(chatPath);

  if (parsed.pathname.endsWith(CHAT_COMPLETIONS_SUFFIX)) {
    const basePath =
      parsed.pathname.slice(0, -CHAT_COMPLETIONS_SUFFIX.length) || "/";
    parsed.pathname = basePath;
    normalizedPath = DEFAULT_CHAT_PATH;
  }

  return {
    baseUrl: parsed.toString().replace(/\/+$/, ""),
    chatPath: normalizedPath,
  };
}

const persistedSettings = loadLocalSettings();
const persistedOpenAICompatible = cleanPersistedOpenAICompatibleSettings(
  persistedSettings.openaiCompatible,
);
const persistedOllama = cleanPersistedOllamaSettings(persistedSettings.ollama);

export const config = {
  port: Number(process.env.PORT || 8787),
  openaiCompatible: {
    baseUrl: cleanBaseUrl(
      persistedOpenAICompatible.baseUrl || process.env.OPENAI_BASE_URL,
      "https://api.deepseek.com",
    ),
    apiKey: process.env.OPENAI_API_KEY || "",
    model: persistedOpenAICompatible.model || process.env.OPENAI_MODEL || "deepseek-v4-flash",
    providerLabel:
      persistedOpenAICompatible.providerLabel ||
      process.env.OPENAI_PROVIDER_LABEL ||
      "OpenAI-compatible",
    chatPath: persistedOpenAICompatible.chatPath || cleanChatPath(process.env.OPENAI_CHAT_PATH),
    organization: process.env.OPENAI_ORGANIZATION || process.env.OPENAI_ORG_ID || "",
    project: process.env.OPENAI_PROJECT || process.env.OPENAI_PROJECT_ID || "",
    extraBody: parseJsonEnv(process.env.OPENAI_EXTRA_BODY_JSON),
    providerSettingsPersisted: Object.keys(persistedOpenAICompatible).length > 0,
    providerSettingsError: "",
    apiKeyStorage: "runtime-only",
  },
  ollama: {
    baseUrl: cleanBaseUrl(
      persistedOllama.baseUrl || process.env.OLLAMA_BASE_URL,
      "http://localhost:11434",
    ),
    embedModel:
      persistedOllama.embedModel || process.env.OLLAMA_EMBED_MODEL || "embeddinggemma",
    providerSettingsPersisted: Object.keys(persistedOllama).length > 0,
    providerSettingsError: "",
  },
};

export function publicConfig() {
  return {
    port: config.port,
    openaiCompatible: {
      baseUrl: config.openaiCompatible.baseUrl,
      model: config.openaiCompatible.model,
      providerLabel: config.openaiCompatible.providerLabel,
      chatPath: config.openaiCompatible.chatPath,
      apiKeyConfigured: Boolean(config.openaiCompatible.apiKey),
      providerSettingsPersisted: Boolean(config.openaiCompatible.providerSettingsPersisted),
      providerSettingsError: config.openaiCompatible.providerSettingsError,
      apiKeyStorage: config.openaiCompatible.apiKeyStorage,
      organizationConfigured: Boolean(config.openaiCompatible.organization),
      projectConfigured: Boolean(config.openaiCompatible.project),
    },
    ollama: {
      baseUrl: config.ollama.baseUrl,
      embedModel: config.ollama.embedModel,
      providerSettingsPersisted: Boolean(config.ollama.providerSettingsPersisted),
      providerSettingsError: config.ollama.providerSettingsError,
    },
  };
}

export function updateOpenAICompatibleConfig(input = {}) {
  if (typeof input !== "object" || input === null) {
    const error = new Error("config payload must be an object");
    error.statusCode = 400;
    throw error;
  }

  const hasBaseUrl = typeof input.baseUrl === "string" && input.baseUrl.trim();
  const hasChatPath = Object.hasOwn(input, "chatPath");
  if (hasBaseUrl || hasChatPath) {
    const endpoint = normalizeOpenAICompatibleEndpoint(
      hasBaseUrl ? input.baseUrl.trim() : config.openaiCompatible.baseUrl,
      hasChatPath ? input.chatPath : config.openaiCompatible.chatPath,
    );
    config.openaiCompatible.baseUrl = endpoint.baseUrl;
    config.openaiCompatible.chatPath = endpoint.chatPath;
  }
  if (typeof input.model === "string" && input.model.trim()) {
    config.openaiCompatible.model = input.model.trim();
  }
  if (typeof input.providerLabel === "string" && input.providerLabel.trim()) {
    config.openaiCompatible.providerLabel = input.providerLabel.trim();
  }
  if (typeof input.apiKey === "string") {
    config.openaiCompatible.apiKey = input.apiKey.trim();
  }
  if (typeof input.embeddingBaseUrl === "string" && input.embeddingBaseUrl.trim()) {
    config.ollama.baseUrl = assertValidUrl(input.embeddingBaseUrl.trim());
  }
  if (typeof input.embeddingModel === "string" && input.embeddingModel.trim()) {
    config.ollama.embedModel = input.embeddingModel.trim();
  }

  persistModelSettings();

  return publicConfig();
}
