import type { Db, PreventivePlan } from "./types";

const DAY = 86_400_000;

export function createDefaultPreventivePlans(
  machines: Db["machines"],
  technicians: Db["technicians"],
  now: number,
): PreventivePlan[] {
  const pickTechs = (n: number) => technicians.slice(0, n).map((t) => t.id);
  const templates: { title: string; intervalDays: number; notifyDaysBefore: number; machineIndexes: number[] }[] = [
    { title: "Lubricación de guías", intervalDays: 30, notifyDaysBefore: 3, machineIndexes: [0, 29, 48] },
    { title: "Inspección de seguridad", intervalDays: 90, notifyDaysBefore: 7, machineIndexes: [15, 75, 120] },
    { title: "Calibración sensores", intervalDays: 60, notifyDaysBefore: 5, machineIndexes: [33, 90, 150] },
    { title: "Cambio de filtros", intervalDays: 45, notifyDaysBefore: 3, machineIndexes: [5, 100, 180] },
    { title: "Revisión de rodillos", intervalDays: 14, notifyDaysBefore: 2, machineIndexes: [2, 50, 95] },
  ];

  let id = 100;
  const plans: PreventivePlan[] = [];
  for (const t of templates) {
    for (const idx of t.machineIndexes) {
      const machine = machines[idx];
      if (!machine) continue;
      const offsetDays = (idx % 12) - 4;
      const nextDueAt = new Date(now + offsetDays * DAY).toISOString();
      plans.push({
        id: `MP-${++id}`,
        machineId: machine.id,
        title: t.title,
        description: `Rutina preventiva programada para ${machine.line}.`,
        intervalDays: t.intervalDays,
        nextDueAt,
        technicianIds: pickTechs(2),
        notifyDaysBefore: t.notifyDaysBefore,
        active: true,
      });
    }
  }
  return plans;
}

export function migrateDb(db: Db, now = Date.now()): Db {
  db.epoch = typeof db.epoch === "number" && db.epoch >= 1 ? Math.floor(db.epoch) : 1;
  db.revision = typeof db.revision === "number" && db.revision >= 1 ? Math.floor(db.revision) : 1;
  db.preventivePlans ??= [];
  db.counters ??= { workOrder: 1000, technician: db.technicians.length, preventive: 100 };
  db.counters.technician ??= db.technicians.length;
  db.counters.preventive ??= 100;

  for (const t of db.technicians) {
    if (!t.email) t.email = `${t.id.toLowerCase()}@planta.local`;
  }

  if (db.preventivePlans.length === 0 && db.machines.length > 0) {
    db.preventivePlans = createDefaultPreventivePlans(db.machines, db.technicians, now);
    const maxId = db.preventivePlans.reduce((m, p) => Math.max(m, parseInt(p.id.replace("MP-", ""), 10) || 0), 100);
    db.counters.preventive = Math.max(db.counters.preventive, maxId);
  }

  return db;
}
