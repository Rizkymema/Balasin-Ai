import { NextResponse } from "next/server";

import { createSessionToken, getSessionCookieOptions } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/http";

const demoLoginEnabled =
  process.env.NODE_ENV !== "production" ||
  process.env.ALLOW_DEMO_LOGIN?.trim() === "true";

export async function POST(request: Request) {
  if (!demoLoginEnabled) {
    return jsonError(
      "Demo login dinonaktifkan di production. Gunakan Google login atau aktifkan ALLOW_DEMO_LOGIN secara eksplisit.",
      403,
    );
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      password?: string;
    };
    const email = body.email?.trim() ?? "";
    const password = body.password?.trim() ?? "";
    const name = body.name?.trim() || email.split("@")[0] || "admin";

    if (!email || !password) {
      return jsonError("Email dan password harus diisi.", 400);
    }

    const token = await createSessionToken({
      email,
      name,
      role: "admin",
    });

    const response = NextResponse.json(
      {
        ok: true,
        data: {
          email,
          name,
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
  } catch (error) {
    console.error("Failed to create login session", error);
    return jsonError("Gagal membuat session login.", 500);
  }
}

export async function GET() {
  return jsonOk({ mode: demoLoginEnabled ? "demo" : "disabled" });
}
