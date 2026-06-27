import { MessageSquare } from "lucide-react";
import { primaryNavigation } from "@/constants/navigation";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]">
            <MessageSquare className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-text)]">
              Balesin<span className="text-[var(--color-muted)]">.AI</span>
            </p>
            <p className="text-[8px] text-[var(--color-muted)] font-semibold uppercase tracking-widest">
              Omnichannel CRM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-6 md:flex">
            {primaryNavigation.map((item) => (
              <a
                key={item.label}
                className="text-[11px] font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors duration-200"
                href={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a
            href="/login"
            className="inline-flex h-8 items-center justify-center rounded-full bg-[var(--color-brand)] px-4 text-xs font-bold text-slate-950 transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            Masuk
          </a>
        </div>
      </div>
    </header>
  );
}
