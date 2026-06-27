import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full border text-xs sm:text-sm font-semibold transition-all duration-250 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-[var(--color-brand)] px-6 py-2.5 text-[var(--color-bg)] hover:bg-[var(--color-brand-hover)] hover:opacity-90 focus-visible:ring-[var(--color-brand)] shadow-sm",
        secondary:
          "border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-2.5 text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-hover)] focus-visible:ring-[var(--color-text)]",
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
