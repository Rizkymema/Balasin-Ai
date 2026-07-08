import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    allowedEmails: process.env.AUTH_ALLOWED_EMAILS || "",
    allowedDomains: process.env.AUTH_ALLOWED_DOMAINS || "",
    nodeEnv: process.env.NODE_ENV || ""
  });
}
