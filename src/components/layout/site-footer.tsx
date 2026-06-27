export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-12 text-[10px] sm:text-xs font-medium text-[var(--color-muted)] lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>© {new Date().getFullYear()} Balesin.AI. Platform AI Agent & Omnichannel CRM Indonesia.</p>
        <p className="text-[var(--color-muted)]/60 font-normal">
          Built with Next.js, Tailwind CSS & Apple Minimalism.
        </p>
      </div>
    </footer>
  );
}
