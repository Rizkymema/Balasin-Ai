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
  return <thead className={cn("border-b border-white/8 text-slate-400 font-bold", className)} {...props} />;
}

export function TableBody({ className, ...props }: TableHTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-white/4", className)} {...props} />;
}

export function TableRow({ className, ...props }: TableHTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition hover:bg-white/2", className)} {...props} />;
}

export function TableCell({ className, ...props }: TableHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("p-4 align-middle text-slate-300 font-medium", className)} {...props} />;
}

export function TableHead({ className, ...props }: TableHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("p-4 align-middle font-bold text-slate-400 uppercase tracking-wider", className)} {...props} />;
}
