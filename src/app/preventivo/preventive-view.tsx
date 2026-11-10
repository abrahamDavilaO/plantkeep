"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ReadOnlyNote, useEditAccess } from "@/components/edit-access";
import { Badge, Card, Loading, PageHeader } from "@/components/ui";
import { ALERT_KIND_LABEL, ALERT_SEVERITY_STYLE } from "@/lib/alert-labels";
import { formatDateTime } from "@/lib/metrics";
import { plansDueOnDay, startOfDay } from "@/lib/preventive";
import type { PreventivePlan } from "@/lib/types";
import { api, usePlant } from "@/lib/use-plant";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startWeekday = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { day: number | null; ts: number | null }[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null, ts: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const ts = startOfDay(new Date(year, month, d));
    cells.push({ day: d, ts });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, ts: null });
  return cells;
}

export function PreventiveView() {
  const { data, error, refresh } = usePlant(15_000);
  const { canEdit } = useEditAccess();
  const [viewYear, setViewYear] = useState<number | null>(null);
  const [viewMonth, setViewMonth] = useState<number | null>(null);
  const [machineId, setMachineId] = useState("");
  const [title, setTitle] = useState("");
  const [intervalDays, setIntervalDays] = useState(30);
  const [nextDue, setNextDue] = useState("");
  const [techIds, setTechIds] = useState<string[]>([]);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState(3);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data || viewYear !== null) return;
    queueMicrotask(() => {
      const d = new Date(data.now);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    });
  }, [data, viewYear]);

  const plans = data?.preventivePlans.filter((p) => p.active) ?? [];
  const cells = useMemo(() => {
    if (viewYear === null || viewMonth === null) return [];
    return monthMatrix(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  if (!data || viewYear === null || viewMonth === null) return <Loading error={error} />;

  const today = new Date(data.now);
  const calendarYear = viewYear;
  const calendarMonth = viewMonth;
  const machineById = new Map(data.machines.map((m) => [m.id, m]));
  const techById = new Map(data.technicians.map((t) => [t.id, t]));

  function shiftMonth(delta: number) {
    const d = new Date(calendarYear, calendarMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  async function completePlan(id: string) {
    setBusy(true);
    try {
      await api(`/api/preventive/${id}`, "PATCH", { action: "complete" });
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!machineId || !title.trim() || !nextDue || techIds.length === 0) return;
    setBusy(true);
    try {
      const dueIso = new Date(`${nextDue}T08:00:00`).toISOString();
      await api("/api/preventive", "POST", {
        machineId,
        title,
        intervalDays,
        nextDueAt: dueIso,
        technicianIds: techIds,
        notifyDaysBefore,
      });
      setTitle("");
      setNextDue("");
      setTechIds([]);
      refresh();
    } finally {
      setBusy(false);
    }
  }

  function toggleTech(id: string) {
    setTechIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const now = data.now;

  function planChip(plan: PreventivePlan) {
    const due = Date.parse(plan.nextDueAt);
    const overdue = due < now;
    const soon = !overdue && due - now < plan.notifyDaysBefore * 86_400_000;
    return (
      <button
        key={plan.id}
        type="button"
        title={plan.title}
        onClick={() => completePlan(plan.id)}
        disabled={busy}
        className={`mb-0.5 block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium ${
          overdue ? "bg-red-100 text-red-800" : soon ? "bg-amber-100 text-amber-900" : "bg-sky-100 text-sky-900"
        }`}
      >
        {plan.title}
      </button>
    );
  }

  const monthLabel = new Date(calendarYear, calendarMonth, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  return (
    <>
      <PageHeader
        title="Mantenimiento preventivo"
        subtitle="Calendario de rutinas, responsables y alertas antes del vencimiento."
        actions={
          <Link href="/alertas" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Centro de alertas
          </Link>
        }
      />

      <Card id="alertas" className="mb-4 border-amber-200 bg-amber-50/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Preventivos ({data.alerts.filter((a) => a.kind.startsWith("preventivo")).length})
          </h2>
          <Link href="/alertas" className="text-sm text-orange-600 hover:underline">
            Todas las alertas (OT, paros…)
          </Link>
        </div>
        {data.alerts.filter((a) => a.kind.startsWith("preventivo")).length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No hay preventivos próximos o vencidos según la configuración actual.</p>
        ) : (
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
            {data.alerts
              .filter((a) => a.kind.startsWith("preventivo"))
              .map((a) => (
              <li key={a.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-amber-200/80 bg-white px-3 py-2">
                <div>
                  <div className="flex flex-wrap gap-1">
                    <Badge className={ALERT_SEVERITY_STYLE[a.severity]}>{ALERT_KIND_LABEL[a.kind]}</Badge>
                  </div>
                  <p className="mt-1 text-slate-800">{a.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Vence: {formatDateTime(a.dueAt)} · {a.technicianIds.map((id) => techById.get(id)?.name ?? id).join(", ")}
                  </p>
                </div>
                {a.preventiveId && (
                  <Link
                    href={`/maquinas?id=${data.preventivePlans.find((p) => p.id === a.preventiveId)?.machineId ?? ""}`}
                    className="text-xs text-orange-600 hover:underline"
                  >
                    Ver equipo
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold capitalize text-slate-900">{monthLabel}</h2>
            <div className="flex gap-1">
              <button type="button" onClick={() => shiftMonth(-1)} className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">
                ‹
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date(data.now);
                  setViewYear(d.getFullYear());
                  setViewMonth(d.getMonth());
                }}
                className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50"
              >
                Hoy
              </button>
              <button type="button" onClick={() => shiftMonth(1)} className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">
                ›
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">Clic en una rutina del día para marcarla como completada y reprogramar.</p>
          <div className="-mx-1 overflow-x-auto px-1">
          <div className="min-w-[300px]">
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
            {WEEKDAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((cell, i) => {
              if (cell.day === null || cell.ts === null) return <div key={i} className="min-h-[4.5rem] rounded-lg bg-slate-50/50" />;
              const duePlans = plansDueOnDay(plans, cell.ts);
              const isToday = cell.ts === startOfDay(today);
              return (
                <div
                  key={i}
                  className={`min-h-[4.5rem] rounded-lg border p-1 text-left ${isToday ? "border-orange-400 bg-orange-50/40" : "border-slate-200 bg-white"}`}
                >
                  <div className="text-[11px] font-semibold text-slate-700">{cell.day}</div>
                  <div className="mt-0.5">{duePlans.map(planChip)}</div>
                </div>
              );
            })}
          </div>
          </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Nueva rutina preventiva</h2>
          <form onSubmit={createPlan} className="mt-3 space-y-3 text-sm">
            <label className="block">
              <span className="text-slate-600">Equipo</span>
              <select required value={machineId} onChange={(e) => setMachineId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="">Selecciona…</option>
                {data.machines.slice(0, 80).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id} · {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-slate-600">Actividad</span>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Lubricación, inspección…" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-slate-600">Cada (días)</span>
                <input
                  type="number"
                  min={1}
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="text-slate-600">Avisar (días antes)</span>
                <input
                  type="number"
                  min={0}
                  value={notifyDaysBefore}
                  onChange={(e) => setNotifyDaysBefore(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-slate-600">Próxima fecha</span>
              <input
                required
                type="date"
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <fieldset>
              <legend className="text-slate-600">Técnicos a notificar</legend>
              <div className="mt-2 max-h-36 space-y-1 overflow-y-auto">
                {data.technicians.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={techIds.includes(t.id)} onChange={() => toggleTech(t.id)} />
                    {t.name} ({t.specialty})
                  </label>
                ))}
              </div>
            </fieldset>
            <ReadOnlyNote />
            <button type="submit" disabled={!canEdit || busy} className="w-full rounded-lg bg-orange-500 py-2.5 font-medium text-white hover:bg-orange-600 disabled:bg-slate-300">
              Programar
            </button>
          </form>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="text-sm font-semibold text-slate-900">Próximos 14 días</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {plans
            .filter((p) => {
              const t = Date.parse(p.nextDueAt);
              return t >= data.now - 86_400_000 && t <= data.now + 14 * 86_400_000;
            })
            .sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt))
            .map((p) => {
              const m = machineById.get(p.machineId);
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2">
                  <div>
                    <span className="font-medium">{p.title}</span>
                    <span className="text-slate-500"> · {m?.name}</span>
                    <p className="text-xs text-slate-500">{formatDateTime(p.nextDueAt)} · cada {p.intervalDays} días</p>
                  </div>
                  <button type="button" disabled={!canEdit || busy} onClick={() => completePlan(p.id)} className="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50 disabled:opacity-50">
                    Completar
                  </button>
                </li>
              );
            })}
        </ul>
      </Card>
    </>
  );
}
