import type { Machine, MachineStatus, WorkOrder } from "./types";

const HOUR = 3_600_000;
export const WINDOW_DAYS = 30;

export function machineStatus(machineId: string, workOrders: WorkOrder[]): MachineStatus {
  const open = workOrders.filter((w) => w.machineId === machineId && w.status !== "completada");
  if (open.some((w) => w.status === "en_proceso")) return "en_mantenimiento";
  if (open.some((w) => w.stopsMachine)) return "detenida";
  return "operando";
}

export function downtimeMs(wo: WorkOrder, now: number, from = 0): number {
  if (!wo.stopsMachine) return 0;
  const start = Math.max(Date.parse(wo.reportedAt), from);
  const end = wo.completedAt ? Date.parse(wo.completedAt) : now;
  return Math.max(0, end - start);
}

export function responseMs(wo: WorkOrder): number | undefined {
  if (!wo.startedAt) return undefined;
  return Date.parse(wo.startedAt) - Date.parse(wo.reportedAt);
}

export function repairMs(wo: WorkOrder): number | undefined {
  if (!wo.startedAt || !wo.completedAt) return undefined;
  return Date.parse(wo.completedAt) - Date.parse(wo.startedAt);
}

function avg(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export function computeKpis(machines: Machine[], workOrders: WorkOrder[], now: number) {
  const from = now - WINDOW_DAYS * 24 * HOUR;
  const inWindow = workOrders.filter((w) => Date.parse(w.reportedAt) >= from || w.status !== "completada");
  const totalDowntime = inWindow.reduce((s, w) => s + downtimeMs(w, now, from), 0);
  const plannedTime = machines.length * WINDOW_DAYS * 24 * HOUR;
  const failuresWithStop = inWindow.filter((w) => w.stopsMachine).length;

  const statuses = machines.map((m) => machineStatus(m.id, workOrders));

  return {
    availability: 1 - totalDowntime / plannedTime,
    downtimeHours: totalDowntime / HOUR,
    mttrHours: avg(inWindow.map(repairMs).filter((v): v is number => v !== undefined)) / HOUR,
    responseMinutes: avg(inWindow.map(responseMs).filter((v): v is number => v !== undefined)) / 60_000,
    mtbfHours: failuresWithStop ? (plannedTime - totalDowntime) / failuresWithStop / HOUR : 0,
    openOrders: workOrders.filter((w) => w.status !== "completada").length,
    failures: inWindow.length,
    stopped: statuses.filter((s) => s === "detenida").length,
    inMaintenance: statuses.filter((s) => s === "en_mantenimiento").length,
    operating: statuses.filter((s) => s === "operando").length,
  };
}

export function downtimeByLine(machines: Machine[], workOrders: WorkOrder[], now: number) {
  const from = now - WINDOW_DAYS * 24 * HOUR;
  const byMachine = new Map(machines.map((m) => [m.id, m]));
  const result = new Map<string, { line: string; hours: number; machines: number; failures: number }>();
  for (const m of machines) {
    const entry = result.get(m.line) ?? { line: m.line, hours: 0, machines: 0, failures: 0 };
    entry.machines++;
    result.set(m.line, entry);
  }
  for (const w of workOrders) {
    if (Date.parse(w.reportedAt) < from && w.status === "completada") continue;
    const m = byMachine.get(w.machineId);
    if (!m) continue;
    const entry = result.get(m.line)!;
    entry.hours += downtimeMs(w, now, from) / HOUR;
    entry.failures++;
  }
  return [...result.values()].map((e) => ({
    ...e,
    availability: 1 - e.hours / (e.machines * WINDOW_DAYS * 24),
  }));
}

export function dailyDowntime(workOrders: WorkOrder[], now: number, days = 14) {
  const DAY = 24 * HOUR;
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  const buckets = Array.from({ length: days }, (_, i) => {
    const start = end.getTime() - (days - i) * DAY;
    return { start, hours: 0, failures: 0 };
  });
  for (const w of workOrders) {
    const reported = Date.parse(w.reportedAt);
    const bucket = buckets.find((b) => reported >= b.start && reported < b.start + DAY);
    if (!bucket) continue;
    bucket.failures++;
    bucket.hours += downtimeMs(w, now) / HOUR;
  }
  return buckets;
}

export function machineAvailability(machineId: string, workOrders: WorkOrder[], now: number) {
  const from = now - WINDOW_DAYS * 24 * HOUR;
  const down = workOrders
    .filter((w) => w.machineId === machineId)
    .reduce((s, w) => s + downtimeMs(w, now, from), 0);
  return 1 - down / (WINDOW_DAYS * 24 * HOUR);
}

export function formatDuration(ms: number | undefined) {
  if (ms === undefined) return "—";
  const min = Math.round(ms / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function formatDateTime(iso: string | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function percent(v: number, digits = 1) {
  return `${(v * 100).toFixed(digits)}%`;
}
