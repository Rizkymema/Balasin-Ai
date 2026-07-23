import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-blue-200 bg-blue-50 text-blue-700 font-bold",
    secondary: "border-slate-200 bg-slate-100 text-slate-700 font-medium",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 font-bold",
    warning: "border-amber-200 bg-amber-50 text-amber-700 font-bold",
    destructive: "border-red-200 bg-red-50 text-red-700 font-bold",
    outline: "border-slate-300 bg-white text-slate-700 font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors shadow-2xs",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
