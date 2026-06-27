"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { defaultDashboardConfig } from "@/lib/dashboard-config";
import type { DashboardConfig } from "@/types/dashboard-config";

export function useDashboardConfig() {
  const [config, setConfig] = useState<DashboardConfig>(defaultDashboardConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
    } catch {
      setError("Gagal memuat dashboard config.");
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
          setError(null);
        }
      } catch {
        if (mounted) {
          setError("Gagal memuat dashboard config.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    let intervalId: number;
    if (mounted) {
      intervalId = window.setInterval(() => {
        if (document.visibilityState === "visible") {
          fetch("/api/dashboard-config", {
            credentials: "include",
            cache: "no-store",
          })
            .then((res) => res.json())
            .then((payload) => {
              if (mounted) {
                setConfig(payload.data);
                configRef.current = payload.data;
              }
            })
            .catch(() => {});
        }
      }, 5000);
    }

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
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
        if (response.status === 401) {
          window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
          return;
        }
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
          if (response.status === 401) {
            window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
            return;
          }
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
    error,
    refreshConfig,
    replaceConfig,
    patchConfig,
  };
}
