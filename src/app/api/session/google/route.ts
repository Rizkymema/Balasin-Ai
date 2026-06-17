import { NextResponse } from "next/server";

import { isGoogleAuthEnabled, verifyGoogleCredential } from "@/server/auth/google";
import {
  createSessionToken,
  getSessionCookieOptions,
} from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: Request) {
  if (!isGoogleAuthEnabled()) {
    return jsonError("Google login belum dikonfigurasi.", 503);
  }

  try {
    const body = (await request.json()) as {
      credential?: string;
    };

    if (!body.credential?.trim()) {
      return jsonError("Credential Google wajib dikirim.", 400);
    }

    const profile = await verifyGoogleCredential(body.credential.trim());
    const token = await createSessionToken({
      email: profile.email,
      name: profile.name,
      role: "admin",
    });

    const response = NextResponse.json(
      {
        ok: true,
        data: {
          email: profile.email,
          name: profile.name,
          role: "admin",
          picture: profile.picture ?? null,
          provider: "google",
        },
      },
      { status: 200 },
    );

    response.cookies.set({
      ...getSessionCookieOptions(),
      value: token,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Google login gagal diverifikasi.";

    return jsonError(message, 401);
  }
}

export async function GET() {
  return jsonOk({
    mode: isGoogleAuthEnabled() ? "google" : "disabled",
  });
}
