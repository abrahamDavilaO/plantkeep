import { parseClientDb } from "./client-db";
import type { Db } from "./types";

export async function readBody(request: Request): Promise<{ body: Record<string, unknown> | null; clientState: Db | null }> {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) return { body: null, clientState: null };
  const clientState = parseClientDb(body.clientState);
  delete body.clientState;
  return { body, clientState };
}
