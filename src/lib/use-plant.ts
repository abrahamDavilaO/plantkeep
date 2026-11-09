"use client";

import { useCallback, useEffect, useState } from "react";
import { hydrate, publishPlant, readStoredDb, subscribePlant, syncPlant, type PlantState } from "./plant-cache";

export type { PlantState };

export function usePlant(refreshMs = 10_000) {
  const [data, setData] = useState<PlantState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      await syncPlant();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    }
  }, []);

  useEffect(() => {
    const cached = readStoredDb();
    if (cached) setData(hydrate(cached));
    const unsubscribe = subscribePlant((state) => {
      setData(state);
      setError(null);
    });
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    void refresh();
    const timer = setInterval(() => void refresh(), refreshMs);
    return () => {
      unsubscribe();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshMs, refresh]);

  return { data, error, refresh };
}

export async function api<T = unknown>(url: string, method: "POST" | "PATCH", body?: Record<string, unknown>): Promise<T> {
  const clientState = readStoredDb();
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...(body ?? {}), ...(clientState ? { clientState } : {}) }),
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string; state?: PlantState };
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  if (json && typeof json === "object" && "state" in json && json.state) {
    publishPlant(json.state);
    delete json.state;
  }
  return json;
}
