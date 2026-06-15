import { NextResponse } from "next/server";

import { createSessionToken, getSessionCookieOptions } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return jsonError("Email dan password harus diisi.", 400);
    }

    const token = await createSessionToken({
      email: body.email,
      name: body.name || body.email.split("@")[0],
      role: "admin",
    });

    const response = NextResponse.json(
      {
        ok: true,
        data: {
          email: body.email,
          name: body.name || body.email.split("@")[0],
          role: "admin",
        },
      },
      { status: 200 },
    );

    response.cookies.set({
      ...getSessionCookieOptions(),
      value: token,
    });

    return response;
  } catch {
    return jsonError("Gagal membuat session login.", 500);
  }
}

export async function GET() {
  return jsonOk({ mode: "demo" });
}
