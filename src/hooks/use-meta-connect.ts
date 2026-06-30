"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    FB: {
      init: (params: {
        appId: string;
        cookie?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: FacebookAuthResponse) => void,
        params: { 
          scope?: string; 
          extras?: Record<string, unknown>;
          config_id?: string;
          auth_type?: string;
          response_type?: string;
          override_default_response_type?: boolean;
        }
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

interface FacebookAuthResponse {
  status: "connected" | "not_authorized" | "unknown";
  authResponse?: {
    accessToken?: string;
    userID?: string;
    expiresIn?: number;
    signedRequest?: string;
    graphDomain?: string;
    data_access_expiration_time?: number;
    code?: string;
  };
}

// Payload yang dikembalikan dari Meta Embedded Signup (channel=INSTAGRAM)
export interface MetaInstagramResult {
  accessToken: string;
  accountId: string;
  username: string;
  pageId?: string;
  pageName?: string;
}

// Payload yang dikembalikan dari Meta Embedded Signup (channel=WHATSAPP)
export interface MetaWhatsAppResult {
  accessToken?: string;
  code?: string;
  phoneNumberId?: string;
  wabaId?: string;
  businessName?: string;
  displayPhone?: string;
}

type ConnectStatus = "idle" | "loading" | "success" | "error";

// App ID utama Meta (satu App untuk WA + IG)
const WHATSAPP_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID ?? "";
// Instagram menggunakan App ID yang sama kecuali ada override
const INSTAGRAM_APP_ID = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID ?? WHATSAPP_APP_ID;
const WA_CONFIG_ID = process.env.NEXT_PUBLIC_META_WA_CONFIG_ID ?? "";
const IG_CONFIG_ID = process.env.NEXT_PUBLIC_META_IG_CONFIG_ID ?? "";
const SDK_VERSION = "v21.0";

// ---------------------------------------------------
// Deteksi apakah running di HTTP (bukan HTTPS)
// FB.login hanya bisa dari HTTPS
// ---------------------------------------------------
function isHttpOnly(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.protocol === "http:";
}

// ---------------------------------------------------
// FB SDK bootstrap (idempotent – aman dipanggil >1x)
// ---------------------------------------------------
function loadFbSdk(appId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser context."));
      return;
    }

    if (isHttpOnly()) {
      reject(
        new Error(
          "FB.login membutuhkan HTTPS. Di localhost, gunakan 'Konfigurasi Manual / Advanced' di bawah untuk memasukkan token secara manual."
        )
      );
      return;
    }

    // Sudah ada SDK
    if (window.FB) {
      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: SDK_VERSION,
      });
      resolve();
      return;
    }

    // Sudah ada script tag – tunggu SDK siap
    if (document.getElementById("facebook-jssdk")) {
      const poll = setInterval(() => {
        if (window.FB) {
          clearInterval(poll);
          window.FB.init({
            appId: appId,
            cookie: true,
            xfbml: true,
            version: SDK_VERSION,
          });
          resolve();
        }
      }, 100);
      return;
    }

    // Inject SDK script
    window.fbAsyncInit = () => {
      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: SDK_VERSION,
      });
      resolve();
    };

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Gagal memuat script Facebook SDK."));
    document.head.appendChild(script);
  });
}

