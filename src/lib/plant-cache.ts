"use client";

import { buildPlantAlerts } from "./alerts";
import { isAhead, parseClientDb } from "./client-db";
import type { Db, PlantAlert } from "./types";

const STORAGE_KEY = "plantkeep-demo-v1";

export type PlantState = Db & { now: number; alerts: PlantAlert[] };

type Listener = (state: PlantState) => void;

const listeners = new Set<Listener>();
let memoryDb: Db | null = null;
let generation = 0;
let syncing: Promise<void> | null = null;

export function hydrate(db: Db): PlantState {
  const now = Date.now();
  return { ...db, now, alerts: buildPlantAlerts(db, now) };
}

export function readStoredDb(): Db | null {
  if (memoryDb) return memoryDb;
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    memoryDb = parseClientDb(JSON.parse(raw));
    return memoryDb;
  } catch {
    return null;
  }
}

export function subscribePlant(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishPlant(input: Db | PlantState) {
  const db = parseClientDb(input) ?? memoryDb;
  if (!db) return;
  memoryDb = db;
  generation += 1;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* La sesión en memoria sigue; el navegador puede rechazar el almacenamiento. */
  }
  const state = hydrate(db);
  for (const listener of listeners) listener(state);
}

async function pullServer(): Promise<void> {
  const seen = generation;
  const res = await fetch(`/api/state?_=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (generation !== seen) return;
  const server = (await res.json()) as PlantState;
  const local = readStoredDb();
  if (local && isAhead(local, server)) {
    const beforePut = generation;
    const put = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(local),
    });
    if (generation !== beforePut) return;
    if (!put.ok) throw new Error(`HTTP ${put.status}`);
    publishPlant((await put.json()) as PlantState);
    return;
  }
  publishPlant(server);
}

/** Una sola sincronización a la vez, compartida por panel, campana y páginas. */
export function syncPlant() {
  if (!syncing) {
    syncing = pullServer().finally(() => {
      syncing = null;
    });
  }
  return syncing;
}
