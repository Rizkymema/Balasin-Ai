import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { serverEnv } from "@/server/env";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type SessionPayload = {
  email: string;
  name: string;
  role: "admin" | "operator";
  exp: number;
};

function toBase64Url(input: ArrayBuffer | Uint8Array | string) {
  const buffer =
    typeof input === "string"
      ? Buffer.from(input)
      : input instanceof Uint8Array
        ? Buffer.from(input)
        : Buffer.from(input);

  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
}

function signValue(value: string) {
  return createHmac("sha256", serverEnv.sessionSecret).update(value).digest("base64url");
}

export async function createSessionToken(input: Omit<SessionPayload, "exp">) {
  const payload: SessionPayload = {
    ...input,
    exp: Date.now() + SESSION_TTL_MS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);
  if (expectedSignature.length !== encodedSignature.length) {
    return null;
  }

  if (
    !timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(encodedSignature))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      fromBase64Url(encodedPayload).toString("utf8"),
    ) as SessionPayload;

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(serverEnv.sessionCookieName)?.value ?? null;
  return verifySessionToken(token);
}

export function getSessionCookieOptions() {
  return {
    name: serverEnv.sessionCookieName,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}
