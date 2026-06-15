"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Lock } from "lucide-react";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!password || !confirmPassword) {
      setError("Semua bidang harus diisi.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Kata sandi tidak cocok.");
      return;
    }

    setError("");
    setIsLoading(true);
    window.setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1200);
  };

  if (isSuccess) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold font-heading text-white">Sandi Berhasil Diubah</h2>
          <p className="mt-2 text-xs text-slate-400">
            Kata sandi baru demo Anda sudah tersimpan.
          </p>
          <Link href="/login" className="mt-6 block">
            <Button className="w-full">Masuk Sekarang</Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold font-heading text-white">Setel Ulang Sandi</h2>
          <p className="mt-1 text-xs text-slate-400">Masukkan kata sandi baru demo Anda.</p>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Lock className="h-3.5 w-3.5 text-[var(--color-brand)]" />
              Kata Sandi Baru
            </label>
            <Input
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Lock className="h-3.5 w-3.5 text-[var(--color-brand)]" />
              Konfirmasi Sandi Baru
            </label>
            <Input
              type="password"
              placeholder="Ulangi kata sandi"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan Kata Sandi"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
