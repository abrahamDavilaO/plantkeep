import { updateDb } from "@/lib/db";
import { rejectIfCannotEdit } from "@/lib/edit-guard";
import { plantPayload } from "@/lib/plant-payload";
import { readBody } from "@/lib/request-body";
import type { FailureCategory, Priority, WorkOrder } from "@/lib/types";

const CATEGORIES: FailureCategory[] = ["mecanica", "electrica", "hidraulica", "neumatica", "control", "seguridad"];
const PRIORITIES: Priority[] = ["baja", "media", "alta", "critica"];

export async function POST(request: Request) {
  const denied = rejectIfCannotEdit(request);
  if (denied) return denied;
  const { body, clientState } = await readBody(request);
  if (
    !body ||
    typeof body.machineId !== "string" ||
    typeof body.category !== "string" ||
    !CATEGORIES.includes(body.category as FailureCategory) ||
    typeof body.priority !== "string" ||
    !PRIORITIES.includes(body.priority as Priority) ||
    typeof body.description !== "string" ||
    !body.description.trim() ||
    typeof body.reportedBy !== "string" ||
    !body.reportedBy.trim()
  ) {
    return Response.json({ error: "Datos del reporte incompletos" }, { status: 400 });
  }

  const machineId = body.machineId as string;
  const category = body.category as FailureCategory;
  const priority = body.priority as Priority;
  const description = (body.description as string).trim();
  const reportedBy = (body.reportedBy as string).trim();
  const stopsMachine = Boolean(body.stopsMachine);

  const { result, db } = await updateDb((db) => {
    if (!db.machines.some((m) => m.id === machineId)) return null;
    const wo: WorkOrder = {
      id: `OT-${++db.counters.workOrder}`,
      machineId,
      category,
      priority,
      description,
      stopsMachine,
      reportedBy,
      reportedAt: new Date().toISOString(),
      status: "abierta",
    };
    db.workOrders.unshift(wo);
    return wo;
  }, clientState);

  if (!result) return Response.json({ error: "Máquina no encontrada" }, { status: 404 });
  return Response.json({ ...result, state: plantPayload(db) }, { status: 201 });
}
