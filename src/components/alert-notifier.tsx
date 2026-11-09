"use client";

import { useEffect } from "react";
import type { PlantAlert } from "@/lib/types";
import { usePlant } from "@/lib/use-plant";

const SEEN_KEY = "plantkeep.seenAlerts";

function playCriticalBeep() {
  if (typeof window === "undefined" || localStorage.getItem("plantkeep.alertSound") !== "1") return;
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      void ctx.close();
    }, 180);
  } catch {
    /* noop */
  }
}

function pushNotifications(alerts: PlantAlert[]) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const seen = new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]") as string[]);
  const fresh = alerts.filter((a) => !seen.has(a.id));
  if (!fresh.length) return;

  for (const a of fresh.slice(0, 3)) {
    try {
      new Notification(`PlantKeep · ${a.severity === "critical" ? "Urgente" : "Aviso"}`, {
        body: a.message,
        tag: a.id,
      });
    } catch {
      /* noop */
    }
    seen.add(a.id);
  }

  if (fresh.some((a) => a.severity === "critical")) playCriticalBeep();
  sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
}

export function AlertNotifier() {
  const { data } = usePlant(20_000);

  useEffect(() => {
    if (!data?.alerts.length) return;
    if (localStorage.getItem("plantkeep.notify") !== "1") return;
    pushNotifications(data.alerts);
  }, [data?.alerts]);

  return null;
}
