import { connection } from "next/server";
import { editPinRequired, requestCanEdit } from "@/lib/edit-guard";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET(request: Request) {
  await connection();
  return Response.json(
    { required: editPinRequired(), authorized: requestCanEdit(request) },
    { headers: NO_STORE },
  );
}
