"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ReadOnlyNote, useEditAccess } from "@/components/edit-access";
import { Loading, PageHeader } from "@/components/ui";
import { CATEGORY_LABEL, PRIORITY_LABEL } from "@/lib/labels";
import { machineStatus } from "@/lib/metrics";
import type { FailureCategory, Priority, WorkOrder } from "@/lib/types";
import { api, usePlant } from "@/lib/use-plant";

const PRIORITY_BUTTON: Record<Priority, string> = {
  baja: "border-slate-300 data-[on=true]:bg-slate-700",
  media: "border-sky-300 data-[on=true]:bg-sky-600",
  alta: "border-amber-300 data-[on=true]:bg-amber-500",
  critica: "border-red-300 data-[on=true]:bg-red-600",
};

const REPORTER_KEY = "plantkeep.reporter";

export function ReportForm() {
  const { data, error, refresh } = usePlant(30_000);
  const { canEdit } = useEditAccess();
  const [line, setLine] = useState<string>("");
  const [query, setQuery] = useState("");
  const [machineId, setMachineId] = useState("");
  const [category, setCategory] = useState<FailureCategory | "">("");
  const [priority, setPriority] = useState<Priority>("media");
  const [stopsMachine, setStopsMachine] = useState(true);
  const [description, setDescription] = useState("");
  const [reportedBy, setReportedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<WorkOrder | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setReportedBy(localStorage.getItem(REPORTER_KEY) ?? "");
    });
  }, []);

  const lines = useMemo(() => [...new Set(data?.machines.map((m) => m.line))], [data]);
  const machines = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.machines.filter(
      (m) => (!line || m.line === line) && (!q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)),
    );
  }, [data, line, query]);

  if (!data) return <Loading error={error} />;

  const machine = data.machines.find((m) => m.id === machineId);
  const canSubmit = machine && category && description.trim() && reportedBy.trim() && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      localStorage.setItem(REPORTER_KEY, reportedBy.trim());
      const wo = await api<WorkOrder>("/api/work-orders", "POST", {
        machineId,
        category,
        priority,
        stopsMachine,
        description,
        reportedBy,
      });
      setCreated(wo);
      refresh();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "No se pudo enviar el reporte");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setCreated(null);
    setMachineId("");
    setCategory("");
    setPriority("media");
    setStopsMachine(true);
    setDescription("");
    setQuery("");
  }

  if (created) {
    return (
      <div className="mx-auto max-w-xl pt-10 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</div>
        <h1 className="mt-4 text-2xl font-semibold">Falla reportada</h1>
        <p className="mt-2 text-slate-600">
          Se generó la orden de trabajo <span className="font-mono font-semibold text-slate-900">{created.id}</span> para{" "}
          <span className="font-medium">{machine?.name}</span>. El supervisor de mantenimiento ya puede asignarla.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={reset} className="rounded-xl bg-orange-500 px-6 py-4 text-lg font-medium text-white hover:bg-orange-600">
            Reportar otra falla
          </button>
          <Link
            href={`/ordenes?ot=${encodeURIComponent(created.id)}`}
            className="rounded-xl border border-slate-300 px-6 py-4 text-lg font-medium hover:bg-slate-100"
          >
            Ver esta orden
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Reportar falla" subtitle="Selecciona el equipo, el tipo de falla y describe lo que pasó." />

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">1. Equipo</h2>
        <div className="flex flex-wrap gap-2">
          {["", ...lines].map((l) => (
            <button
              key={l || "all"}
              data-on={line === l}
              onClick={() => setLine(l)}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm data-[on=true]:border-slate-900 data-[on=true]:bg-slate-900 data-[on=true]:text-white"
            >
              {l || "Todas las líneas"}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o número (ej. M-042)"
          className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-orange-500"
        />
        <div className="mt-3 grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
          {machines.map((m) => {
            const status = machineStatus(m.id, data.workOrders);
            return (
              <button
                key={m.id}
                data-on={machineId === m.id}
                onClick={() => setMachineId(m.id)}
                className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-slate-400 data-[on=true]:border-orange-500 data-[on=true]:ring-2 data-[on=true]:ring-orange-200"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-500">{m.id}</span>
                  {status !== "operando" && (
                    <span className={`h-2 w-2 rounded-full ${status === "detenida" ? "bg-red-500" : "bg-blue-500"}`} title="Ya tiene una orden abierta" />
                  )}
                </div>
                <p className="mt-1 text-sm font-medium leading-tight">{m.name}</p>
                <p className="text-xs text-slate-500">{m.line}</p>
              </button>
            );
          })}
          {machines.length === 0 && <p className="col-span-full py-6 text-center text-sm text-slate-500">Sin resultados</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">2. Tipo de falla</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.keys(CATEGORY_LABEL) as FailureCategory[]).map((c) => (
            <button
              key={c}
              data-on={category === c}
              onClick={() => setCategory(c)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-base font-medium hover:border-slate-400 data-[on=true]:border-slate-900 data-[on=true]:bg-slate-900 data-[on=true]:text-white"
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">3. Prioridad</h2>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => (
              <button
                key={p}
                data-on={priority === p}
                onClick={() => setPriority(p)}
                className={`rounded-xl border-2 bg-white py-4 text-sm font-medium data-[on=true]:border-transparent data-[on=true]:text-white ${PRIORITY_BUTTON[p]}`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">¿El equipo está detenido?</h2>
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                data-on={stopsMachine === v}
                onClick={() => setStopsMachine(v)}
                className="rounded-xl border border-slate-200 bg-white py-4 text-sm font-medium data-[on=true]:border-slate-900 data-[on=true]:bg-slate-900 data-[on=true]:text-white"
              >
                {v ? "Sí, está parado" : "No, sigue operando"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-3">
        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-slate-500">4. Descripción</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="¿Qué observaste? Ruido, alarma en pantalla, fuga…"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-orange-500"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm font-semibold uppercase tracking-wide text-slate-500">Reporta</span>
          <input
            value={reportedBy}
            onChange={(e) => setReportedBy(e.target.value)}
            placeholder="Tu nombre"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-orange-500"
          />
        </label>
      </section>

      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/95 py-4 backdrop-blur">
        <p className="text-sm text-slate-600">
          {machine ? (
            <>
              <span className="font-medium text-slate-900">{machine.name}</span> · {machine.line}
              {category && <> · {CATEGORY_LABEL[category]}</>}
            </>
          ) : (
            "Selecciona un equipo para continuar"
          )}
          {submitError && <span className="block text-red-600">{submitError}</span>}
        </p>
        <ReadOnlyNote />
        <button
          onClick={submit}
          disabled={!canEdit || !canSubmit}
          className="rounded-xl bg-orange-500 px-8 py-4 text-lg font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "Enviando…" : "Enviar reporte"}
        </button>
      </div>
    </div>
  );
}
