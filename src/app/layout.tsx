import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { RootShell } from "@/components/layout/root-shell";
import { siteConfig } from "@/constants/site";
import { resolveAppUrl } from "@/lib/app-url";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const rootFontVariables: CSSProperties = {
  "--font-body": "var(--font-manrope)",
  "--font-heading": "var(--font-manrope)",
  "--font-mono": '"Consolas", "JetBrains Mono", "Courier New", monospace',
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
        className={`${manrope.variable} min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] antialiased`}
        style={rootFontVariables}
        suppressHydrationWarning
      >
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}
