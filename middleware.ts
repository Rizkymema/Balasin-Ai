import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "balesin_session";
const DEFAULT_SESSION_SECRET = "balesin-demo-session-secret-change-me";
const SESSION_SECRET =
  process.env.SESSION_SECRET?.trim() ||
  (process.env.NODE_ENV === "production" ? "" : DEFAULT_SESSION_SECRET);

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/inbox",
  "/customers",
  "/products-services",
  "/booking",
  "/tickets",
  "/automation",
  "/broadcast",
  "/channels",
  "/analytics",
  "/settings",
  "/step-1",
  "/step-2",
  "/step-3",
  "/step-4",
  "/complete",
];

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(`${normalized}${padding}`);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function signValue(value: string) {
  if (
    process.env.NODE_ENV === "production" &&
    (!SESSION_SECRET || SESSION_SECRET === DEFAULT_SESSION_SECRET)
  ) {
    throw new Error("SESSION_SECRET belum dikonfigurasi.");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function hasValidSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }

  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) {
    return false;
  }

  const expected = await signValue(encodedPayload);
  if (expected !== encodedSignature) {
    return false;
  }

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(encodedPayload)),
    ) as { exp?: number };

    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  if (
    process.env.NODE_ENV === "production" &&
    (!SESSION_SECRET || SESSION_SECRET === DEFAULT_SESSION_SECRET)
  ) {
    return NextResponse.json(
      { ok: false, error: "Server auth misconfigured" },
      { status: 500 },
    );
  }

  const valid = await hasValidSession(request);
  if (valid) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
