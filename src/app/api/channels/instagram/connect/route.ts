import { NextResponse } from "next/server";

import { metaServerEnv } from "@/lib/meta-server-env";
import { normalizeSecretLikeValue } from "@/lib/normalize-secret-like-value";
import { requireApiSession } from "@/server/http";

const META_GRAPH = "https://graph.facebook.com";
const API_VERSION = process.env.WHATSAPP_API_VERSION ?? "v21.0";
const IG_APP_SECRET = metaServerEnv.instagramAppSecret;
const IG_APP_ID = metaServerEnv.instagramAppId;
const META_APP_ID = metaServerEnv.metaAppId;
const META_APP_SECRET = metaServerEnv.metaAppSecret;

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

async function tryExchange(
  shortToken: string,
  appId: string,
  appSecret: string,
): Promise<string | null> {
  if (!appId || !appSecret) {
    return null;
  }

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
  } catch (error) {
    console.warn(`[IG Connect] Exchange exception (appId=${appId}):`, error);
    return null;
  }
}

async function fetchIgFromPage(
  pageId: string,
  pageAccessToken: string,
): Promise<IgBusinessAccount | null> {
  try {
    const url = new URL(`${META_GRAPH}/${API_VERSION}/${pageId}`);
    url.searchParams.set("fields", "instagram_business_account{id,username,name}");
    url.searchParams.set("access_token", pageAccessToken);

    const res = await fetch(url.toString());
    const data = (await res.json()) as {
      instagram_business_account?: IgBusinessAccount;
      error?: { message: string };
    };

    return data.instagram_business_account?.id
      ? data.instagram_business_account
      : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const { response } = await requireApiSession();
  if (response) {
    return response;
  }

  try {
    const body = (await request.json()) as { accessToken?: string };
    const shortLivedToken = normalizeSecretLikeValue(body.accessToken);

    if (!shortLivedToken) {
      return NextResponse.json({ error: "accessToken diperlukan." }, { status: 400 });
    }

    if (!IG_APP_ID || !IG_APP_SECRET) {
      return NextResponse.json(
        {
          error:
            "INSTAGRAM_APP_ID/NEXT_PUBLIC_INSTAGRAM_APP_ID dan INSTAGRAM_APP_SECRET/META_APP_SECRET belum dikonfigurasi di environment variables Vercel.",
        },
        { status: 500 },
      );
    }

    let longLivedToken = shortLivedToken;

    const exchanged =
      (await tryExchange(shortLivedToken, IG_APP_ID, IG_APP_SECRET)) ??
      (META_APP_ID && META_APP_ID !== IG_APP_ID
        ? await tryExchange(shortLivedToken, META_APP_ID, META_APP_SECRET)
        : null);

    if (exchanged) {
      longLivedToken = exchanged;
      console.log("[IG Connect] Token berhasil ditukar ke long-lived.");
    } else {
      console.warn("[IG Connect] Exchange gagal untuk semua credentials, pakai token asli.");
    }

    const pagesUrl = new URL(`${META_GRAPH}/${API_VERSION}/me/accounts`);
    pagesUrl.searchParams.set(
      "fields",
      "id,name,access_token,instagram_business_account{id,username,name}",
    );
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
        { status: 502 },
      );
    }

    const pages = pagesJson.data ?? [];
    console.log(`[IG Connect] Ditemukan ${pages.length} halaman Facebook.`);

    if (pages.length === 0) {
      return NextResponse.json(
        {
          error: "Tidak ada halaman Facebook yang ditemukan pada akun ini.",
          hint:
            "Pastikan Anda memiliki halaman Facebook sebagai Admin. Halaman ini harus terhubung ke akun Instagram Business.",
        },
        { status: 422 },
      );
    }

    let foundPage: IgPage | undefined;
    let foundIgAccount: IgBusinessAccount | undefined;

    foundPage = pages.find((page) => page.instagram_business_account?.id);
    if (foundPage) {
      foundIgAccount = foundPage.instagram_business_account;
      console.log(
        `[IG Connect] Strategi A berhasil: page=${foundPage.name}, ig=${foundIgAccount?.username}`,
      );
    }

    if (!foundIgAccount) {
      console.log("[IG Connect] Strategi A gagal, mencoba Strategi B (per-page token)...");
      for (const page of pages) {
        if (!page.access_token) {
          continue;
        }

        const igAccount = await fetchIgFromPage(page.id, page.access_token);
        if (igAccount?.id) {
          foundPage = page;
          foundIgAccount = igAccount;
          console.log(
            `[IG Connect] Strategi B berhasil: page=${page.name}, ig=${igAccount.username}`,
          );
          break;
        }
      }
    }

    if (!foundIgAccount || !foundPage) {
      const pageNames = pages.map((page) => page.name).join(", ");
      return NextResponse.json(
        {
          error: "Tidak ada halaman Facebook yang terhubung ke Instagram Business Account.",
          detail: `Halaman ditemukan (${pages.length}): ${pageNames}`,
          hint: [
            "1. Buka Instagram > Pengaturan > Akun > Beralih ke Akun Profesional",
            "2. Buka Facebook > Pengaturan Halaman > Instagram > Hubungkan Akun",
            "3. Coba connect ulang dari dashboard",
          ].join(" | "),
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      accessToken: normalizeSecretLikeValue(foundPage.access_token || longLivedToken),
      accountId: foundIgAccount.id,
      username: foundIgAccount.username ?? foundIgAccount.name ?? "",
      pageId: foundPage.id,
      pageName: foundPage.name,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[IG Connect] Unexpected error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
