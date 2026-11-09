"use client";

import { useState } from "react";
import { CardMetaGrid, CardMetaRow, ListCard } from "@/components/list-cards";
import { Badge, Card, Loading, PageHeader } from "@/components/ui";
import {
  CATEGORY_LABEL,
  MACHINE_STATUS_LABEL,
  MACHINE_STATUS_STYLE,
  PRIORITY_LABEL,
  PRIORITY_STYLE,
  STATUS_LABEL,
  STATUS_STYLE,
} from "@/lib/labels";
import { downtimeMs, formatDateTime, formatDuration, machineAvailability, machineStatus, percent, repairMs } from "@/lib/metrics";
import type { MachineStatus } from "@/lib/types";
import { usePlant } from "@/lib/use-plant";

export function Machines({ initialMachineId }: { initialMachineId: string | null }) {
  const { data, error } = usePlant();
  const [line, setLine] = useState("");
  const [status, setStatus] = useState<MachineStatus | "">("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialMachineId);

  if (!data) return <Loading error={error} />;

  const { machines, workOrders, technicians, now } = data;
  const lines = [...new Set(machines.map((m) => m.line))];
  const q = search.trim().toLowerCase();

  const rows = machines
    .map((m) => ({
      machine: m,
      status: machineStatus(m.id, workOrders),
      availability: machineAvailability(m.id, workOrders, now),
      failures: workOrders.filter((w) => w.machineId === m.id).length,
    }))
    .filter((r) => (!line || r.machine.line === line) && (!status || r.status === status))
    .filter((r) => !q || r.machine.name.toLowerCase().includes(q) || r.machine.id.toLowerCase().includes(q));

  const selected = machines.find((m) => m.id === selectedId);
  const history = selected
    ? workOrders
        .filter((w) => w.machineId === selected.id)
        .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
    : [];
  const techById = new Map(technicians.map((t) => [t.id, t]));

  return (
    <>
      <PageHeader title="Máquinas" subtitle={`${machines.length} equipos registrados · historial centralizado de incidencias`} />

      <div className="flex flex-wrap gap-2">
        <select value={line} onChange={(e) => setLine(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm">
          <option value="">Todas las líneas</option>
          {lines.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as MachineStatus | "")} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm">
          <option value="">Todos los estados</option>
          {(Object.keys(MACHINE_STATUS_LABEL) as MachineStatus[]).map((s) => (
            <option key={s} value={s}>{MACHINE_STATUS_LABEL[s]}</option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar equipo"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-orange-500"
        />
        <span className="ml-auto self-center text-sm text-slate-500">{rows.length} resultados</span>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <ul className="max-h-[55vh] space-y-2 overflow-y-auto md:hidden">
          {rows.map(({ machine, status, availability, failures }) => (
            <li key={machine.id}>
              <ListCard active={selectedId === machine.id} onClick={() => setSelectedId(machine.id)}>
                <h3 className="font-medium leading-snug text-slate-900">{machine.name}</h3>
                <p className="mt-0.5 font-mono text-xs text-slate-500">
                  {machine.id} · {machine.line}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className={`h-2 w-2 rounded-full ${MACHINE_STATUS_STYLE[status]}`} />
                  <span className="text-slate-600">{MACHINE_STATUS_LABEL[status]}</span>
                </div>
                <CardMetaGrid>
                  <CardMetaRow label="Fallas">{failures}</CardMetaRow>
                  <CardMetaRow label="Disponibilidad 30d">
                    <span className={availability < 0.97 ? "text-red-600" : availability < 0.99 ? "text-amber-600" : "text-emerald-600"}>
                      {percent(availability)}
                    </span>
                  </CardMetaRow>
                </CardMetaGrid>
              </ListCard>
            </li>
          ))}
        </ul>

        <Card className="hidden max-h-[calc(100vh-14rem)] overflow-auto p-0 md:block">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="sticky top-0 border-b border-slate-200 bg-white text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Equipo</th>
                <th className="font-medium">Línea</th>
                <th className="font-medium">Estado</th>
                <th className="text-right font-medium">Fallas</th>
                <th className="px-4 text-right font-medium">Disponibilidad 30d</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ machine, status, availability, failures }) => (
                <tr
                  key={machine.id}
                  onClick={() => setSelectedId(machine.id)}
                  className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${selectedId === machine.id ? "bg-orange-50" : ""}`}
                >
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-900">{machine.name}</p>
                    <p className="font-mono text-xs text-slate-500">{machine.id} · {machine.assetCode}</p>
                  </td>
                  <td className="text-slate-600">{machine.line}</td>
                  <td>
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className={`h-2 w-2 rounded-full ${MACHINE_STATUS_STYLE[status]}`} />
                      {MACHINE_STATUS_LABEL[status]}
                    </span>
                  </td>
                  <td className="text-right tabular-nums">{failures}</td>
                  <td className={`px-4 text-right font-medium tabular-nums ${availability < 0.97 ? "text-red-600" : availability < 0.99 ? "text-amber-600" : "text-emerald-600"}`}>
                    {percent(availability)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {!selected && <p className="text-center text-sm text-slate-500 md:hidden">Toca un equipo para ver su historial.</p>}

        {selected ? (
          <Card className="h-fit w-full min-w-0 xl:sticky xl:top-8">
            <p className="font-mono text-xs text-slate-500">{selected.id} · {selected.assetCode}</p>
            <h2 className="text-lg font-semibold">{selected.name}</h2>
            <p className="text-sm text-slate-500">{selected.line} · Criticidad {selected.criticality}</p>

            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-slate-200 p-2">
                <dt className="text-xs text-slate-500">Disponibilidad</dt>
                <dd className="font-semibold">{percent(machineAvailability(selected.id, workOrders, now))}</dd>
              </div>
              <div className="rounded-lg border border-slate-200 p-2">
                <dt className="text-xs text-slate-500">Paro total</dt>
                <dd className="font-semibold">{formatDuration(history.reduce((s, w) => s + downtimeMs(w, now), 0))}</dd>
              </div>
              <div className="rounded-lg border border-slate-200 p-2">
                <dt className="text-xs text-slate-500">Incidencias</dt>
                <dd className="font-semibold">{history.length}</dd>
              </div>
            </dl>

            <h3 className="mt-5 text-sm font-medium text-slate-900">Historial</h3>
            <ul className="mt-2 max-h-[50vh] space-y-2 overflow-y-auto">
              {history.map((w) => (
                <li key={w.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-slate-500">{w.id} · {formatDateTime(w.reportedAt)}</span>
                    <Badge className={STATUS_STYLE[w.status]}>{STATUS_LABEL[w.status]}</Badge>
                  </div>
                  <p className="mt-1">
                    <span className="font-medium">{CATEGORY_LABEL[w.category]}:</span> {w.description}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge className={PRIORITY_STYLE[w.priority]}>{PRIORITY_LABEL[w.priority]}</Badge>
                    {w.technicianId && <span>{techById.get(w.technicianId)?.name}</span>}
                    {repairMs(w) !== undefined && <span>Reparación {formatDuration(repairMs(w))}</span>}
                    {w.stopsMachine && <span>Paro {formatDuration(downtimeMs(w, now))}</span>}
                  </p>
                  {w.resolution && <p className="mt-1 text-xs text-slate-600">{w.resolution}</p>}
                </li>
              ))}
              {history.length === 0 && <li className="text-sm text-slate-500">Sin incidencias registradas.</li>}
            </ul>
          </Card>
        ) : (
          <Card className="hidden h-fit text-sm text-slate-500 xl:block">Selecciona un equipo para ver su historial.</Card>
        )}
      </div>
    </>
  );
}
