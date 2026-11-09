import { connection } from "next/server";
import { readDb } from "@/lib/db";
import { buildPlantAlerts } from "@/lib/alerts";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET() {
  await connection();
  const now = Date.now();
  const db = await readDb();
  return Response.json({ ...db, now, alerts: buildPlantAlerts(db, now) }, { headers: NO_STORE });
}
