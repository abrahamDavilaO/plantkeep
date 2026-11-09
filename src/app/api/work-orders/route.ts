import { updateDb } from "@/lib/db";
import type { FailureCategory, Priority, WorkOrder } from "@/lib/types";

const CATEGORIES: FailureCategory[] = ["mecanica", "electrica", "hidraulica", "neumatica", "control", "seguridad"];
const PRIORITIES: Priority[] = ["baja", "media", "alta", "critica"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.machineId !== "string" ||
    !CATEGORIES.includes(body.category) ||
    !PRIORITIES.includes(body.priority) ||
    typeof body.description !== "string" ||
    !body.description.trim() ||
    typeof body.reportedBy !== "string" ||
    !body.reportedBy.trim()
  ) {
    return Response.json({ error: "Datos del reporte incompletos" }, { status: 400 });
  }

  const result = await updateDb((db) => {
    if (!db.machines.some((m) => m.id === body.machineId)) return null;
    const wo: WorkOrder = {
      id: `OT-${++db.counters.workOrder}`,
      machineId: body.machineId,
      category: body.category,
      priority: body.priority,
      description: body.description.trim(),
      stopsMachine: Boolean(body.stopsMachine),
      reportedBy: body.reportedBy.trim(),
      reportedAt: new Date().toISOString(),
      status: "abierta",
    };
    db.workOrders.unshift(wo);
    return wo;
  });

  if (!result) return Response.json({ error: "Máquina no encontrada" }, { status: 404 });
  return Response.json(result, { status: 201 });
}
