import { updateDb } from "@/lib/db";

type Action =
  | { action: "assign"; technicianId: string }
  | { action: "start" }
  | { action: "complete"; resolution: string; partsUsed?: string };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Action | null;
  if (!body) return Response.json({ error: "Solicitud inválida" }, { status: 400 });

  const result = await updateDb((db) => {
    const wo = db.workOrders.find((w) => w.id === id);
    if (!wo) return { error: "Orden no encontrada", status: 404 } as const;
    const now = new Date().toISOString();

    switch (body.action) {
      case "assign": {
        if (!db.technicians.some((t) => t.id === body.technicianId))
          return { error: "Técnico no encontrado", status: 400 } as const;
        if (wo.status === "completada") return { error: "La orden ya está cerrada", status: 409 } as const;
        wo.technicianId = body.technicianId;
        wo.assignedAt ??= now;
        if (wo.status === "abierta") wo.status = "asignada";
        break;
      }
      case "start": {
        if (wo.status !== "asignada") return { error: "Primero asigna un técnico", status: 409 } as const;
        wo.status = "en_proceso";
        wo.startedAt = now;
        break;
      }
      case "complete": {
        if (wo.status !== "en_proceso") return { error: "La orden no está en proceso", status: 409 } as const;
        if (!body.resolution?.trim()) return { error: "Describe la solución aplicada", status: 400 } as const;
        wo.status = "completada";
        wo.completedAt = now;
        wo.resolution = body.resolution.trim();
        wo.partsUsed = body.partsUsed?.trim() || undefined;
        break;
      }
      default:
        return { error: "Acción desconocida", status: 400 } as const;
    }
    return { wo };
  });

  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  return Response.json(result.wo);
}
