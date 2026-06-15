import type { CSSProperties } from "react";
import type { Metadata } from "next";

import { RootShell } from "@/components/layout/root-shell";
import { siteConfig } from "@/constants/site";

import "./globals.css";

const rootFontVariables: CSSProperties = {
  "--font-body":
    '"Segoe UI", "Trebuchet MS", "Helvetica Neue", Arial, sans-serif',
  "--font-heading":
    '"Aptos Display", "Segoe UI Semibold", "Trebuchet MS", sans-serif',
  "--font-mono": '"Consolas", "JetBrains Mono", "Courier New", monospace',
} as CSSProperties;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
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
