import { NextResponse } from "next/server";

const META_GRAPH = "https://graph.facebook.com";
const API_VERSION = process.env.WHATSAPP_API_VERSION ?? "v21.0";

// Prioritas: WHATSAPP_APP_SECRET → META_APP_SECRET
const APP_SECRET =
  process.env.WHATSAPP_APP_SECRET ??
  process.env.META_APP_SECRET ??
  "";

// Prioritas: NEXT_PUBLIC_WHATSAPP_APP_ID → NEXT_PUBLIC_META_APP_ID
const APP_ID =
  process.env.NEXT_PUBLIC_WHATSAPP_APP_ID ??
  process.env.NEXT_PUBLIC_META_APP_ID ??
  "";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

interface WabaData {
  id: string;
  name: string;
  phone_numbers?: { data: Array<{ id: string; display_phone_number: string }> };
}

interface PhoneNumberData {
  id: string;
  display_phone_number: string;
  verified_name: string;
}

interface MetaTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: {
    message: string;
    type: string;
    code: number;
    fbtrace_id?: string;
  };
}

/**
 * POST /api/channels/whatsapp/connect
 * Body: { accessToken?: string; code?: string }
 *
 * Flow:
 * 1. Jika ada `code` (config_id flow) → tukar code → short-lived token
 * 2. Tukar short-lived → long-lived (fb_exchange_token)
 * 3. Ambil WABA + Phone Number ID
 *
 * Catatan: Jika exchange gagal, kembalikan token apa adanya (mungkin sudah long-lived dari Embedded Signup)
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { accessToken?: string; code?: string };

    if (!APP_ID || !APP_SECRET) {
      return NextResponse.json(
        {
          error:
            "NEXT_PUBLIC_META_APP_ID dan META_APP_SECRET belum dikonfigurasi di environment variables Vercel.",
        },
        { status: 500 }
      );
    }

    let workingToken: string | undefined;

    // ---------------------------------------------------
    // Flow A: code → access_token (config_id / FB Login for Business)
    // ---------------------------------------------------
    if (body.code) {
      const redirectUri = `${APP_URL}/api/channels/whatsapp/connect`;
      const codeUrl = new URL(`${META_GRAPH}/oauth/access_token`);
      codeUrl.searchParams.set("client_id", APP_ID);
      codeUrl.searchParams.set("client_secret", APP_SECRET);
      codeUrl.searchParams.set("code", body.code);
      codeUrl.searchParams.set("redirect_uri", redirectUri);

      const codeRes = await fetch(codeUrl.toString());
      const codeData = (await codeRes.json()) as MetaTokenResponse;

      if (codeData.error || !codeData.access_token) {
        return NextResponse.json(
          {
            error: "Gagal menukar code ke access token.",
            detail: codeData.error ?? "Tidak ada access_token dalam response.",
            hint: "Pastikan redirect_uri di Meta Developer sesuai dengan APP_URL Anda.",
          },
          { status: 502 }
        );
      }
      workingToken = codeData.access_token;

    } else if (body.accessToken) {
      // ---------------------------------------------------
      // Flow B: short-lived accessToken dari JS SDK
      // ---------------------------------------------------
      workingToken = body.accessToken;
    }

    if (!workingToken) {
      return NextResponse.json(
        { error: "accessToken atau code diperlukan." },
        { status: 400 }
      );
    }

    // ---------------------------------------------------
    // Tukar ke long-lived token (opsional — jika gagal, pakai token yang ada)
    // Embedded Signup kadang sudah memberikan long-lived token secara langsung
    // ---------------------------------------------------
    let longLivedToken = workingToken;

    const tokenUrl = new URL(`${META_GRAPH}/oauth/access_token`);
    tokenUrl.searchParams.set("grant_type", "fb_exchange_token");
    tokenUrl.searchParams.set("client_id", APP_ID);
    tokenUrl.searchParams.set("client_secret", APP_SECRET);
    tokenUrl.searchParams.set("fb_exchange_token", workingToken);

    try {
      const tokenRes = await fetch(tokenUrl.toString());
      const tokenData = (await tokenRes.json()) as MetaTokenResponse;

      if (tokenData.access_token && !tokenData.error) {
        longLivedToken = tokenData.access_token;
      } else {
        // Log error tapi jangan batalkan — mungkin token sudah long-lived
        console.warn("[WA Connect] Token exchange warning:", tokenData.error);
      }
    } catch (exchangeErr) {
      // Exchange gagal — lanjut dengan token yang ada
      console.warn("[WA Connect] Token exchange failed, using original token:", exchangeErr);
    }

    // ---------------------------------------------------
    // Ambil daftar WABA yang dimiliki user
    // ---------------------------------------------------
    const wabaUrl = new URL(`${META_GRAPH}/${API_VERSION}/me/businesses`);
    wabaUrl.searchParams.set("fields", "id,name,whatsapp_business_accounts{id,name}");
    wabaUrl.searchParams.set("access_token", longLivedToken);

    const wabaRes = await fetch(wabaUrl.toString());
    const wabaJson = (await wabaRes.json()) as {
      data?: WabaData[];
      error?: { message: string };
    };

    if (wabaJson.error) {
      console.warn("[WA Connect] WABA lookup error:", wabaJson.error);
    }

    const waba: WabaData | undefined = wabaJson.data?.[0];

    if (!waba) {
      // Fallback: kembalikan token — frontend bisa isi manual
      return NextResponse.json({
        accessToken: longLivedToken,
        wabaId: "",
        phoneNumberId: "",
        businessName: "",
        needsManualSetup: true,
      });
    }

    const wabaId = waba.id;
    const businessName = waba.name ?? "";

    // ---------------------------------------------------
    // Ambil Phone Number pertama dari WABA
    // ---------------------------------------------------
    const phoneUrl = new URL(
      `${META_GRAPH}/${API_VERSION}/${wabaId}/phone_numbers`
    );
    phoneUrl.searchParams.set("fields", "id,display_phone_number,verified_name");
    phoneUrl.searchParams.set("access_token", longLivedToken);

    const phoneRes = await fetch(phoneUrl.toString());
    const phoneJson = (await phoneRes.json()) as {
      data?: PhoneNumberData[];
      error?: { message: string };
    };
    const phone: PhoneNumberData | undefined = phoneJson.data?.[0];

    return NextResponse.json({
      accessToken: longLivedToken,
      wabaId,
      phoneNumberId: phone?.id ?? "",
      displayPhone: phone?.display_phone_number ?? "",
      verifiedName: phone?.verified_name ?? businessName,
      businessName,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[WA Connect] Unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
