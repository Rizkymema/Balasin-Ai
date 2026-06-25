"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KnowledgeBasePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/automation/knowledge-base");
  }, [router]);

  return (
    <div className="flex h-[50vh] items-center justify-center text-sm text-slate-400">
      Mengalihkan ke pengaturan Knowledge Base di menu Automation...
    </div>
  );
}
