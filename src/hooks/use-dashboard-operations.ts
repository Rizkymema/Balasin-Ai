"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { defaultDashboardOperations } from "@/lib/dashboard-operations";
import type { DashboardOperationsData } from "@/types/operations";

export function useDashboardOperations() {
  const [data, setData] = useState<DashboardOperationsData>(
    defaultDashboardOperations,
  );
  const [isLoading, setIsLoading] = useState(true);
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
    } catch {
      setData(defaultDashboardOperations);
      dataRef.current = defaultDashboardOperations;
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
        }
      } catch {
        if (mounted) {
          setData(defaultDashboardOperations);
          dataRef.current = defaultDashboardOperations;
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
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
  }, []);

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
    },
    [],
  );

  return {
    data,
    isLoading,
    refreshData,
    replaceData,
    patchData,
  };
}
