import { resetDb } from "@/lib/db";

export async function POST() {
  await resetDb();
  return Response.json({ ok: true });
}
