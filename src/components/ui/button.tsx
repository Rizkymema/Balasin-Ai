import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border text-xs font-semibold shadow-xs transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.99] select-none sm:text-sm",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm font-bold",
        secondary:
          "border-slate-200 bg-white px-4 py-2 text-slate-800 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 shadow-2xs font-medium",
        destructive:
          "border-transparent bg-red-600 px-4 py-2 text-white hover:bg-red-700 shadow-sm font-bold",
        outline:
          "border-slate-200 bg-transparent px-4 py-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium",
        ghost:
          "border-transparent bg-transparent px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-none font-medium",
        link:
          "border-transparent bg-transparent px-0 py-0 text-blue-600 hover:underline shadow-none font-semibold",
      },
      size: {
        default: "min-h-10 px-4 py-2",
        sm: "min-h-8 px-3 py-1.5 text-xs rounded-lg",
        lg: "min-h-12 px-6 py-3 text-sm rounded-xl font-bold",
        icon: "h-9 w-9 p-0 rounded-lg justify-center",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
  };

export function Button({ className, variant, size, isLoading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />}
      {children}
    </button>
  );
}
