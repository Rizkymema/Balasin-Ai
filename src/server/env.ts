import { resolveAppUrl } from "@/lib/app-url";

const DEFAULT_SESSION_SECRET = "balesin-demo-session-secret-change-me";
const DEFAULT_WORKER_SECRET = "balesin-demo-worker-secret-change-me";

export const serverEnv = {
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "balesin_session",
  sessionSecret: process.env.SESSION_SECRET ?? DEFAULT_SESSION_SECRET,
  workerSecret: process.env.WORKER_SECRET ?? DEFAULT_WORKER_SECRET,
  googleClientId:
    process.env.GOOGLE_CLIENT_ID?.trim() ??
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ??
    "",
  whatsappApiVersion: process.env.WHATSAPP_API_VERSION ?? "v21.0",
  whatsappBaseUrl: process.env.WHATSAPP_BASE_URL ?? "https://graph.facebook.com",
  publicAppUrl: resolveAppUrl(),
};
