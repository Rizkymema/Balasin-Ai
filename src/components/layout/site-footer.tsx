import { siteConfig } from "@/constants/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-xs font-semibold text-slate-500 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>© {new Date().getFullYear()} Balesin.AI. Platform AI Agent & Omnichannel CRM Indonesia.</p>
        <p className="text-slate-400 font-normal">
          Built with Next.js, Tailwind CSS & Clean Design Tokens.
        </p>
      </div>
    </footer>
  );
}
