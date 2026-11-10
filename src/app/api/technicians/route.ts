import { updateDb } from "@/lib/db";
import { rejectIfCannotEdit } from "@/lib/edit-guard";
import { plantPayload } from "@/lib/plant-payload";
import { readBody } from "@/lib/request-body";
import type { Technician } from "@/lib/types";

const SHIFTS = ["Matutino", "Vespertino", "Nocturno"] as const;

export async function POST(request: Request) {
  const denied = rejectIfCannotEdit(request);
  if (denied) return denied;
  const { body, clientState } = await readBody(request);
  if (
    !body ||
    typeof body.name !== "string" ||
    !body.name.trim() ||
    typeof body.specialty !== "string" ||
    !body.specialty.trim() ||
    (typeof body.shift !== "string" || !(SHIFTS as readonly string[]).includes(body.shift))
  ) {
    return Response.json({ error: "Nombre, especialidad y turno son obligatorios" }, { status: 400 });
  }

  const name = (body.name as string).trim();
  const specialty = (body.specialty as string).trim();
  const shift = body.shift as (typeof SHIFTS)[number];
  const email = typeof body.email === "string" && body.email.trim() ? body.email.trim() : undefined;
  const phone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : undefined;

  const { result: tech, db } = await updateDb((db) => {
    const t: Technician = {
      id: `T-${String(++db.counters.technician).padStart(2, "0")}`,
      name,
      specialty,
      shift,
      email,
      phone,
    };
    if (!t.email) t.email = `${t.id.toLowerCase()}@planta.local`;
    db.technicians.push(t);
    return t;
  }, clientState);

  return Response.json({ ...tech, state: plantPayload(db) }, { status: 201 });
}
