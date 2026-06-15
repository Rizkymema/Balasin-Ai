"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--color-bg)] p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.08),transparent_35%),linear-gradient(180deg,#0b1020_0%,#0f172a_100%)]" />
      <div className="pointer-events-none absolute left-0 top-0 h-80 w-80 rounded-full bg-emerald-500/8 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-slate-500/6 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="group mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/12 bg-white/6 text-[var(--color-brand)] transition duration-300 group-hover:bg-white/10">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="font-heading text-2xl font-bold tracking-tight text-white">
                Balesin Desk
              </span>
              <p className="text-xs text-slate-400">Workspace operasional customer service</p>
            </div>
          </Link>
          <p className="max-w-[300px] text-sm text-slate-400">
            Demo auth sementara untuk mengakses dashboard operasional.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-6 shadow-2xl md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
