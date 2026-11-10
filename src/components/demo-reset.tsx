"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEditAccess } from "@/components/edit-access";
import { editHeaders } from "@/lib/edit-session";
import { publishPlant, readStoredDb } from "@/lib/plant-cache";

export function DemoReset() {
  const router = useRouter();
  const { canEdit } = useEditAccess();
  const [busy, setBusy] = useState(false);

  async function reset() {
    if (!confirm("¿Volver al escenario inicial? Se borran los reportes y cambios de esta demo, también en este navegador.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...editHeaders() },
        body: JSON.stringify({ clientState: readStoredDb() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo reiniciar");
      if (json.state) publishPlant(json.state);
      router.push("/");
      router.refresh();
    } catch {
      alert("Error al reiniciar la demo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={reset}
      disabled={busy || !canEdit}
      data-tour="reset"
      className="mt-2 w-full rounded-lg border border-slate-700 px-2 py-1.5 text-left text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200 disabled:opacity-50"
    >
      {busy ? "Regenerando…" : "Reiniciar datos demo"}
    </button>
  );
}
