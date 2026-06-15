import { NextResponse } from "next/server";

import { getSessionCookieOptions } from "@/server/auth/session";
import { jsonOk } from "@/server/http";

export async function POST() {
  const response = NextResponse.json({ ok: true, data: { loggedOut: true } });
  response.cookies.set({
    ...getSessionCookieOptions(),
    value: "",
    maxAge: 0,
  });
  return response;
}

export async function GET() {
  return jsonOk({ loggedOut: false });
}
