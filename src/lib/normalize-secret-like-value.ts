export function normalizeSecretLikeValue(value?: string | null) {
  let trimmed = value?.trim() ?? "";

  if (
    !trimmed ||
    trimmed === "undefined" ||
    trimmed === "null" ||
    trimmed === '""' ||
    trimmed === "''"
  ) {
    return "";
  }

  const wrappedInDoubleQuotes =
    trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2;
  const wrappedInSingleQuotes =
    trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2;

  if (wrappedInDoubleQuotes || wrappedInSingleQuotes) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  if (trimmed.startsWith("{") && trimmed.includes("access_token")) {
    try {
      const parsed = JSON.parse(trimmed) as {
        access_token?: string;
        accessToken?: string;
      };
      const extracted = parsed.access_token ?? parsed.accessToken;
      if (typeof extracted === "string" && extracted.trim()) {
        trimmed = extracted.trim();
      }
    } catch {
      // Ignore malformed JSON and continue best-effort normalization.
    }
  }

  if (trimmed.includes("access_token=")) {
    try {
      const tokenCandidate = trimmed.startsWith("http")
        ? new URL(trimmed).searchParams.get("access_token")
        : new URLSearchParams(trimmed).get("access_token");
      if (tokenCandidate?.trim()) {
        trimmed = tokenCandidate.trim();
      }
    } catch {
      const match = trimmed.match(/access_token=([^&\s]+)/i);
      if (match?.[1]) {
        trimmed = match[1].trim();
      }
    }
  }

  trimmed = trimmed.replace(/^Bearer\s+/i, "").replace(/[\r\n\t]+/g, "").trim();

  return trimmed;
}
