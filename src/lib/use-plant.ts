"use client";

import { useCallback, useEffect, useState } from "react";
import type { Db, PlantAlert } from "./types";

export type PlantState = Db & { now: number; alerts: PlantAlert[] };

export function usePlant(refreshMs = 10_000) {
  const [data, setData] = useState<PlantState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/state?_=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    void (async () => {
      try {
        const res = await fetch(`/api/state?_=${Date.now()}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        setData(await res.json());
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error de conexión");
      }
    })();
    const t = setInterval(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/state?_=${Date.now()}`, { cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          setData(await res.json());
          setError(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Error de conexión");
        }
      })();
    }, refreshMs);
    return () => {
      cancelled = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshMs, refresh]);

  return { data, error, refresh };
}

export async function api<T = unknown>(url: string, method: "POST" | "PATCH", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json as T;
}
