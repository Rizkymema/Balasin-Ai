"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Chrome, Lock, Mail } from "lucide-react";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginFormProps = {
  redirectTo?: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      setError("Email dan password harus diisi.");
      return;
    }

    setError("");
    setIsLoading(true);

    void fetch("/api/session/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Login gagal");
        }

        localStorage.setItem("balesin_user", JSON.stringify({ email, isLoggedIn: true }));
        router.push(redirectTo || "/step-1");
      })
      .catch((fetchError: unknown) => {
        setError(fetchError instanceof Error ? fetchError.message : "Login gagal.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    void fetch("/api/session/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "user.google@gmail.com",
        password: "google-demo",
        name: "Google Demo User",
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Login Google gagal");
        }

        localStorage.setItem(
          "balesin_user",
          JSON.stringify({ email: "user.google@gmail.com", isLoggedIn: true }),
        );
        router.push(redirectTo || "/step-1");
      })
      .catch((fetchError: unknown) => {
        setError(fetchError instanceof Error ? fetchError.message : "Login gagal.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <AuthShell>
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold font-heading text-white">Masuk ke Workspace</h2>
          <p className="mt-1 text-xs text-slate-400">
            Demo login sementara untuk membuka dashboard.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Mail className="h-3.5 w-3.5 text-[var(--color-brand)]" />
              Email Bisnis
            </label>
            <Input
              type="email"
              placeholder="nama@perusahaan.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Lock className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                Kata Sandi
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[var(--color-brand)] transition hover:underline"
              >
                Lupa Sandi?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="Masukkan kata sandi demo"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Memproses...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Masuk Sekarang
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <span className="absolute inset-x-0 h-px bg-white/8" />
          <span className="relative bg-[var(--color-surface-strong)] px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            atau masuk dengan
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-white/8 disabled:opacity-50"
        >
          <Chrome className="h-4 w-4 text-[var(--color-brand)]" />
          Google Workspace
        </button>

        <div className="mt-6 text-center text-xs text-slate-400">
          Belum punya akun?{" "}
          <Link href="/register" className="font-semibold text-[var(--color-brand)] hover:underline">
            Daftar Gratis
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
