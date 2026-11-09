import { connection } from "next/server";
import { readDb } from "@/lib/db";
import { buildPlantAlerts } from "@/lib/alerts";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export const runtime = "nodejs";

export async function GET() {
  await connection();
  try {
    const now = Date.now();
    const db = await readDb();
    return Response.json({ ...db, now, alerts: buildPlantAlerts(db, now) }, { headers: NO_STORE });
  } catch (e) {
    console.error("[api/state]", e);
    return Response.json({ error: "No se pudo cargar la base de datos" }, { status: 500, headers: NO_STORE });
  }
}
