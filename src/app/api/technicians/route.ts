import { updateDb } from "@/lib/db";
import type { Technician } from "@/lib/types";

const SHIFTS = ["Matutino", "Vespertino", "Nocturno"] as const;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.name !== "string" ||
    !body.name.trim() ||
    typeof body.specialty !== "string" ||
    !body.specialty.trim() ||
    !SHIFTS.includes(body.shift)
  ) {
    return Response.json({ error: "Nombre, especialidad y turno son obligatorios" }, { status: 400 });
  }

  const tech = await updateDb((db) => {
    const t: Technician = {
      id: `T-${String(++db.counters.technician).padStart(2, "0")}`,
      name: body.name.trim(),
      specialty: body.specialty.trim(),
      shift: body.shift,
      email: typeof body.email === "string" && body.email.trim() ? body.email.trim() : undefined,
      phone: typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : undefined,
    };
    if (!t.email) t.email = `${t.id.toLowerCase()}@planta.local`;
    db.technicians.push(t);
    return t;
  });

  return Response.json(tech, { status: 201 });
}
