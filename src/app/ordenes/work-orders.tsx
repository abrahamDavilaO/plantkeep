"use client";

import { useState } from "react";
import { CardMetaGrid, CardMetaRow, ListCard } from "@/components/list-cards";
import { Badge, Card, Loading, PageHeader } from "@/components/ui";
import { CATEGORY_LABEL, PRIORITY_LABEL, PRIORITY_STYLE, STATUS_LABEL, STATUS_STYLE } from "@/lib/labels";
import { downtimeMs, formatDateTime, formatDuration, repairMs, responseMs } from "@/lib/metrics";
import type { WorkOrder, WorkOrderStatus } from "@/lib/types";
import { downloadCsv, workOrdersToCsv } from "@/lib/export-csv";
import { api, usePlant, type PlantState } from "@/lib/use-plant";

const FILTERS: { id: "activas" | WorkOrderStatus | "todas"; label: string }[] = [
  { id: "activas", label: "Activas" },
  { id: "abierta", label: "Sin asignar" },
  { id: "asignada", label: "Asignadas" },
  { id: "en_proceso", label: "En proceso" },
  { id: "completada", label: "Completadas" },
  { id: "todas", label: "Todas" },
];

const PRIORITY_ORDER = { critica: 0, alta: 1, media: 2, baja: 3 };

