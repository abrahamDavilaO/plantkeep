import { CATEGORY_LABEL, PRIORITY_LABEL, STATUS_LABEL } from "./labels";
import { formatDateTime, formatDuration, repairMs, responseMs } from "./metrics";
import type { Db, WorkOrder } from "./types";

function escapeCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function workOrdersToCsv(db: Db, orders: WorkOrder[]) {
  const machineById = new Map(db.machines.map((m) => [m.id, m]));
  const techById = new Map(db.technicians.map((t) => [t.id, t]));
  const header = [
    "OT",
    "Equipo",
    "ID equipo",
    "Línea",
    "Categoría",
    "Prioridad",
    "Estado",
    "Descripción",
    "Detiene equipo",
    "Reportó",
    "Reportada",
    "Responsable",
    "Asignada",
    "Inicio atención",
    "Cerrada",
    "Tiempo respuesta",
    "Tiempo reparación",
    "Refacciones",
    "Solución",
  ];
  const rows = orders.map((w) => {
    const m = machineById.get(w.machineId);
    return [
      w.id,
      m?.name ?? "",
      w.machineId,
      m?.line ?? "",
      CATEGORY_LABEL[w.category],
      PRIORITY_LABEL[w.priority],
      STATUS_LABEL[w.status],
      w.description,
      w.stopsMachine ? "Sí" : "No",
      w.reportedBy,
      formatDateTime(w.reportedAt),
      w.technicianId ? techById.get(w.technicianId)?.name ?? w.technicianId : "",
      formatDateTime(w.assignedAt),
      formatDateTime(w.startedAt),
      formatDateTime(w.completedAt),
      formatDuration(responseMs(w)),
      formatDuration(repairMs(w)),
      w.partsUsed ?? "",
      w.resolution ?? "",
    ]
      .map((c) => escapeCell(String(c)))
      .join(",");
  });
  return [header.join(","), ...rows].join("\r\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
