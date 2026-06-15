import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-white/12 bg-white/4 px-4 py-2 text-sm text-white placeholder-slate-500 transition duration-200 focus:border-cyan-400/80 focus:bg-white/8 focus:outline-none focus:ring-1 focus:ring-cyan-400/80 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
