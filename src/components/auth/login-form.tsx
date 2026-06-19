"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { AlertCircle, Chrome } from "lucide-react";

import { AuthShell } from "@/components/layout/auth-shell";

type LoginFormProps = {
  redirectTo?: string;
};

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            ux_mode?: "popup" | "redirect";
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [buttonRendered, setButtonRendered] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const isGoogleConfigured = useMemo(
    () => GOOGLE_CLIENT_ID.length > 0,
    [],
  );

  const handleGoogleCredential = useCallback(
    async (credential?: string) => {
      if (!credential) {
        setError("Google tidak mengirim credential login.");
        setIsLoading(false);
        return;
      }

      setError("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/session/google", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential,
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
          data?: {
            email?: string;
            name?: string;
            picture?: string | null;
          };
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Login Google gagal.");
        }

        localStorage.setItem(
          "balesin_user",
          JSON.stringify({
            email: payload.data?.email ?? "",
            name: payload.data?.name ?? "",
            picture: payload.data?.picture ?? null,
            provider: "google",
            isLoggedIn: true,
          }),
        );

        const isOnboarded = localStorage.getItem("balesin_onboarded") === "true";
        router.push(redirectTo || (isOnboarded ? "/dashboard" : "/step-1"));
      } catch (fetchError: unknown) {
        setError(
          fetchError instanceof Error ? fetchError.message : "Login Google gagal.",
        );
        setIsLoading(false);
      }
    },
    [redirectTo, router],
  );

  useEffect(() => {
    const user = localStorage.getItem("balesin_user");
    const isOnboarded = localStorage.getItem("balesin_onboarded") === "true";
    if (user) {
      router.push(redirectTo || (isOnboarded ? "/dashboard" : "/step-1"));
    }
  }, [redirectTo, router]);

  useEffect(() => {
    if (
      !isGoogleConfigured ||
      !googleReady ||
      buttonRendered ||
      !googleButtonRef.current ||
      !window.google?.accounts?.id
    ) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        void handleGoogleCredential(response.credential);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: "popup",
    });

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: "standard",
      theme: "outline",
      text: "continue_with",
      shape: "pill",
      size: "large",
      width: 320,
      logo_alignment: "left",
    });

    setButtonRendered(true);
  }, [buttonRendered, googleReady, handleGoogleCredential, isGoogleConfigured]);

  return (
    <AuthShell>
      {isGoogleConfigured ? (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => setGoogleReady(true)}
        />
      ) : null}

      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold font-heading text-white">
            Masuk dengan Google
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Login dashboard sekarang memakai akun Google Anda.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        ) : null}

        {!isGoogleConfigured ? (
          <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Google login belum aktif.</p>
                <p className="mt-1 text-amber-100/80">
                  Isi `NEXT_PUBLIC_GOOGLE_CLIENT_ID` di `.env.local` dan Vercel
                  agar tombol Google muncul di browser.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Chrome className="h-4 w-4 text-[var(--color-brand)]" />
            Google Workspace
          </div>

          <div
            ref={googleButtonRef}
            className="flex min-h-11 items-center justify-center"
          >
            {isGoogleConfigured ? (
              <span className="text-xs text-slate-500">
                {isLoading
                  ? "Memverifikasi akun Google..."
                  : googleReady
                    ? "Menyiapkan tombol Google..."
                    : "Memuat Google Sign-In..."}
              </span>
            ) : (
              <span className="text-xs text-slate-500">
                Menunggu konfigurasi Google Client ID.
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-semibold text-[var(--color-brand)] hover:underline"
          >
            Daftar Gratis
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
