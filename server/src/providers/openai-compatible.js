import { config } from "../config.js";

export async function askOpenAICompatible({ question, context = [], assetTitle }) {
  if (!config.openaiCompatible.apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const headers = {
    Authorization: `Bearer ${config.openaiCompatible.apiKey}`,
    "Content-Type": "application/json",
  };
  if (config.openaiCompatible.organization) {
    headers["OpenAI-Organization"] = config.openaiCompatible.organization;
  }
  if (config.openaiCompatible.project) {
    headers["OpenAI-Project"] = config.openaiCompatible.project;
  }

  const evidenceContext = context
    .map((item, index) => {
      const label = item.label || item.asset_title || `Evidence ${index + 1}`;
      const quote = item.quote || item.text || "";
      return `[${index + 1}] ${label}\n${quote}`;
    })
    .join("\n\n");

  const messages = [
    {
      role: "system",
      content:
        "You are Emerge, a local-first semantic asset assistant. Answer with concise reasoning and cite supplied evidence numbers when available. If evidence is insufficient, say what is missing.",
    },
    {
      role: "user",
      content: [
        assetTitle ? `Selected asset: ${assetTitle}` : "Selected asset: none",
        evidenceContext ? `Evidence:\n${evidenceContext}` : "Evidence: none supplied",
        `Question: ${question}`,
      ].join("\n\n"),
    },
  ];

  const response = await fetch(
    `${config.openaiCompatible.baseUrl}${config.openaiCompatible.chatPath}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.openaiCompatible.model,
        messages,
        stream: false,
        ...config.openaiCompatible.extraBody,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI-compatible API failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const answer = payload?.choices?.[0]?.message?.content || "";

  return {
    provider: "openai-compatible",
    providerLabel: config.openaiCompatible.providerLabel,
    model: config.openaiCompatible.model,
    answer,
    raw: payload,
  };
}

export async function testOpenAICompatible() {
  const result = await askOpenAICompatible({
    question: "Reply with exactly: Emerge LLM OK.",
    assetTitle: "LLM connectivity diagnostic",
    context: [
      {
        label: "Runtime connection check",
        quote: "This is a minimal connectivity check from the local Emerge API.",
      },
    ],
  });

  return {
    provider: result.provider,
    providerLabel: result.providerLabel,
    model: result.model,
    sample: result.answer.slice(0, 500),
  };
}
