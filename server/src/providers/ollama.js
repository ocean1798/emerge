import { config } from "../config.js";

let resolvedEmbedModel = "";

function getOllamaModelNames(payload) {
  if (!Array.isArray(payload?.models)) return [];
  return payload.models
    .map((model) => model?.name)
    .filter((name) => typeof name === "string" && name.trim());
}

function chooseEmbeddingModel(names) {
  const configured = config.ollama.embedModel;
  if (names.includes(configured)) return configured;

  return (
    names.find((name) => /embedding|embed|bge|nomic|mxbai/i.test(name)) ||
    configured
  );
}

async function resolveEmbedModel() {
  if (resolvedEmbedModel === config.ollama.embedModel) return resolvedEmbedModel;

  try {
    const tags = await getOllamaTags();
    const selected = chooseEmbeddingModel(getOllamaModelNames(tags));
    resolvedEmbedModel = selected;
    config.ollama.embedModel = selected;
    return selected;
  } catch {
    resolvedEmbedModel = config.ollama.embedModel;
    return resolvedEmbedModel;
  }
}

async function postOllamaJson(path, body) {
  const response = await fetch(`${config.ollama.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Ollama ${path} failed: ${response.status} ${errorText}`);
    error.statusCode = response.status;
    throw error;
  }

  return response.json();
}

function normalizeEmbeddings(payload) {
  if (Array.isArray(payload?.embeddings)) return payload.embeddings;
  if (Array.isArray(payload?.embedding)) return [payload.embedding];
  return [];
}

async function embedWithCurrentApi(input, model) {
  const payload = await postOllamaJson("/api/embed", {
    model,
    input,
  });
  return normalizeEmbeddings(payload);
}

async function embedWithLegacyApi(input, model) {
  const inputs = Array.isArray(input) ? input : [input];
  const embeddings = [];
  for (const prompt of inputs) {
    const payload = await postOllamaJson("/api/embeddings", {
      model,
      prompt,
    });
    embeddings.push(...normalizeEmbeddings(payload));
  }
  return embeddings;
}

export async function embedWithOllama(input) {
  if (!input) {
    throw new Error("input is required");
  }

  const model = await resolveEmbedModel();
  let embeddings;
  try {
    embeddings = await embedWithCurrentApi(input, model);
  } catch (error) {
    if (error?.statusCode !== 404) throw error;
    embeddings = await embedWithLegacyApi(input, model);
  }

  return {
    provider: "ollama",
    model,
    embeddings,
  };
}

export async function getOllamaTags() {
  const response = await fetch(`${config.ollama.baseUrl}/api/tags`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama tags failed: ${response.status} ${errorText}`);
  }
  return response.json();
}
