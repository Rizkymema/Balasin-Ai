"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AIAgentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/automation/ai-agent");
  }, [router]);

  return (
    <div className="flex h-[50vh] items-center justify-center text-sm text-slate-400">
      Mengalihkan ke pengaturan AI Agent di menu Automation...
    </div>
  );
}
