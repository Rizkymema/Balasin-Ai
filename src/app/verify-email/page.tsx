"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, MailOpen, RefreshCw } from "lucide-react";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResend = () => {
    setIsResending(true);
    window.setTimeout(() => {
      setIsResending(false);
      setIsSent(true);
      window.setTimeout(() => setIsSent(false), 3000);
    }, 1200);
  };

  return (
    <AuthShell>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
          <MailOpen className="h-6 w-6" />
        </div>

        <h2 className="text-lg font-bold font-heading text-white">Verifikasi Email Anda</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          Kami telah mengirimkan tautan verifikasi demo ke email bisnis Anda.
        </p>

        <div className="my-6 rounded-lg border border-white/8 bg-white/4 p-4 text-[11px] leading-normal text-slate-300">
          Belum menerima email? Periksa folder spam atau kirim ulang dari halaman ini.
        </div>

        <div className="space-y-3">
          <Button onClick={handleResend} className="w-full" disabled={isResending}>
            {isResending ? (
              <span className="flex items-center justify-center gap-1.5">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Mengirim Ulang...
              </span>
            ) : (
              "Kirim Ulang Email Verifikasi"
            )}
          </Button>

          {isSent ? (
            <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 animate-fade-in">
              <CheckCircle2 className="h-4 w-4" />
              Email verifikasi baru berhasil dikirim.
            </p>
          ) : null}

          <Link href="/login" className="block pt-2 text-xs font-semibold text-slate-400 transition hover:text-white">
            Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
