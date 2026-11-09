import { connection } from "next/server";
import { resetDb } from "@/lib/db";
import { plantPayload } from "@/lib/plant-payload";
import { readBody } from "@/lib/request-body";

export async function POST(request: Request) {
  await connection();
  const { clientState } = await readBody(request);
  const db = await resetDb(clientState?.epoch);
  return Response.json({ ok: true, state: plantPayload(db) });
}
