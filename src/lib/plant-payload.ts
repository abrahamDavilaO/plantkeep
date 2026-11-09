import { buildPlantAlerts } from "./alerts";
import type { Db } from "./types";

export function plantPayload(db: Db) {
  const now = Date.now();
  return { ...db, now, alerts: buildPlantAlerts(db, now) };
}
