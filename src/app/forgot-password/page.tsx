"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Send } from "lucide-react";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email) {
      return;
    }

    setIsLoading(true);
    window.setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
            <Send className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold font-heading text-white">Email Pemulihan Terkirim</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Instruksi demo sudah dikirim ke <strong>{email}</strong> jika alamat terdaftar.
          </p>
          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-[var(--color-brand)] transition hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke halaman masuk
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold font-heading text-white">Lupa Kata Sandi?</h2>
          <p className="mt-1 text-xs text-slate-400">
            Masukkan email Anda untuk menerima tautan pemulihan demo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Mail className="h-3.5 w-3.5 text-[var(--color-brand)]" />
              Email Terdaftar
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

          <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
            {isLoading ? "Mengirim Tautan..." : "Kirim Tautan Pemulihan"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Kembali ke halaman masuk
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
