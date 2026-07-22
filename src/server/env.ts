import { resolveAppUrl } from "@/lib/app-url";

const DEFAULT_SESSION_SECRET = "balesin-demo-session-secret-change-me";
const DEFAULT_WORKER_SECRET = "balesin-demo-worker-secret-change-me";

function readCsvEnv(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function readProductionSecret(name: string, fallback: string) {
  const configured = process.env[name]?.trim();
  if (configured && configured !== fallback) {
    return configured;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} wajib dikonfigurasi dengan nilai rahasia yang kuat.`);
  }

  return configured || fallback;
}

export const serverEnv = {
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "balesin_session",
  sessionSecret: readProductionSecret("SESSION_SECRET", DEFAULT_SESSION_SECRET),
  workerSecret: readProductionSecret("WORKER_SECRET", DEFAULT_WORKER_SECRET),
  googleClientId:
    process.env.GOOGLE_CLIENT_ID?.trim() ??
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ??
    "",
  authAllowedEmails: readCsvEnv(process.env.AUTH_ALLOWED_EMAILS),
  authAllowedDomains: readCsvEnv(process.env.AUTH_ALLOWED_DOMAINS).map((domain) =>
    domain.replace(/^@/, ""),
  ),
  demoLoginPassword: process.env.DEMO_LOGIN_PASSWORD?.trim() ?? "",
  webchatWebhookSecret: process.env.WEBCHAT_WEBHOOK_SECRET?.trim() ?? "",
  whatsappApiVersion: process.env.WHATSAPP_API_VERSION ?? "v21.0",
  whatsappBaseUrl: process.env.WHATSAPP_BASE_URL ?? "https://graph.facebook.com",
  whatsappQrApiUrl: process.env.WHATSAPP_QR_API_URL?.trim() ?? "",
  whatsappQrApiKey: process.env.WHATSAPP_QR_API_KEY?.trim() ?? "",
  whatsappQrInstancePrefix:
    process.env.WHATSAPP_QR_INSTANCE_PREFIX?.trim() || "balesin-wa",
  whatsappQrWebhookSecret: process.env.WHATSAPP_QR_WEBHOOK_SECRET?.trim() ?? "",
  publicAppUrl: resolveAppUrl(),
};
