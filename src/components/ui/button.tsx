import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center rounded-xl border text-xs font-bold shadow-sm transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98] select-none sm:text-sm",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-[var(--color-brand)] px-5 py-2.5 text-white hover:bg-[var(--color-brand-hover)] focus-visible:ring-[var(--color-brand)]",
        secondary:
          "border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-[var(--color-text)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)] focus-visible:ring-[var(--color-brand)]",
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