// ---------------------------------------------------
// Hook utama
// ---------------------------------------------------
export function useMetaConnect() {
  const [waStatus, setWaStatus] = useState<ConnectStatus>("idle");
  const [igStatus, setIgStatus] = useState<ConnectStatus>("idle");
  const [waError, setWaError] = useState<string | null>(null);
  const [igError, setIgError] = useState<string | null>(null);

  const waResultRef = useRef<MetaWhatsAppResult | null>(null);
  const igResultRef = useRef<MetaInstagramResult | null>(null);

  // Preload FB SDK untuk menghindari popup blocker yang memblokir async call
  useEffect(() => {
    if (!isHttpOnly()) {
      if (WHATSAPP_APP_ID) loadFbSdk(WHATSAPP_APP_ID).catch(() => {});
      else if (INSTAGRAM_APP_ID) loadFbSdk(INSTAGRAM_APP_ID).catch(() => {});
    }
  }, []);

  // -----------------------------------------------
  // WHATSAPP – Embedded Signup
  // -----------------------------------------------
  const connectWhatsApp = useCallback(async (): Promise<MetaWhatsAppResult | null> => {
    if (!WHATSAPP_APP_ID) {
      const msg = "NEXT_PUBLIC_META_APP_ID belum dikonfigurasi di .env";
      setWaError(msg);
      return null;
    }

    setWaStatus("loading");
    setWaError(null);

    if (typeof window === "undefined" || !window.FB) {
      try {
        await loadFbSdk(WHATSAPP_APP_ID);
      } catch (err) {
        setWaStatus("error");
        setWaError("Gagal memuat Facebook SDK. Pastikan HTTPS.");
        return null;
      }
    }

    return new Promise((resolve) => {
      window.FB.login(
        (response: FacebookAuthResponse) => {
          void (async () => {
            const auth = response.authResponse;
            if (response.status !== "connected" || !auth) {
              setWaStatus("error");
              setWaError("Autentikasi gagal atau dibatalkan oleh pengguna.");
              resolve(null);
              return;
            }

            if (!auth.accessToken && !auth.code) {
              setWaStatus("error");
              setWaError("Akses token atau code tidak ditemukan.");
              resolve(null);
              return;
            }

            try {
              const res = await fetch("/api/channels/whatsapp/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Kirim keduanya — server akan pakai salah satu yang tersedia
                body: JSON.stringify({
                  accessToken: auth.accessToken ?? undefined,
                  code: auth.code ?? undefined,
                }),
              });

              if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
              }

              const data = (await res.json()) as MetaWhatsAppResult;
              waResultRef.current = data;
              setWaStatus("success");
              resolve(data);
            } catch (err) {
              const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
              setWaStatus("error");
              setWaError(message);
              resolve(null);
            }
          })();
        },
        WA_CONFIG_ID ? {
          config_id: WA_CONFIG_ID,
          auth_type: "rerequest",
          response_type: "code",
          override_default_response_type: true,
        } : {
          scope: [
            "business_management",
            "whatsapp_business_management",
            "whatsapp_business_messaging",
          ].join(","),
          extras: {
            feature: "whatsapp_embedded_signup",
            setup: {},
          },
          auth_type: "rerequest",
        }
      );
    });
  }, []);

  // -----------------------------------------------
  // INSTAGRAM – OAuth
  // -----------------------------------------------
  const connectInstagram = useCallback(async (): Promise<MetaInstagramResult | null> => {
    if (!INSTAGRAM_APP_ID) {
      const msg = "NEXT_PUBLIC_INSTAGRAM_APP_ID atau NEXT_PUBLIC_META_APP_ID belum dikonfigurasi di .env";
      setIgError(msg);
      return null;
    }

    setIgStatus("loading");
    setIgError(null);

    if (typeof window === "undefined" || !window.FB) {
      try {
        await loadFbSdk(INSTAGRAM_APP_ID);
      } catch (err) {
        setIgStatus("error");
        setIgError("Gagal memuat Facebook SDK.");
        return null;
      }
    }

    // FB.login callback TIDAK boleh async — gunakan IIFE async di dalam
    return new Promise((resolve) => {
      window.FB.login(
        (response: FacebookAuthResponse) => {
          // Jalankan logika async di dalam sync callback menggunakan IIFE
          void (async () => {
            if (response.status !== "connected" || !response.authResponse) {
              setIgStatus("error");
              setIgError("Login Facebook dibatalkan atau gagal.");
              resolve(null);
              return;
            }

            try {
              const { accessToken } = response.authResponse;

              const res = await fetch("/api/channels/instagram/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accessToken }),
              });

              if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
              }

              const data = (await res.json()) as MetaInstagramResult;
              igResultRef.current = data;
              setIgStatus("success");
              resolve(data);
            } catch (err) {
              const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
              setIgStatus("error");
              setIgError(message);
              resolve(null);
            }
          })();
        },
        IG_CONFIG_ID ? {
          config_id: IG_CONFIG_ID,
          auth_type: "rerequest"
        } : {
          scope: [
            "instagram_basic",
            "instagram_manage_messages",
            "instagram_manage_comments",
            "pages_show_list",
            "pages_manage_metadata",
            "pages_read_engagement",
          ].join(","),
          auth_type: "rerequest"
        }
      );
    });
  }, []);

  return {
    connectWhatsApp,
    connectInstagram,
    waStatus,
    igStatus,
    waError,
    igError,
    isWaConnecting: waStatus === "loading",
    isIgConnecting: igStatus === "loading",
  };
}
