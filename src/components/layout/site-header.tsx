import { Building2 } from "lucide-react";
import { primaryNavigation } from "@/constants/navigation";
import { siteConfig } from "@/constants/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[var(--color-brand)] shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-900">
              Balesin<span className="text-[var(--color-brand)]">.AI</span>
            </p>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Omnichannel CRM Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-8 md:flex mr-2">
            {primaryNavigation.map((item) => (
              <a
                key={item.label}
                className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-4.5 text-xs font-bold transition duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:scale-[1.02]"
            style={{ color: "#ffffff" }}
          >
            Masuk / Demo
          </a>
        </div>
      </div>
    </header>
  );
}
