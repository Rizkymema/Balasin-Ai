import { NextResponse } from "next/server";

const META_GRAPH = "https://graph.facebook.com";
const API_VERSION = process.env.WHATSAPP_API_VERSION ?? "v21.0";
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET ?? process.env.META_APP_SECRET ?? "";
const APP_ID = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID ?? process.env.NEXT_PUBLIC_META_APP_ID ?? "";

interface IgPage {
  id: string;
  name: string;
  instagram_business_account?: {
    id: string;
    username?: string;
    name?: string;
  };
  access_token: string;
}

interface LongLivedTokenResponse {
  access_token: string;
  token_type: string;
}

/**
 * Tukar short-lived user token → long-lived token,
 * lalu ambil Page dan Instagram Business Account pertama.
 *
 * POST /api/channels/instagram/connect
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
            "NEXT_PUBLIC_INSTAGRAM_APP_ID (atau NEXT_PUBLIC_META_APP_ID) dan INSTAGRAM_APP_SECRET (atau META_APP_SECRET) belum dikonfigurasi di environment.",
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
    // 2. Ambil halaman Facebook yang punya IG Business Account
    // ---------------------------------------------------
    const pagesUrl = new URL(`${META_GRAPH}/${API_VERSION}/me/accounts`);
    pagesUrl.searchParams.set(
      "fields",
      "id,name,access_token,instagram_business_account{id,username,name}"
    );
    pagesUrl.searchParams.set("access_token", longLivedToken);

    const pagesRes = await fetch(pagesUrl.toString());
    const pagesJson = (await pagesRes.json()) as { data?: IgPage[] };

    // Cari halaman pertama yang punya IG Business Account
    const page = pagesJson.data?.find((p) => p.instagram_business_account);

    if (!page || !page.instagram_business_account) {
      return NextResponse.json(
        {
          error:
            "Tidak ada halaman Facebook yang terhubung ke Instagram Business Account. " +
            "Pastikan akun Instagram Anda adalah Business/Creator account dan terhubung ke halaman Facebook.",
        },
        { status: 422 }
      );
    }

    const igAccount = page.instagram_business_account;

    return NextResponse.json({
      accessToken: longLivedToken,
      accountId: igAccount.id,
      username: igAccount.username ?? igAccount.name ?? "",
      pageId: page.id,
      pageName: page.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
