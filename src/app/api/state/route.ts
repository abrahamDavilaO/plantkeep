import { connection } from "next/server";
import { parseClientDb } from "@/lib/client-db";
import { readDb, replaceIfAhead } from "@/lib/db";
import { rejectIfCannotEdit } from "@/lib/edit-guard";
import { plantPayload } from "@/lib/plant-payload";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET() {
  await connection();
  try {
    const db = await readDb();
    return Response.json(plantPayload(db), { headers: NO_STORE });
  } catch (e) {
    console.error("[api/state]", e);
    return Response.json({ error: "No se pudo cargar la base de datos" }, { status: 500, headers: NO_STORE });
  }
}

export async function PUT(request: Request) {
  await connection();
  const denied = rejectIfCannotEdit(request);
  if (denied) return denied;
  try {
    const incoming = parseClientDb(await request.json().catch(() => null));
    if (!incoming) return Response.json({ error: "Estado de demo inválido" }, { status: 400, headers: NO_STORE });
    const db = await replaceIfAhead(incoming);
    return Response.json(plantPayload(db), { headers: NO_STORE });
  } catch (e) {
    console.error("[api/state]", e);
    return Response.json({ error: "No se pudo guardar la demo" }, { status: 500, headers: NO_STORE });
  }
}
