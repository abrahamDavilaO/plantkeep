import { updateDb } from "@/lib/db";
import type { PreventivePlan } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
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

  const plan = await updateDb((db) => {
    if (!db.machines.some((m) => m.id === body.machineId)) return null;
    const techIds = body.technicianIds.filter((id: string) => db.technicians.some((t) => t.id === id));
    if (!techIds.length) return null;

    const p: PreventivePlan = {
      id: `MP-${++db.counters.preventive}`,
      machineId: body.machineId,
      title: body.title.trim(),
      description: typeof body.description === "string" ? body.description.trim() : undefined,
      intervalDays: body.intervalDays,
      nextDueAt: body.nextDueAt,
      technicianIds: techIds,
      notifyDaysBefore: typeof body.notifyDaysBefore === "number" ? Math.max(0, body.notifyDaysBefore) : 3,
      active: true,
    };
    db.preventivePlans.push(p);
    return p;
  });

  if (!plan) return Response.json({ error: "Máquina o técnicos no válidos" }, { status: 400 });
  return Response.json(plan, { status: 201 });
}
