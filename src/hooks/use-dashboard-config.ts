"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { defaultDashboardConfig } from "@/lib/dashboard-config";
import type { DashboardConfig } from "@/types/dashboard-config";

export function useDashboardConfig() {
  const [config, setConfig] = useState<DashboardConfig>(defaultDashboardConfig);
  const [isLoading, setIsLoading] = useState(true);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const refreshConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard-config", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard config");
      }

      const payload = (await response.json()) as {
        ok: boolean;
        data: DashboardConfig;
      };

      setConfig(payload.data);
      configRef.current = payload.data;
    } catch {
      setConfig(defaultDashboardConfig);
      configRef.current = defaultDashboardConfig;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await fetch("/api/dashboard-config", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard config");
        }

        const payload = (await response.json()) as {
          ok: boolean;
          data: DashboardConfig;
        };

        if (mounted) {
          setConfig(payload.data);
          configRef.current = payload.data;
        }
      } catch {
        if (mounted) {
          setConfig(defaultDashboardConfig);
          configRef.current = defaultDashboardConfig;
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

  const replaceConfig = useCallback(async (next: DashboardConfig) => {
    const previous = configRef.current;
    setConfig(next);
    configRef.current = next;
    try {
      const response = await fetch("/api/dashboard-config", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(next),
      });
      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || "Gagal menyimpan pengaturan.");
      }
    } catch (e) {
      setConfig(previous);
      configRef.current = previous;
      alert(e instanceof Error ? e.message : "Terjadi kesalahan saat menyimpan.");
      throw e;
    }
  }, []);

  const patchConfig = useCallback(
    async (updater: (current: DashboardConfig) => DashboardConfig) => {
      const previous = configRef.current;
      const next = updater(previous);
      setConfig(next);
      configRef.current = next;
      try {
        const response = await fetch("/api/dashboard-config", {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(next),
        });
        if (!response.ok) {
          const errPayload = await response.json().catch(() => ({}));
          throw new Error(errPayload.error || "Gagal menyimpan pengaturan.");
        }
      } catch (e) {
        setConfig(previous);
        configRef.current = previous;
        alert(e instanceof Error ? e.message : "Terjadi kesalahan saat menyimpan.");
        throw e;
      }
    },
    [],
  );

  return {
    config,
    isLoading,
    refreshConfig,
    replaceConfig,
    patchConfig,
  };
}
