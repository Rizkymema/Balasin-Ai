import { NextResponse } from "next/server";

const META_GRAPH = "https://graph.facebook.com";
const API_VERSION = process.env.WHATSAPP_API_VERSION ?? "v21.0";

// Untuk Instagram: gunakan App ID yang sama dengan yang dipakai FB SDK di browser.
// Jika Instagram menggunakan App ID berbeda, server harus pakai secret yang sesuai.
// Priority: INSTAGRAM_APP_SECRET → META_APP_SECRET
const IG_APP_SECRET =
  process.env.INSTAGRAM_APP_SECRET ??
  process.env.META_APP_SECRET ??
  "";

// Priority: INSTAGRAM_APP_ID → META_APP_ID → NEXT_PUBLIC_INSTAGRAM_APP_ID → NEXT_PUBLIC_META_APP_ID
const IG_APP_ID =
  process.env.INSTAGRAM_APP_ID ??
  process.env.META_APP_ID ??
  process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID ??
  process.env.NEXT_PUBLIC_META_APP_ID ??
  "";

// App ID utama (WhatsApp/Meta) — sebagai fallback jika IG pakai App sama
const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID ?? "";
const META_APP_SECRET = process.env.META_APP_SECRET ?? "";

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
 * POST /api/channels/instagram/connect
 * Body: { accessToken: string }
 *
 * Strategi token exchange:
 * 1. Coba exchange dengan IG_APP_ID + IG_APP_SECRET
 * 2. Jika gagal (App ID mismatch), coba exchange dengan META_APP_ID + META_APP_SECRET
 * 3. Jika keduanya gagal, gunakan token asli (mungkin sudah long-lived)
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

    if (!IG_APP_ID || !IG_APP_SECRET) {
      return NextResponse.json(
        {
          error:
            "Instagram App ID dan App Secret belum dikonfigurasi. " +
            "Pastikan INSTAGRAM_APP_ID dan INSTAGRAM_APP_SECRET sudah diset di environment variables Vercel.",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------
    // Tukar ke long-lived token
    // Coba dengan IG credentials dulu, fallback ke Meta credentials
    // karena FB SDK mungkin mengeluarkan token dari App ID yang berbeda
    // ---------------------------------------------------
    let longLivedToken = shortLivedToken;

    const tryExchange = async (appId: string, appSecret: string): Promise<string | null> => {
      if (!appId || !appSecret) return null;
      const tokenUrl = new URL(`${META_GRAPH}/oauth/access_token`);
      tokenUrl.searchParams.set("grant_type", "fb_exchange_token");
      tokenUrl.searchParams.set("client_id", appId);
      tokenUrl.searchParams.set("client_secret", appSecret);
      tokenUrl.searchParams.set("fb_exchange_token", shortLivedToken);

      try {
        const res = await fetch(tokenUrl.toString());
        const data = (await res.json()) as MetaTokenResponse;
        if (data.access_token && !data.error) {
          return data.access_token;
        }
        console.warn(`[IG Connect] Exchange gagal dengan appId=${appId}:`, data.error);
        return null;
      } catch (err) {
        console.warn(`[IG Connect] Exchange error dengan appId=${appId}:`, err);
        return null;
      }
    };

    // Attempt 1: gunakan IG App credentials
    const exchanged1 = await tryExchange(IG_APP_ID, IG_APP_SECRET);
    if (exchanged1) {
      longLivedToken = exchanged1;
    } else if (META_APP_ID && META_APP_SECRET && META_APP_ID !== IG_APP_ID) {
      // Attempt 2: gunakan Meta App credentials (jika FB SDK pakai App yang sama dengan WA)
      const exchanged2 = await tryExchange(META_APP_ID, META_APP_SECRET);
      if (exchanged2) {
        longLivedToken = exchanged2;
      } else {
        console.warn("[IG Connect] Semua exchange gagal, menggunakan token asli.");
      }
    } else {
      console.warn("[IG Connect] Exchange gagal, menggunakan token asli.");
    }

    // ---------------------------------------------------
    // Ambil halaman Facebook yang punya IG Business Account
    // ---------------------------------------------------
    const pagesUrl = new URL(`${META_GRAPH}/${API_VERSION}/me/accounts`);
    pagesUrl.searchParams.set(
      "fields",
      "id,name,access_token,instagram_business_account{id,username,name}"
    );
    pagesUrl.searchParams.set("access_token", longLivedToken);

    const pagesRes = await fetch(pagesUrl.toString());
    const pagesJson = (await pagesRes.json()) as {
      data?: IgPage[];
      error?: { message: string; code: number };
    };

    if (pagesJson.error) {
      return NextResponse.json(
        {
          error:
            "Gagal mengambil data halaman Facebook. " +
            pagesJson.error.message,
          hint: "Pastikan Anda memberikan permission 'pages_show_list' dan 'instagram_basic' saat login.",
        },
        { status: 502 }
      );
    }

    // Cari halaman pertama yang punya IG Business Account
    const page = pagesJson.data?.find((p) => p.instagram_business_account);

    if (!page || !page.instagram_business_account) {
      return NextResponse.json(
        {
          error:
            "Tidak ada halaman Facebook yang terhubung ke Instagram Business Account. " +
            "Pastikan akun Instagram Anda adalah Business/Creator account dan terhubung ke halaman Facebook.",
          hint: "Cek: Instagram > Pengaturan > Akun > Beralih ke Akun Profesional, lalu hubungkan ke halaman Facebook.",
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
    console.error("[IG Connect] Unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
