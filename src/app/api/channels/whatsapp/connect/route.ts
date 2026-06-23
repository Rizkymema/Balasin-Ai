import { NextResponse } from "next/server";

const META_GRAPH = "https://graph.facebook.com";
const API_VERSION = process.env.WHATSAPP_API_VERSION ?? "v21.0";
const APP_SECRET = process.env.WHATSAPP_APP_SECRET ?? process.env.META_APP_SECRET ?? "";
const APP_ID = process.env.NEXT_PUBLIC_WHATSAPP_APP_ID ?? process.env.NEXT_PUBLIC_META_APP_ID ?? "";

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

/**
 * Tukar short-lived user access token → long-lived token,
 * lalu ambil WABA + Phone Number ID pertama yang tersedia.
 *
 * POST /api/channels/whatsapp/connect
 * Body: { accessToken: string }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { accessToken?: string };
    const shortLivedToken = body.accessToken;

    if (!shortLivedToken) {
      return NextResponse.json(
        { error: "accessToken diperlukan." },
        { status: 400 }
      );
    }

    if (!APP_ID || !APP_SECRET) {
      return NextResponse.json(
        {
          error:
            "NEXT_PUBLIC_META_APP_ID (atau NEXT_PUBLIC_WHATSAPP_APP_ID) dan META_APP_SECRET (atau WHATSAPP_APP_SECRET) belum dikonfigurasi di environment.",
        },
        { status: 500 }
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
