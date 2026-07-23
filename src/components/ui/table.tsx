import type { TableHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <table className={cn("w-full border-collapse text-left text-xs", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: TableHTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-[var(--color-border)] bg-slate-50/80 font-bold text-slate-500", className)} {...props} />;
}

export function TableBody({ className, ...props }: TableHTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-slate-100", className)} {...props} />;
}

export function TableRow({ className, ...props }: TableHTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-blue-50/40", className)} {...props} />;
}

export function TableCell({ className, ...props }: TableHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("p-4 align-middle font-medium text-slate-700", className)} {...props} />;
}

export function TableHead({ className, ...props }: TableHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("p-4 align-middle text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500", className)} {...props} />;
}
