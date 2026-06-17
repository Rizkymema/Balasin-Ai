const DEFAULT_TIMEZONE = "Asia/Jakarta";

function normalizeTimezone(timezone?: string | null) {
  const value = timezone?.trim();
  return value || DEFAULT_TIMEZONE;
}

export function formatClockTime(timezone?: string | null, date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: normalizeTimezone(timezone),
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatOperatorTimestamp(
  timezone?: string | null,
  date = new Date(),
) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: normalizeTimezone(timezone),
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatCurrentTimeContext(
  timezone?: string | null,
  date = new Date(),
) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: normalizeTimezone(timezone),
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getDefaultTimezone() {
  return DEFAULT_TIMEZONE;
}
