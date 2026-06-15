const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "into",
  "your",
  "you",
  "are",
  "was",
  "were",
  "have",
  "has",
  "not",
  "but",
  "can",
  "will",
  "what",
  "when",
  "where",
  "why",
  "how",
  "文件",
  "这个",
  "一个",
  "我们",
  "需要",
  "什么",
  "怎么",
  "为什么",
]);

function tokenize(value) {
  return (value || "")
    .toLowerCase()
    .match(/[\p{L}\p{N}][\p{L}\p{N}_-]{1,}/gu)
    ?.filter((token) => !STOP_WORDS.has(token)) ?? [];
}

function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return null;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }
  if (leftMagnitude === 0 || rightMagnitude === 0) return null;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function lexicalScore(queryTokens, chunk, asset) {
  if (queryTokens.length === 0) return 0;

  const chunkTokens = tokenize(
    [asset?.title, asset?.source_uri, ...(asset?.tags ?? []), chunk.text].join(" "),
  );
  if (chunkTokens.length === 0) return 0;

  const chunkSet = new Set(chunkTokens);
  const hits = queryTokens.filter((token) => chunkSet.has(token)).length;
  const coverage = hits / queryTokens.length;
  const density = hits / Math.max(8, chunkTokens.length);
  return Math.min(1, coverage * 0.86 + density * 0.14);
}

function normalizeVectorScore(score) {
  if (score === null) return null;
  return Math.max(0, Math.min(1, (score + 1) / 2));
}

function resultLabel(asset, chunk) {
  const section = chunk.location?.section ? ` · ${chunk.location.section}` : "";
  return `${asset?.title ?? chunk.title}${section}`;
}

export function searchStoreEvidence(
  store,
  { query, assetId, limit = 6, queryEmbedding } = {},
) {
  const chunks = Array.isArray(store.chunks) ? store.chunks : [];
  const assets = new Map((store.assets || []).map((asset) => [asset.asset_id, asset]));
  const queryTokens = tokenize(query);

  const scored = chunks.map((chunk) => {
    const asset = assets.get(chunk.asset_id);
    const lexical = lexicalScore(queryTokens, chunk, asset);
    const vector = normalizeVectorScore(cosineSimilarity(queryEmbedding, chunk.embedding));
    const hasVector = vector !== null;
    const selectedBoost = assetId && chunk.asset_id === assetId ? 0.18 : 0;
    const scopePenalty = assetId && chunk.asset_id !== assetId ? -0.04 : 0;
    const score = hasVector
      ? lexical * 0.52 + vector * 0.42 + selectedBoost + scopePenalty
      : lexical + selectedBoost + scopePenalty;

    return {
      asset,
      chunk,
      score: Math.max(0, Math.min(1, score)),
      match_type: hasVector ? "hybrid" : "lexical",
    };
  });

  return scored
    .filter((item) => item.score > 0.08)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item, index) => ({
      citation_id: `cite-${index + 1}`,
      asset_id: item.chunk.asset_id,
      chunk_id: item.chunk.chunk_id,
      evidence_id: item.chunk.evidence_id,
      label: resultLabel(item.asset, item.chunk),
      quote: item.chunk.text,
      score: Number(item.score.toFixed(4)),
      match_type: item.match_type,
      source_uri: item.asset?.source_uri ?? item.chunk.source_uri,
      location: item.chunk.location,
    }));
}

export function buildLocalRetrievalAnswer({ question, results }) {
  if (results.length === 0) {
    return [
      "未配置 OPENAI_API_KEY，因此先返回本地检索结果。",
      `问题：${question}`,
      "当前本地语义库没有找到足够相关的证据。可以先导入文件，或换一个更具体的问题。",
    ].join("\n\n");
  }

  const evidenceLines = results
    .slice(0, 4)
    .map(
      (item, index) =>
        `${index + 1}. ${item.label}（${Math.round(item.score * 100)}%）：${item.quote}`,
    );

  return [
    "未配置 OPENAI_API_KEY，因此先返回本地混合检索摘要。",
    `问题：${question}`,
    "命中的证据：",
    ...evidenceLines,
    "配置 OPENAI_API_KEY 后，同一批证据会交给 OpenAI-compatible LLM 生成完整回答。",
  ].join("\n");
}
