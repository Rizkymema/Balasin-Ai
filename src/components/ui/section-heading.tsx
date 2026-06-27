import { Badge } from "@/components/ui/badge";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="max-w-4xl space-y-2 select-none">
      {eyebrow && (
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl sm:text-3.5xl font-bold tracking-[-0.03em] text-[var(--color-text)] leading-tight mt-1.5">
        {title}
      </h2>
      <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-muted)] max-w-2xl mt-2 font-normal">
        {description}
      </p>
    </div>
  );
}
