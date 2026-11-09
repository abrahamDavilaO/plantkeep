import type { Db, PlantAlert, PlantAlertKind } from "./types";

const HOUR = 3_600_000;
const DAY_MS = 86_400_000;

function severity(kind: PlantAlertKind): PlantAlert["severity"] {
  if (
    kind === "preventivo_vencido" ||
    kind === "ot_critica_sin_asignar" ||
    kind === "ot_paro_prolongado"
  ) {
    return "critical";
  }
  if (kind === "ot_alta_sin_asignar" || kind === "ot_sin_atencion") return "warning";
  return "info";
}

function allTechnicianIds(db: Db) {
  return db.technicians.map((t) => t.id);
}

function preventiveAlerts(db: Db, now: number): PlantAlert[] {
  const out: PlantAlert[] = [];
  for (const plan of db.preventivePlans.filter((p) => p.active)) {
    const due = Date.parse(plan.nextDueAt);
    const daysUntil = (due - now) / DAY_MS;
    const machine = db.machines.find((m) => m.id === plan.machineId);
    const base = machine ? `${plan.title} · ${machine.name} (${machine.id})` : plan.title;

    if (daysUntil < 0) {
      const kind: PlantAlertKind = "preventivo_vencido";
      out.push({
        id: `alert-${plan.id}-overdue`,
        kind,
        severity: severity(kind),
        message: `Preventivo vencido: ${base}`,
        technicianIds: plan.technicianIds,
        preventiveId: plan.id,
        href: `/preventivo`,
        dueAt: plan.nextDueAt,
        createdAt: new Date(now).toISOString(),
      });
    } else if (daysUntil <= plan.notifyDaysBefore) {
      const when = daysUntil < 1 ? "hoy" : `en ${Math.ceil(daysUntil)} día(s)`;
      const kind: PlantAlertKind = "preventivo_proximo";
      out.push({
        id: `alert-${plan.id}-soon`,
        kind,
        severity: severity(kind),
        message: `Preventivo programado ${when}: ${base}`,
        technicianIds: plan.technicianIds,
        preventiveId: plan.id,
        href: `/preventivo`,
        dueAt: plan.nextDueAt,
        createdAt: new Date(now).toISOString(),
      });
    }
  }
  return out;
}

function workOrderAlerts(db: Db, now: number): PlantAlert[] {
  const out: PlantAlert[] = [];
  const techPool = allTechnicianIds(db);

  for (const wo of db.workOrders) {
    if (wo.status === "completada") continue;
    const machine = db.machines.find((m) => m.id === wo.machineId);
    const base = machine ? `${wo.id} · ${machine.name}` : wo.id;
    const age = now - Date.parse(wo.reportedAt);
    const href = `/ordenes?ot=${encodeURIComponent(wo.id)}`;
    const dueAt = wo.reportedAt;

    if (wo.status === "abierta" && wo.priority === "critica") {
      const kind: PlantAlertKind = "ot_critica_sin_asignar";
      out.push({
        id: `alert-${wo.id}-critica`,
        kind,
        severity: severity(kind),
        message: `OT crítica sin técnico: ${base} — ${wo.description}`,
        technicianIds: wo.technicianId ? [wo.technicianId] : techPool,
        workOrderId: wo.id,
        href,
        dueAt,
        createdAt: new Date(now).toISOString(),
      });
      continue;
    }

    if (wo.status === "abierta" && wo.priority === "alta" && age > 30 * 60_000) {
      const kind: PlantAlertKind = "ot_alta_sin_asignar";
      out.push({
        id: `alert-${wo.id}-alta`,
        kind,
        severity: severity(kind),
        message: `OT alta sin asignar (+30 min): ${base}`,
        technicianIds: techPool,
        workOrderId: wo.id,
        href,
        dueAt,
        createdAt: new Date(now).toISOString(),
      });
    }

    if (wo.stopsMachine && age > 2 * HOUR) {
      const kind: PlantAlertKind = "ot_paro_prolongado";
      out.push({
        id: `alert-${wo.id}-paro`,
        kind,
        severity: severity(kind),
        message: `Equipo detenido +2 h: ${base}`,
        technicianIds: wo.technicianId ? [wo.technicianId] : techPool,
        workOrderId: wo.id,
        href,
        dueAt,
        createdAt: new Date(now).toISOString(),
      });
    }

    if (wo.status === "asignada" && wo.assignedAt && !wo.startedAt) {
      const wait = now - Date.parse(wo.assignedAt);
      if (wait > HOUR) {
        const kind: PlantAlertKind = "ot_sin_atencion";
        out.push({
          id: `alert-${wo.id}-wait`,
          kind,
          severity: severity(kind),
          message: `Técnico aún no inicia atención (+1 h): ${base}`,
          technicianIds: wo.technicianId ? [wo.technicianId] : techPool,
          workOrderId: wo.id,
          href,
          dueAt: wo.assignedAt,
          createdAt: new Date(now).toISOString(),
        });
      }
    }
  }
  return out;
}

const SEVERITY_RANK = { critical: 0, warning: 1, info: 2 };

export function buildPlantAlerts(db: Db, now: number): PlantAlert[] {
  return [...preventiveAlerts(db, now), ...workOrderAlerts(db, now)].sort((a, b) => {
    const s = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (s !== 0) return s;
    return a.dueAt.localeCompare(b.dueAt);
  });
}
