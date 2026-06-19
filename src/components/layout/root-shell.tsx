"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

type RootShellProps = {
  children: ReactNode;
};

const APP_SHELL_PREFIXES = [
  "/dashboard",
  "/inbox",
  "/customers",
  "/ai-agent",
  "/knowledge-base",
  "/products-services",
  "/booking",
  "/tickets",
  "/automation",
  "/broadcast",
  "/channels",
  "/analytics",
  "/settings",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/step-1",
  "/step-2",
  "/step-3",
  "/step-4",
  "/complete",
];

export function RootShell({ children }: RootShellProps) {
  const pathname = usePathname();
  const useStandaloneShell = APP_SHELL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (useStandaloneShell) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen overflow-hidden theme-light bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300">
      <div className="relative z-10 flex min-h-screen flex-col justify-between">
        <div>
          <SiteHeader />
          <main>{children}</main>
        </div>
        <SiteFooter />
      </div>
    </div>
  );
}
