import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-[88px] w-full resize-y rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-text)] shadow-sm placeholder:text-slate-400 transition duration-200 focus:border-[var(--color-brand)] focus:outline-none focus:ring-3 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
