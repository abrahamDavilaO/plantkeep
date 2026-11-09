import { updateDb } from "@/lib/db";
import { completePreventivePlan } from "@/lib/preventive";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { action?: string } | null;
  if (body?.action !== "complete") {
    return Response.json({ error: "Acción no soportada" }, { status: 400 });
  }

  const result = await updateDb((db) => {
    const plan = db.preventivePlans.find((p) => p.id === id);
    if (!plan) return null;
    completePreventivePlan(plan, Date.now());
    return plan;
  });

  if (!result) return Response.json({ error: "Plan no encontrado" }, { status: 404 });
  return Response.json(result);
}
