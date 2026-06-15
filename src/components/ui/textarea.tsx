import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-white/12 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition duration-200 focus:border-cyan-400/80 focus:bg-white/8 focus:outline-none focus:ring-1 focus:ring-cyan-400/80 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
