import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          "flex h-11 w-full appearance-none rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-sm text-[var(--color-text)] shadow-sm transition duration-200 focus:border-[var(--color-brand)] focus:outline-none focus:ring-3 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
