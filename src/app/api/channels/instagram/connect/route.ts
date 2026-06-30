import { NextResponse } from "next/server";

const META_GRAPH = "https://graph.facebook.com";
const API_VERSION = process.env.WHATSAPP_API_VERSION ?? "v21.0";

const IG_APP_SECRET =
  process.env.INSTAGRAM_APP_SECRET ??
  process.env.META_APP_SECRET ??
  "";

const IG_APP_ID =
  process.env.INSTAGRAM_APP_ID ??
  process.env.META_APP_ID ??
  process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID ??
  process.env.NEXT_PUBLIC_META_APP_ID ??
  "";

// Meta/WA App credentials — sebagai fallback jika token dikeluarkan App ini
const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID ?? "";
const META_APP_SECRET = process.env.META_APP_SECRET ?? "";

interface IgBusinessAccount {
  id: string;
  username?: string;
  name?: string;
}

interface IgPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: IgBusinessAccount;
}

interface MetaTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message: string; type: string; code: number };
}

interface PagesResponse {
  data?: IgPage[];
  error?: { message: string; code: number; type?: string };
}

/**
 * Coba tukar short-lived token ke long-lived.
 * Coba dengan appId+secret yang diberikan, return null jika gagal.
 */
async function tryExchange(
  shortToken: string,
  appId: string,
  appSecret: string
): Promise<string | null> {
  if (!appId || !appSecret) return null;
  try {
    const url = new URL(`${META_GRAPH}/oauth/access_token`);
    url.searchParams.set("grant_type", "fb_exchange_token");
    url.searchParams.set("client_id", appId);
    url.searchParams.set("client_secret", appSecret);
    url.searchParams.set("fb_exchange_token", shortToken);

    const res = await fetch(url.toString());
    const data = (await res.json()) as MetaTokenResponse;

    if (data.access_token && !data.error) {
      return data.access_token;
    }
    console.warn(`[IG Connect] Exchange failed (appId=${appId}):`, data.error?.message);
    return null;
  } catch (e) {
    console.warn(`[IG Connect] Exchange exception (appId=${appId}):`, e);
    return null;
  }
}

/**
 * Fetch instagram_business_account menggunakan PAGE access token.
 * Lebih reliable dibanding user token untuk field ini.
 */
