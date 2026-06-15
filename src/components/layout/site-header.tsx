import { Building2 } from "lucide-react";

import { primaryNavigation } from "@/constants/navigation";
import { siteConfig } from "@/constants/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[color:rgba(5,10,20,0.75)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/6 text-[var(--color-brand)]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white">
              {siteConfig.name}
            </p>
            <p className="text-sm text-slate-400">Omnichannel customer service workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-8 md:flex mr-2">
            {primaryNavigation.map((item) => (
              <a
                key={item.label}
                className="text-sm text-slate-300 transition hover:text-white"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-white/12 bg-white/6 px-4 text-xs font-bold text-white transition duration-200 hover:bg-white/10"
          >
            Masuk / Demo
          </a>
        </div>
      </div>
    </header>
  );
}
