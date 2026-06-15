import { siteConfig } from "@/constants/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>{siteConfig.name} foundation for product, dashboard, and future channel operations.</p>
        <p>Built with Next.js App Router, TypeScript, and token-driven UI.</p>
      </div>
    </footer>
  );
}
