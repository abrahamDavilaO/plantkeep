import "server-only";

import { timingSafeEqual } from "node:crypto";

const HEADER = "x-plantkeep-edit";

/** En Vercel, sin PIN configurado nadie puede escribir. En local, sin PIN, la demo sigue editable. */
export function editPinRequired(): boolean {
  if (process.env.DEMO_EDIT_PIN?.trim()) return true;
  return process.env.VERCEL === "1";
}

export function requestCanEdit(request: Request): boolean {
  const expected = process.env.DEMO_EDIT_PIN?.trim() ?? "";
  if (!expected) return process.env.VERCEL !== "1";
  const got = request.headers.get(HEADER) ?? "";
  const provided = Buffer.from(got);
  const secret = Buffer.from(expected);
  if (provided.length !== secret.length) return false;
  return timingSafeEqual(provided, secret);
}

export function rejectIfCannotEdit(request: Request): Response | null {
  if (requestCanEdit(request)) return null;
  return Response.json(
    { error: "La demo pública es de solo lectura. Hace falta el PIN de edición." },
    { status: 401 },
  );
}
