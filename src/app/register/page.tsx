"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Chrome, Lock, Mail, User } from "lucide-react";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const demoRegisterEnabled =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_ALLOW_DEMO_REGISTER?.trim() === "true";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!demoRegisterEnabled) {
      setError("Register demo dinonaktifkan di production. Gunakan Google login.");
      return;
    }
    if (!name || !email || !password || !confirmPassword) {
      setError("Semua bidang harus diisi.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Kata sandi dan konfirmasi kata sandi tidak cocok.");
      return;
    }
    if (!acceptTerms) {
      setError("Anda harus menyetujui ketentuan demo.");
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
        name,
        password,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error || "Register gagal");
        }

        localStorage.setItem(
          "balesin_user",
          JSON.stringify({ email, name, isLoggedIn: true }),
        );
        router.push("/step-1");
      })
      .catch((fetchError: unknown) => {
        setError(fetchError instanceof Error ? fetchError.message : "Register gagal.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <AuthShell>
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold font-heading text-white">Buat Workspace Demo</h2>
          <p className="mt-1 text-xs text-slate-400">
            Form ini tetap demo dulu sampai auth real dihubungkan.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        ) : null}

        {!demoRegisterEnabled ? (
          <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
            Register demo dinonaktifkan di production untuk mencegah akses admin tanpa kontrol identitas.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <User className="h-3.5 w-3.5 text-[var(--color-brand)]" />
              Nama Lengkap
            </label>
            <Input
              type="text"
              placeholder="Nama Anda"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isLoading || !demoRegisterEnabled}
              required
            />
          </div>

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
              disabled={isLoading || !demoRegisterEnabled}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Lock className="h-3.5 w-3.5 text-[var(--color-brand)]" />
              Kata Sandi
            </label>
            <Input
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading || !demoRegisterEnabled}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Lock className="h-3.5 w-3.5 text-[var(--color-brand)]" />
              Konfirmasi Kata Sandi
            </label>
            <Input
              type="password"
              placeholder="Ulangi kata sandi"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isLoading || !demoRegisterEnabled}
              required
            />
          </div>

          <div className="flex items-start gap-2 pt-1">
            <input
              id="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(event) => setAcceptTerms(event.target.checked)}
              disabled={isLoading || !demoRegisterEnabled}
              className="mt-0.5 h-4 w-4 rounded border-white/12 bg-white/4 text-[var(--color-brand)]"
            />
            <label htmlFor="terms" className="text-[11px] leading-normal text-slate-400">
              Saya memahami ini masih mode demo dan auth production belum diaktifkan.
            </label>
          </div>

          <Button
            type="submit"
            className="mt-2 w-full"
            disabled={isLoading || !demoRegisterEnabled}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-slate-950" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Mendaftar...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                {demoRegisterEnabled ? "Daftar Sekarang" : "Register Demo Dinonaktifkan"}
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        <div className="relative my-5 flex items-center justify-center">
          <span className="absolute inset-x-0 h-px bg-white/8" />
          <span className="relative bg-[var(--color-surface-strong)] px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            atau daftar dengan
          </span>
        </div>

        <button
          type="button"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-white/8 disabled:opacity-50"
        >
          <Chrome className="h-4 w-4 text-[var(--color-brand)]" />
          Google Workspace
        </button>

        <div className="mt-5 text-center text-xs text-slate-400">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-[var(--color-brand)] hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