export function WorkOrders({ initialOrderId }: { initialOrderId: string | null }) {
  const { data, error, refresh } = usePlant(5_000);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("activas");
  const [selectedId, setSelectedId] = useState<string | null>(initialOrderId);
  const [search, setSearch] = useState("");

  if (!data) return <Loading error={error} />;

  const machineById = new Map(data.machines.map((m) => [m.id, m]));
  const techById = new Map(data.technicians.map((t) => [t.id, t]));
  const q = search.trim().toLowerCase();

  const filtered = data.workOrders
    .filter((w) => {
      if (filter === "activas") return w.status !== "completada";
      if (filter === "todas") return true;
      return w.status === filter;
    })
    .filter((w) => {
      if (!q) return true;
      const m = machineById.get(w.machineId);
      return [w.id, w.description, m?.name, m?.id, m?.line].some((s) => s?.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (a.status !== "completada" && b.status !== "completada") {
        const byDate = b.reportedAt.localeCompare(a.reportedAt);
        if (byDate !== 0) return byDate;
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      }
      return b.reportedAt.localeCompare(a.reportedAt);
    });

  const orders = filtered.slice(0, 150);

  function exportCsv() {
    if (!data) return;
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`plantkeep-ordenes-${stamp}.csv`, workOrdersToCsv(data, filtered));
  }

  const selected = data.workOrders.find((w) => w.id === selectedId) ?? null;
  const counts = Object.fromEntries(FILTERS.map((f) => [f.id, 0]));
  for (const w of data.workOrders) {
    counts.todas++;
    counts[w.status]++;
    if (w.status !== "completada") counts.activas++;
  }

  return (
    <>
      <PageHeader
        title="Órdenes de trabajo"
        subtitle="Asigna responsables y registra los tiempos de atención."
        actions={
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Exportar CSV ({filtered.length})
          </button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            data-on={filter === f.id}
            onClick={() => setFilter(f.id)}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm data-[on=true]:border-slate-900 data-[on=true]:bg-slate-900 data-[on=true]:text-white"
          >
            {f.label} <span className="ml-1 opacity-60">{counts[f.id]}</span>
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar OT, equipo o línea"
          className="ml-auto w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500 sm:w-64"
        />
      </div>

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <div className="min-w-0 space-y-2 md:hidden">
          {orders.map((w) => {
            const m = machineById.get(w.machineId);
            return (
              <ListCard key={w.id} active={selectedId === w.id} onClick={() => setSelectedId(w.id)}>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs text-slate-600">{w.id}</span>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Badge className={PRIORITY_STYLE[w.priority]}>{PRIORITY_LABEL[w.priority]}</Badge>
                    <Badge className={STATUS_STYLE[w.status]}>{STATUS_LABEL[w.status]}</Badge>
                  </div>
                </div>
                <p className="mt-2 font-medium text-slate-900">{m?.name}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {CATEGORY_LABEL[w.category]} · {w.description}
                </p>
                <CardMetaGrid>
                  <CardMetaRow label="Responsable">
                    {w.technicianId ? techById.get(w.technicianId)?.name : "Sin asignar"}
                  </CardMetaRow>
                  <CardMetaRow label="Reportada">{formatDateTime(w.reportedAt)}</CardMetaRow>
                </CardMetaGrid>
              </ListCard>
            );
          })}
          {orders.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">No hay órdenes en esta vista</p>
          )}
        </div>

        <Card className="hidden min-w-0 overflow-x-auto p-0 md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">OT</th>
                <th className="font-medium">Equipo</th>
                <th className="font-medium">Prioridad</th>
                <th className="font-medium">Estado</th>
                <th className="font-medium">Responsable</th>
                <th className="px-4 text-right font-medium">Reportada</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((w) => {
                const m = machineById.get(w.machineId);
                return (
                  <tr
                    key={w.id}
                    onClick={() => setSelectedId(w.id)}
                    className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 ${selectedId === w.id ? "bg-orange-50" : ""}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{w.id}</td>
                    <td>
                      <p className="font-medium text-slate-900">{m?.name}</p>
                      <p className="text-xs text-slate-500">{CATEGORY_LABEL[w.category]} · {w.description}</p>
                    </td>
                    <td><Badge className={PRIORITY_STYLE[w.priority]}>{PRIORITY_LABEL[w.priority]}</Badge></td>
                    <td><Badge className={STATUS_STYLE[w.status]}>{STATUS_LABEL[w.status]}</Badge></td>
                    <td className="text-slate-600">{w.technicianId ? techById.get(w.technicianId)?.name : "—"}</td>
                    <td className="px-4 text-right text-xs text-slate-500">{formatDateTime(w.reportedAt)}</td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">No hay órdenes en esta vista</td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        {!selected && (
          <p className="text-center text-sm text-slate-500 md:hidden">Toca una orden arriba para asignar técnico y cerrarla.</p>
        )}

        {selected ? (
          <OrderDetail key={selected.id} wo={selected} data={data} onChange={refresh} />
        ) : (
          <Card className="hidden h-fit text-sm text-slate-500 md:block xl:sticky xl:top-8">
            Selecciona una orden para ver el detalle.
          </Card>
        )}
      </div>
    </>
  );
}

function OrderDetail({ wo, data, onChange }: { wo: WorkOrder; data: PlantState; onChange: () => void }) {
  const [technicianId, setTechnicianId] = useState(wo.technicianId ?? "");
  const [resolution, setResolution] = useState("");
  const [partsUsed, setPartsUsed] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const machine = data.machines.find((m) => m.id === wo.machineId);
  const now = data.now;

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setErr(null);
    try {
      await api(`/api/work-orders/${wo.id}`, "PATCH", body);
      onChange();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  const timeline = [
    ["Reportada", wo.reportedAt, wo.reportedBy],
    ["Asignada", wo.assignedAt, wo.technicianId && data.technicians.find((t) => t.id === wo.technicianId)?.name],
    ["Inicio de atención", wo.startedAt, undefined],
    ["Cerrada", wo.completedAt, undefined],
  ] as const;

  return (
    <Card className="h-fit w-full min-w-0 max-w-full overflow-visible xl:sticky xl:top-8">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-slate-500">{wo.id}</p>
          <h2 className="text-lg font-semibold">{machine?.name}</h2>
          <p className="text-sm text-slate-500">
            {machine?.id} · {machine?.line} · Criticidad {machine?.criticality}
          </p>
        </div>
        <Badge className={STATUS_STYLE[wo.status]}>{STATUS_LABEL[wo.status]}</Badge>
      </div>

      <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
        <span className="font-medium">{CATEGORY_LABEL[wo.category]}:</span> {wo.description}
        {wo.stopsMachine && <span className="mt-1 block text-xs font-medium text-red-600">Equipo detenido</span>}
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-slate-200 p-2">
          <dt className="text-xs text-slate-500">Respuesta</dt>
          <dd className="font-semibold tabular-nums">{formatDuration(responseMs(wo) ?? (wo.status !== "completada" ? now - Date.parse(wo.reportedAt) : undefined))}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 p-2">
          <dt className="text-xs text-slate-500">Reparación</dt>
          <dd className="font-semibold tabular-nums">{formatDuration(repairMs(wo) ?? (wo.startedAt ? now - Date.parse(wo.startedAt) : undefined))}</dd>
        </div>
        <div className="rounded-lg border border-slate-200 p-2">
          <dt className="text-xs text-slate-500">Paro</dt>
          <dd className="font-semibold tabular-nums">{wo.stopsMachine ? formatDuration(downtimeMs(wo, now)) : "—"}</dd>
        </div>
      </dl>

      <ol className="mt-4 space-y-2 border-l-2 border-slate-200 pl-4 text-sm">
        {timeline.map(([label, at, who]) => (
          <li key={label} className={at ? "" : "text-slate-400"}>
            <span className="font-medium">{label}</span> · {formatDateTime(at)}
            {who && <span className="text-slate-500"> · {who}</span>}
          </li>
        ))}
      </ol>

      {wo.status !== "completada" && (
        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Responsable</span>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                className="w-full min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="">Selecciona técnico…</option>
                {data.technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.specialty} ({t.shift})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy || !technicianId || technicianId === wo.technicianId}
                onClick={() => act({ action: "assign", technicianId })}
                className="w-full shrink-0 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-300 sm:w-auto sm:min-w-[6.5rem]"
              >
                {wo.technicianId ? "Reasignar" : "Asignar"}
              </button>
            </div>
          </label>

          {wo.status === "asignada" && (
            <button
              disabled={busy}
              onClick={() => act({ action: "start" })}
              className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              Iniciar atención
            </button>
          )}

          {wo.status === "en_proceso" && (
            <>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                placeholder="Solución aplicada"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={partsUsed}
                onChange={(e) => setPartsUsed(e.target.value)}
                placeholder="Refacciones utilizadas (opcional)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                disabled={busy || !resolution.trim()}
                onClick={() => act({ action: "complete", resolution, partsUsed })}
                className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:bg-slate-300"
              >
                Cerrar orden
              </button>
            </>
          )}
        </div>
      )}

      {wo.status === "completada" && (
        <div className="mt-5 space-y-1 border-t border-slate-100 pt-4 text-sm">
          <p><span className="text-slate-500">Solución:</span> {wo.resolution}</p>
          {wo.partsUsed && <p><span className="text-slate-500">Refacciones:</span> {wo.partsUsed}</p>}
        </div>
      )}

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
    </Card>
  );
}
