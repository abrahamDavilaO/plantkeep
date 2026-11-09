"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DemoReset() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function reset() {
    if (!confirm("¿Regenerar todos los datos de demostración? Se perderán reportes y cambios en órdenes.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (!res.ok) throw new Error("No se pudo reiniciar");
      router.push("/");
      router.refresh();
    } catch {
      alert("Error al reiniciar la base local.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={reset}
      disabled={busy}
      className="mt-2 w-full rounded-lg border border-slate-700 px-2 py-1.5 text-left text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200 disabled:opacity-50"
    >
      {busy ? "Regenerando…" : "Reiniciar datos demo"}
    </button>
  );
}
