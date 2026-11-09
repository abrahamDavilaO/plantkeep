import { updateDb } from "@/lib/db";
import { completePreventivePlan } from "@/lib/preventive";
import { plantPayload } from "@/lib/plant-payload";
import { readBody } from "@/lib/request-body";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { body, clientState } = await readBody(request);
  if (body?.action !== "complete") {
    return Response.json({ error: "Acción no soportada" }, { status: 400 });
  }

  const { result, db } = await updateDb((db) => {
    const plan = db.preventivePlans.find((p) => p.id === id);
    if (!plan) return null;
    completePreventivePlan(plan, Date.now());
    return plan;
  }, clientState);

  if (!result) return Response.json({ error: "Plan no encontrado" }, { status: 404 });
  return Response.json({ ...result, state: plantPayload(db) });
}
