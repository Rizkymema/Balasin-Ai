import type { CSSProperties } from "react";
import type { Metadata } from "next";

import { RootShell } from "@/components/layout/root-shell";
import { siteConfig } from "@/constants/site";
import { resolveAppUrl } from "@/lib/app-url";

import "./globals.css";

const rootFontVariables: CSSProperties = {
  "--app-font-body":
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
  "--app-font-heading":
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro Icons", "Segoe UI", sans-serif',
  "--app-font-mono": '"SF Mono", "SFMono-Regular", "Consolas", "JetBrains Mono", monospace',
} as CSSProperties;

export const metadata: Metadata = {
  metadataBase: new URL(resolveAppUrl()),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] antialiased"
        style={rootFontVariables}
        suppressHydrationWarning
      >
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}
