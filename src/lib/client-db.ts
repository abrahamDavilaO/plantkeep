import { migrateDb } from "./migrate-db";
import type { Db } from "./types";

function positiveInt(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback;
}

/** El snapshot con época mayor gana; dentro de la misma época, gana la revisión mayor. */
export function isAhead(candidate: { epoch?: number; revision?: number }, current: { epoch?: number; revision?: number }) {
  const candidateEpoch = candidate.epoch ?? 1;
  const currentEpoch = current.epoch ?? 1;
  if (candidateEpoch !== currentEpoch) return candidateEpoch > currentEpoch;
  return (candidate.revision ?? 1) > (current.revision ?? 1);
}

export function parseClientDb(raw: unknown): Db | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const input = raw as Partial<Db>;
  if (!Array.isArray(input.machines) || input.machines.length === 0 || input.machines.length > 5000) return null;
  if (!Array.isArray(input.workOrders) || input.workOrders.length > 20000) return null;
  if (!Array.isArray(input.technicians) || input.technicians.length === 0 || input.technicians.length > 5000) return null;

  const counters = input.counters;
  const db: Db = {
    createdAt: typeof input.createdAt === "string" ? input.createdAt : new Date(0).toISOString(),
    epoch: positiveInt(input.epoch, 1),
    revision: positiveInt(input.revision, 1),
    machines: input.machines,
    technicians: input.technicians,
    workOrders: input.workOrders,
    preventivePlans: Array.isArray(input.preventivePlans) ? input.preventivePlans : [],
    counters:
      counters && typeof counters === "object"
        ? {
            workOrder: positiveInt(counters.workOrder, 1000),
            technician: positiveInt(counters.technician, input.technicians.length),
            preventive: positiveInt(counters.preventive, 100),
          }
        : { workOrder: 1000, technician: input.technicians.length, preventive: 100 },
  };
  return migrateDb(db);
}
