const FALLBACK_APP_URL = "http://localhost:3000";

function normalizeAppUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function resolveAppUrl() {
  return (
    normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeAppUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeAppUrl(process.env.VERCEL_URL) ??
    FALLBACK_APP_URL
  );
}
