const MAX_FETCH_BYTES = 1_500_000;
const FETCH_TIMEOUT_MS = 10_000;

function assertFetchableUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    const error = new Error("url must be valid");
    error.statusCode = 400;
    throw error;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    const error = new Error("url must use http or https");
    error.statusCode = 400;
    throw error;
  }

  return parsed.toString();
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function textFromMatch(html, pattern) {
  const match = html.match(pattern);
  return match ? decodeHtmlEntities(match[1].replace(/\s+/g, " ").trim()) : "";
}

function extractTitle(html, fallbackUrl) {
  return (
    textFromMatch(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    textFromMatch(html, /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) ||
    textFromMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ||
    new URL(fallbackUrl).hostname.replace(/^www\./, "")
  );
}

function htmlToText(html) {
  const bodyMatch =
    html.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i) ||
    html.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i) ||
    html.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i);
  const source = bodyMatch ? bodyMatch[1] : html;

  return decodeHtmlEntities(
    source
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<(br|hr)\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|section|article|main|header|footer|li|h[1-6]|blockquote|pre)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t\f\v]+/g, " ")
      .replace(/\n\s+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

export async function fetchUrlContent(inputUrl) {
  const url = assertFetchableUrl(inputUrl);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Emerge-MVP/0.1 (+local semantic asset capture)",
      Accept: "text/html,text/plain,application/xhtml+xml;q=0.9,*/*;q=0.5",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    const error = new Error(`URL fetch failed: ${response.status}`);
    error.statusCode = 502;
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  const buffer = await response.arrayBuffer();
  const bytes = buffer.byteLength > MAX_FETCH_BYTES
    ? buffer.slice(0, MAX_FETCH_BYTES)
    : buffer;
  const rawText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const isHtml = /html|xml/i.test(contentType) || /<html|<body|<article|<main/i.test(rawText);
  const title = isHtml ? extractTitle(rawText, url) : new URL(url).hostname.replace(/^www\./, "");
  const text = isHtml ? htmlToText(rawText) : rawText.replace(/\r\n/g, "\n").trim();
  const trimmedText = text.slice(0, 40_000);

  return {
    ok: true,
    url,
    finalUrl: response.url || url,
    title,
    contentType,
    text: trimmedText,
    truncated: text.length > trimmedText.length || buffer.byteLength > MAX_FETCH_BYTES,
    fetchedAt: new Date().toISOString(),
  };
}
