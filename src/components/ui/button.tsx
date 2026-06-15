import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full border text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-[var(--color-brand)] px-5 py-2.5 text-slate-950 hover:bg-[var(--color-brand-hover)] hover:shadow-[0_0_12px_rgba(0,210,255,0.2)] focus-visible:ring-[var(--color-brand)]",
        secondary:
          "border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-white hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-hover)] focus-visible:ring-white/40",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
