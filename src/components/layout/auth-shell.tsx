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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.07),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="group mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-white text-[var(--color-brand)] shadow-sm transition duration-300 group-hover:border-blue-200 group-hover:bg-blue-50">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="font-heading text-2xl font-extrabold tracking-tight text-slate-950">
                Balesin Desk
              </span>
              <p className="text-xs text-slate-500">Workspace operasional customer service</p>
            </div>
          </Link>
          <p className="max-w-[300px] text-sm text-slate-500">
            Demo auth sementara untuk mengakses dashboard operasional.
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-floating)] md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
