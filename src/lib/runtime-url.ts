const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

function normalizeUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

export function isLocalAppUrl(value: string) {
  const normalized = normalizeUrl(value);

  if (!normalized) {
    return false;
  }

  try {
    const parsed = new URL(normalized);
    return LOCAL_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function resolveDashboardPublicAppUrl(configuredUrl: string, origin: string) {
  const normalizedOrigin = normalizeUrl(origin);
  const normalizedConfigured = normalizeUrl(configuredUrl);

  if (!normalizedConfigured) {
    return normalizedOrigin || "http://localhost:3000";
  }

  if (
    normalizedOrigin &&
    !isLocalAppUrl(normalizedOrigin) &&
    isLocalAppUrl(normalizedConfigured)
  ) {
    return normalizedOrigin;
  }

  return normalizedConfigured;
}
