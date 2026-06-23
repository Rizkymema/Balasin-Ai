import { NextResponse } from "next/server";

const META_GRAPH = "https://graph.facebook.com";
const API_VERSION = process.env.WHATSAPP_API_VERSION ?? "v21.0";
const APP_SECRET = process.env.WHATSAPP_APP_SECRET ?? process.env.META_APP_SECRET ?? "";
const APP_ID = process.env.NEXT_PUBLIC_WHATSAPP_APP_ID ?? process.env.NEXT_PUBLIC_META_APP_ID ?? "";
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

interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
}

interface CodeTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

/**
 * POST /api/channels/whatsapp/connect
 * Body: { accessToken?: string; code?: string }
 *
 * Mendukung dua flow:
 * 1. accessToken (legacy JS SDK flow) → langsung tukar ke long-lived token
 * 2. code (Facebook Login for Business / config_id flow) → tukar code ke access_token dulu
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { accessToken?: string; code?: string };

    if (!APP_ID || !APP_SECRET) {
      return NextResponse.json(
        {
          error:
            "NEXT_PUBLIC_META_APP_ID dan META_APP_SECRET belum dikonfigurasi di environment.",
        },
        { status: 500 }
      );
    }

    let shortLivedToken: string | undefined;

    // ---------------------------------------------------
    // Flow A: code → access_token (config_id flow)
    // ---------------------------------------------------
    if (body.code) {
      const redirectUri = `${APP_URL}/api/channels/whatsapp/connect`;
      const codeUrl = new URL(`${META_GRAPH}/oauth/access_token`);
      codeUrl.searchParams.set("client_id", APP_ID);
      codeUrl.searchParams.set("client_secret", APP_SECRET);
      codeUrl.searchParams.set("code", body.code);
      codeUrl.searchParams.set("redirect_uri", redirectUri);

      const codeRes = await fetch(codeUrl.toString());
      if (!codeRes.ok) {
        const err = await codeRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: "Gagal menukar code ke access token.", detail: err },
          { status: 502 }
        );
      }
      const codeData = (await codeRes.json()) as CodeTokenResponse;
      shortLivedToken = codeData.access_token;
    } else if (body.accessToken) {
      // ---------------------------------------------------
      // Flow B: accessToken langsung (legacy JS SDK flow)
      // ---------------------------------------------------
      shortLivedToken = body.accessToken;
    }

    if (!shortLivedToken) {
      return NextResponse.json(
        { error: "accessToken atau code diperlukan." },
        { status: 400 }
      );
    }

    // ---------------------------------------------------
    // 1. Tukar ke long-lived token
    // ---------------------------------------------------
    const tokenUrl = new URL(`${META_GRAPH}/oauth/access_token`);
    tokenUrl.searchParams.set("grant_type", "fb_exchange_token");
    tokenUrl.searchParams.set("client_id", APP_ID);
    tokenUrl.searchParams.set("client_secret", APP_SECRET);
    tokenUrl.searchParams.set("fb_exchange_token", shortLivedToken);

    const tokenRes = await fetch(tokenUrl.toString());
    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Gagal menukar token.", detail: err },
        { status: 502 }
      );
    }

    const tokenData = (await tokenRes.json()) as LongLivedTokenResponse;
    const longLivedToken = tokenData.access_token;

    // ---------------------------------------------------
    // 2. Ambil daftar WABA yang dimiliki user
    // ---------------------------------------------------
    const wabaUrl = new URL(`${META_GRAPH}/${API_VERSION}/me/businesses`);
    wabaUrl.searchParams.set("fields", "whatsapp_business_accounts");
    wabaUrl.searchParams.set("access_token", longLivedToken);

    const wabaRes = await fetch(wabaUrl.toString());
    const wabaJson = (await wabaRes.json()) as { data?: WabaData[] };

    // Ambil WABA pertama
    const waba: WabaData | undefined = wabaJson.data?.[0];

    if (!waba) {
      // Fallback: kembalikan token saja, front-end akan minta input manual Phone Number ID
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
    // 3. Ambil Phone Number pertama dari WABA
    // ---------------------------------------------------
    const phoneUrl = new URL(
      `${META_GRAPH}/${API_VERSION}/${wabaId}/phone_numbers`
    );
    phoneUrl.searchParams.set("fields", "id,display_phone_number,verified_name");
    phoneUrl.searchParams.set("access_token", longLivedToken);

    const phoneRes = await fetch(phoneUrl.toString());
    const phoneJson = (await phoneRes.json()) as { data?: PhoneNumberData[] };
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
