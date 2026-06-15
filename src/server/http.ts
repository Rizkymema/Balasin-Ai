import { NextResponse } from "next/server";

import { getServerSession } from "@/server/auth/session";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      details,
    },
    { status },
  );
}

export async function requireApiSession() {
  const session = await getServerSession();
  if (!session) {
    return {
      response: jsonError("Unauthorized", 401),
      session: null,
    };
  }

  return { response: null, session };
}
