import { updateDb } from "@/lib/db";
import { plantPayload } from "@/lib/plant-payload";
import { readBody } from "@/lib/request-body";
import type { PreventivePlan } from "@/lib/types";

export async function POST(request: Request) {
  const { body, clientState } = await readBody(request);
  if (
    !body ||
    typeof body.machineId !== "string" ||
    typeof body.title !== "string" ||
    !body.title.trim() ||
    typeof body.intervalDays !== "number" ||
    body.intervalDays < 1 ||
    typeof body.nextDueAt !== "string" ||
    !Array.isArray(body.technicianIds) ||
    body.technicianIds.length === 0
  ) {
    return Response.json({ error: "Datos del plan preventivo incompletos" }, { status: 400 });
  }

  const machineId = body.machineId as string;
  const title = (body.title as string).trim();
  const intervalDays = body.intervalDays as number;
  const nextDueAt = body.nextDueAt as string;
  const technicianIds = body.technicianIds as string[];
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  const notifyDaysBefore = typeof body.notifyDaysBefore === "number" ? Math.max(0, body.notifyDaysBefore) : 3;

  const { result: plan, db } = await updateDb((db) => {
    if (!db.machines.some((m) => m.id === machineId)) return null;
    const techIds = technicianIds.filter((id) => db.technicians.some((t) => t.id === id));
    if (!techIds.length) return null;

    const p: PreventivePlan = {
      id: `MP-${++db.counters.preventive}`,
      machineId,
      title,
      description,
      intervalDays,
      nextDueAt,
      technicianIds: techIds,
      notifyDaysBefore,
      active: true,
    };
    db.preventivePlans.push(p);
    return p;
  }, clientState);

  if (!plan) return Response.json({ error: "Máquina o técnicos no válidos" }, { status: 400 });
  return Response.json({ ...plan, state: plantPayload(db) }, { status: 201 });
}
