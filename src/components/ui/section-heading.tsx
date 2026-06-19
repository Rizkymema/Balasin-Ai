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
    <div className="max-w-3xl space-y-2">
      {eyebrow && (
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand)]">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)] sm:text-4xl mt-1">
        {title}
      </h2>
      <p className="text-sm leading-relaxed text-[var(--color-muted)] max-w-2xl">
        {description}
      </p>
    </div>
  );
}
