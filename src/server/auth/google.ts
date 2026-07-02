import { OAuth2Client } from "google-auth-library";

import { serverEnv } from "@/server/env";

type GoogleIdentityPayload = {
  email: string;
  name: string;
  picture?: string;
  sub: string;
};

let oauthClient: OAuth2Client | null = null;

function getGoogleClientId() {
  return serverEnv.googleClientId.trim();
}

function getGoogleOAuthClient() {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID belum diisi.");
  }

  if (!oauthClient) {
    oauthClient = new OAuth2Client(clientId);
  }

  return oauthClient;
}

export function isGoogleAuthEnabled() {
  return getGoogleClientId().length > 0;
}

export function assertAdminEmailAllowed(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const domain = normalizedEmail.split("@")[1] ?? "";
  const hasAllowlist =
    serverEnv.authAllowedEmails.length > 0 ||
    serverEnv.authAllowedDomains.length > 0;

  if (!hasAllowlist && process.env.NODE_ENV === "production") {
    throw new Error("Allowlist admin belum dikonfigurasi.");
  }

  if (!hasAllowlist) {
    return;
  }

  const emailAllowed = serverEnv.authAllowedEmails.includes(normalizedEmail);
  const domainAllowed = serverEnv.authAllowedDomains.includes(domain);

  if (!emailAllowed && !domainAllowed) {
    throw new Error("Akun Google belum diizinkan mengakses dashboard.");
  }
}

export async function verifyGoogleCredential(credential: string) {
  const client = getGoogleOAuthClient();
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: getGoogleClientId(),
  });
  const payload = ticket.getPayload();

  if (!payload?.email || !payload?.name || !payload.sub) {
    throw new Error("Payload Google tidak valid.");
  }

  if (payload.email_verified === false) {
    throw new Error("Email Google belum terverifikasi.");
  }

  assertAdminEmailAllowed(payload.email);

  return {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    sub: payload.sub,
  } satisfies GoogleIdentityPayload;
}
