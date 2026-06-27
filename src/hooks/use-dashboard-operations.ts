"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { defaultDashboardOperations } from "@/lib/dashboard-operations";
import type { DashboardOperationsData } from "@/types/operations";

export function useDashboardOperations() {
  const [data, setData] = useState<DashboardOperationsData>(
    defaultDashboardOperations,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const refreshData = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard-operations", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard operations");
      }

      const payload = (await response.json()) as {
        ok: boolean;
        data: DashboardOperationsData;
      };

      setData(payload.data);
      dataRef.current = payload.data;
      setError(null);
    } catch {
      setError("Gagal memuat data operasional dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await fetch("/api/dashboard-operations", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard operations");
        }

        const payload = (await response.json()) as {
          ok: boolean;
          data: DashboardOperationsData;
        };

        if (mounted) {
          setData(payload.data);
          dataRef.current = payload.data;
          setError(null);
        }
      } catch {
        if (mounted) {
          setError("Gagal memuat data operasional dashboard.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    // Set up polling for realtime updates every 5 seconds
    const intervalId = setInterval(() => {
      if (mounted && !document.hidden) {
        void load();
      }
    }, 5000);

    // Refresh on window focus to ensure data is fresh when user returns
    const onFocus = () => {
      if (mounted) {
        void load();
      }
    };
    
    // Listen for cross-tab sync events
    const onStorage = (e: StorageEvent) => {
      if (e.key === "balesin_dashboard_operations" && mounted) {
        void load();
      }
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    window.addEventListener("balesin-dashboard-operations-change", load);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("balesin-dashboard-operations-change", load);
    };
  }, []);

  const replaceData = useCallback(async (next: DashboardOperationsData) => {
    setData(next);
    dataRef.current = next;
    await fetch("/api/dashboard-operations", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(next),
    });
    window.dispatchEvent(new Event("balesin-dashboard-operations-change"));
  }, []);

  const applyLocalPatch = useCallback(
    (updater: (current: DashboardOperationsData) => DashboardOperationsData) => {
      const next = updater(dataRef.current);
      setData(next);
      dataRef.current = next;
      window.dispatchEvent(new Event("balesin-dashboard-operations-change"));
    },
    [],
  );

  const patchData = useCallback(
    async (updater: (current: DashboardOperationsData) => DashboardOperationsData) => {
      const next = updater(dataRef.current);
      setData(next);
      dataRef.current = next;
      await fetch("/api/dashboard-operations", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(next),
      });
      window.dispatchEvent(new Event("balesin-dashboard-operations-change"));
    },
    [],
  );

  return {
    data,
    isLoading,
    error,
    refreshData,
    replaceData,
    applyLocalPatch,
    patchData,
  };
}
