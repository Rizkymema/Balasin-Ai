"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function InboxError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      icon={<AlertTriangle className="h-10 w-10" />}
      title="Unified Inbox gagal dimuat"
      description="Terjadi masalah saat memuat data inbox. Coba muat ulang halaman ini atau refresh workspace."
      action={
        <Button type="button" onClick={reset}>
          Coba Lagi
        </Button>
      }
      className="min-h-[26rem]"
    />
  );
}

