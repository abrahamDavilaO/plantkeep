"use client";

import Link from "next/link";
import { CardMetaGrid, CardMetaRow, ListCard } from "@/components/list-cards";
import { Badge, Card, Kpi, Loading, PageHeader } from "@/components/ui";
import { CATEGORY_LABEL, PRIORITY_LABEL, PRIORITY_STYLE, STATUS_LABEL, STATUS_STYLE } from "@/lib/labels";
import {
  WINDOW_DAYS,
  computeKpis,
  dailyDowntime,
  downtimeByLine,
  downtimeMs,
  formatDateTime,
  formatDuration,
  percent,
} from "@/lib/metrics";
import { usePlant } from "@/lib/use-plant";

export function Dashboard() {
  const { data, error } = usePlant();
  if (!data) return <Loading error={error} />;

  const { machines, workOrders, technicians, now } = data;
  const kpis = computeKpis(machines, workOrders, now);
  const lines = downtimeByLine(machines, workOrders, now).sort((a, b) => b.hours - a.hours);
  const daily = dailyDowntime(workOrders, now);
  const maxLineHours = Math.max(1, ...lines.map((l) => l.hours));
  const maxDaily = Math.max(1, ...daily.map((d) => d.hours));
  const machineById = new Map(machines.map((m) => [m.id, m]));
  const techById = new Map(technicians.map((t) => [t.id, t]));
  const open = workOrders
    .filter((w) => w.status !== "completada")
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));

  const topMachines = [...machines]
    .map((m) => ({
      machine: m,
      hours: workOrders.filter((w) => w.machineId === m.id).reduce((s, w) => s + downtimeMs(w, now, now - WINDOW_DAYS * 86_400_000), 0) / 3_600_000,
      failures: workOrders.filter((w) => w.machineId === m.id).length,
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Panel de mantenimiento"
        subtitle={`Indicadores de los últimos ${WINDOW_DAYS} días · actualizado ${formatDateTime(new Date(now).toISOString())}`}
        actions={
          <Link href="/reportar" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
            Reportar falla
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Disponibilidad de planta" value={percent(kpis.availability, 2)} hint="Tiempo operando / tiempo planeado" tone={kpis.availability >= 0.98 ? "good" : "warn"} />
        <Kpi label="Tiempo inactivo" value={`${kpis.downtimeHours.toFixed(0)} h`} hint={`${kpis.failures} fallas reportadas`} tone="bad" />
        <Kpi label="MTTR" value={`${kpis.mttrHours.toFixed(1)} h`} hint={`Respuesta promedio: ${kpis.responseMinutes.toFixed(0)} min`} />
        <Kpi label="MTBF" value={`${kpis.mtbfHours.toFixed(0)} h`} hint="Tiempo medio entre fallas" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-slate-900">Estado de equipos</p>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="bg-emerald-500" style={{ width: `${(kpis.operating / machines.length) * 100}%` }} />
            <div className="bg-blue-500" style={{ width: `${(kpis.inMaintenance / machines.length) * 100}%` }} />
            <div className="bg-red-500" style={{ width: `${(kpis.stopped / machines.length) * 100}%` }} />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            {[
              ["Operando", kpis.operating, "bg-emerald-500"],
              ["En mantenimiento", kpis.inMaintenance, "bg-blue-500"],
              ["Detenidas", kpis.stopped, "bg-red-500"],
            ].map(([label, value, color]) => (
              <div key={label as string} className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  {label}
                </dt>
                <dd className="font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{kpis.openOrders}</span> órdenes de trabajo abiertas
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <p className="text-sm font-medium text-slate-900">Horas de paro por día (últimos 14 días)</p>
          <div className="-mx-1 mt-4 overflow-x-auto px-1 pb-1">
          <div className="flex h-40 min-w-[280px] items-end gap-1 sm:h-44">
            {daily.map((d) => (
              <div key={d.start} className="group flex h-full flex-1 flex-col justify-end">
                <div
                  className="rounded-t bg-orange-400 transition-colors group-hover:bg-orange-500"
                  style={{ height: `${(d.hours / maxDaily) * 100}%` }}
                  title={`${d.hours.toFixed(1)} h · ${d.failures} fallas`}
                />
                <span className="mt-1 text-center text-[10px] text-slate-400">
                  {new Date(d.start).toLocaleDateString("es-MX", { day: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-sm font-medium text-slate-900">Disponibilidad por línea</p>
          <div className="mt-4 space-y-3">
            {lines.map((l) => (
              <div key={l.line}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">{l.line}</span>
                  <span className="tabular-nums text-slate-500">
                    {l.hours.toFixed(0)} h paro · <span className="font-medium text-slate-900">{percent(l.availability)}</span>
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-slate-700" style={{ width: `${(l.hours / maxLineHours) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-900">Equipos con más tiempo inactivo</p>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {topMachines.map(({ machine, hours, failures }) => (
                <tr key={machine.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2">
                    <Link href={`/maquinas?id=${machine.id}`} className="font-medium text-slate-900 hover:underline">
                      {machine.name}
                    </Link>
                    <p className="text-xs text-slate-500">{machine.id} · {machine.line}</p>
                  </td>
                  <td className="py-2 text-right tabular-nums text-slate-500">{failures} fallas</td>
                  <td className="py-2 text-right font-semibold tabular-nums">{hours.toFixed(1)} h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-900">Incidencias activas</p>
          <Link href="/ordenes" className="shrink-0 text-sm text-orange-600 hover:underline">Ver todas</Link>
        </div>

        <ul className="mt-3 space-y-2 md:hidden">
          {open.map((w) => (
            <li key={w.id}>
              <ListCard href={`/ordenes?ot=${encodeURIComponent(w.id)}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-slate-600">{w.id}</span>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Badge className={PRIORITY_STYLE[w.priority]}>{PRIORITY_LABEL[w.priority]}</Badge>
                    <Badge className={STATUS_STYLE[w.status]}>{STATUS_LABEL[w.status]}</Badge>
                  </div>
                </div>
                <p className="mt-2 font-medium leading-snug text-slate-900">{machineById.get(w.machineId)?.name}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {CATEGORY_LABEL[w.category]} · {w.description}
                </p>
                <CardMetaGrid>
                  <CardMetaRow label="Responsable">
                    {w.technicianId ? techById.get(w.technicianId)?.name : "Sin asignar"}
                  </CardMetaRow>
                  <CardMetaRow label="Tiempo abierto">
                    {formatDuration(now - Date.parse(w.reportedAt))}
                  </CardMetaRow>
                </CardMetaGrid>
              </ListCard>
            </li>
          ))}
          {open.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Sin incidencias abiertas</p>}
        </ul>

        <table className="mt-3 hidden w-full min-w-[640px] text-left text-sm md:table">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="py-2 font-medium">OT</th>
              <th className="font-medium">Equipo</th>
              <th className="font-medium">Falla</th>
              <th className="font-medium">Prioridad</th>
              <th className="font-medium">Estado</th>
              <th className="font-medium">Responsable</th>
              <th className="text-right font-medium">Tiempo abierto</th>
            </tr>
          </thead>
          <tbody>
            {open.map((w) => (
              <tr key={w.id} className="border-t border-slate-100">
                <td className="py-2.5 font-mono text-xs">{w.id}</td>
                <td>{machineById.get(w.machineId)?.name}</td>
                <td className="text-slate-600">{CATEGORY_LABEL[w.category]} · {w.description}</td>
                <td><Badge className={PRIORITY_STYLE[w.priority]}>{PRIORITY_LABEL[w.priority]}</Badge></td>
                <td><Badge className={STATUS_STYLE[w.status]}>{STATUS_LABEL[w.status]}</Badge></td>
                <td className="text-slate-600">{w.technicianId ? techById.get(w.technicianId)?.name : "Sin asignar"}</td>
                <td className="text-right tabular-nums">{formatDuration(now - Date.parse(w.reportedAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