async function fetchIgFromPage(
  pageId: string,
  pageAccessToken: string
): Promise<IgBusinessAccount | null> {
  try {
    const url = new URL(`${META_GRAPH}/${API_VERSION}/${pageId}`);
    url.searchParams.set(
      "fields",
      "instagram_business_account{id,username,name}"
    );
    url.searchParams.set("access_token", pageAccessToken);

    const res = await fetch(url.toString());
    const data = (await res.json()) as {
      instagram_business_account?: IgBusinessAccount;
      error?: { message: string };
    };

    if (data.instagram_business_account?.id) {
      return data.instagram_business_account;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * POST /api/channels/instagram/connect
 * Body: { accessToken: string }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { accessToken?: string };
    const shortLivedToken = body.accessToken;

    if (!shortLivedToken) {
      return NextResponse.json({ error: "accessToken diperlukan." }, { status: 400 });
    }

    if (!IG_APP_ID || !IG_APP_SECRET) {
      return NextResponse.json(
        {
          error:
            "Instagram App ID dan App Secret belum dikonfigurasi di environment variables Vercel.",
        },
        { status: 500 }
      );
    }

    // -------------------------------------------------------
    // 1. Tukar ke long-lived token
    //    Coba IG credentials → fallback ke Meta credentials → fallback pakai token asli
    // -------------------------------------------------------
    let longLivedToken = shortLivedToken;

    const exchanged =
      (await tryExchange(shortLivedToken, IG_APP_ID, IG_APP_SECRET)) ??
      (META_APP_ID !== IG_APP_ID
        ? await tryExchange(shortLivedToken, META_APP_ID, META_APP_SECRET)
        : null);

    if (exchanged) {
      longLivedToken = exchanged;
      console.log("[IG Connect] Token berhasil ditukar ke long-lived.");
    } else {
      console.warn("[IG Connect] Exchange gagal untuk semua credentials, pakai token asli.");
    }

    // -------------------------------------------------------
    // 2. Ambil daftar halaman Facebook milik user
    // -------------------------------------------------------
    const pagesUrl = new URL(`${META_GRAPH}/${API_VERSION}/me/accounts`);
    pagesUrl.searchParams.set("fields", "id,name,access_token,instagram_business_account{id,username,name}");
    pagesUrl.searchParams.set("access_token", longLivedToken);

    const pagesRes = await fetch(pagesUrl.toString());
    const pagesJson = (await pagesRes.json()) as PagesResponse;

    if (pagesJson.error) {
      console.error("[IG Connect] Error fetch pages:", pagesJson.error);
      return NextResponse.json(
        {
          error: `Gagal mengambil daftar halaman Facebook: ${pagesJson.error.message}`,
          hint: "Pastikan Anda memberikan izin 'pages_show_list' saat login Facebook.",
        },
        { status: 502 }
      );
    }

    const pages = pagesJson.data ?? [];
    console.log(`[IG Connect] Ditemukan ${pages.length} halaman Facebook.`);

    if (pages.length === 0) {
      return NextResponse.json(
        {
          error: "Tidak ada halaman Facebook yang ditemukan pada akun ini.",
          hint: "Pastikan Anda memiliki halaman Facebook sebagai Admin. Halaman ini harus terhubung ke akun Instagram Business.",
        },
        { status: 422 }
      );
    }

    // -------------------------------------------------------
    // 3. Cari IG Business Account
    //    Strategi A: dari field di /me/accounts (sudah di-embed di atas)
    //    Strategi B: query ulang per-page menggunakan PAGE access token
    // -------------------------------------------------------
    let foundPage: IgPage | undefined;
    let foundIgAccount: IgBusinessAccount | undefined;

    // Strategi A: gunakan data yang sudah ada dari /me/accounts
    foundPage = pages.find((p) => p.instagram_business_account?.id);
    if (foundPage) {
      foundIgAccount = foundPage.instagram_business_account;
      console.log(`[IG Connect] Strategi A berhasil: page=${foundPage.name}, ig=${foundIgAccount?.username}`);
    }

    // Strategi B: jika A gagal, query ulang setiap page dengan PAGE access token
    if (!foundIgAccount) {
      console.log("[IG Connect] Strategi A gagal, mencoba Strategi B (per-page token)...");
      for (const page of pages) {
        if (!page.access_token) continue;
        const igAccount = await fetchIgFromPage(page.id, page.access_token);
        if (igAccount?.id) {
          foundPage = page;
          foundIgAccount = igAccount;
          console.log(`[IG Connect] Strategi B berhasil: page=${page.name}, ig=${igAccount.username}`);
          break;
        }
      }
    }

    // Jika keduanya gagal
    if (!foundIgAccount || !foundPage) {
      const pageNames = pages.map((p) => p.name).join(", ");
      return NextResponse.json(
        {
          error:
            "Tidak ada halaman Facebook yang terhubung ke Instagram Business Account.",
          detail: `Halaman ditemukan (${pages.length}): ${pageNames}`,
          hint: [
            "1. Buka Instagram → Pengaturan → Akun → Beralih ke Akun Profesional (Business/Creator)",
            "2. Buka Facebook → Pengaturan Halaman → Instagram → Hubungkan Akun",
            "3. Coba connect ulang dari dashboard",
          ].join(" | "),
        },
        { status: 422 }
      );
    }

    // -------------------------------------------------------
    // 4. Kembalikan hasil
    // -------------------------------------------------------
    return NextResponse.json({
      accessToken: foundPage.access_token || longLivedToken,
      accountId: foundIgAccount.id,
      username: foundIgAccount.username ?? foundIgAccount.name ?? "",
      pageId: foundPage.id,
      pageName: foundPage.name,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[IG Connect] Unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
