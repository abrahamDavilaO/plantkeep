"use client";

import Link from "next/link";
import { useState } from "react";
import { CardMetaGrid, CardMetaRow, ListCard } from "@/components/list-cards";
import { Badge, Card, Loading, PageHeader } from "@/components/ui";
import { ALERT_KIND_LABEL, ALERT_SEVERITY_STYLE } from "@/lib/alert-labels";
import { formatDateTime } from "@/lib/metrics";
import { usePlant } from "@/lib/use-plant";

export function AlertsCenter() {
  const { data, error, refresh } = usePlant(10_000);
  const [notifyOn, setNotifyOn] = useState(() =>
    typeof window === "undefined" ? false : localStorage.getItem("plantkeep.notify") === "1",
  );
  const [soundOn, setSoundOn] = useState(() =>
    typeof window === "undefined" ? false : localStorage.getItem("plantkeep.alertSound") === "1",
  );

  if (!data) return <Loading error={error} />;

  const techById = new Map(data.technicians.map((t) => [t.id, t]));
  const critical = data.alerts.filter((a) => a.severity === "critical").length;
  const warning = data.alerts.filter((a) => a.severity === "warning").length;

  async function enablePush() {
    if (typeof Notification === "undefined") {
      alert("Este navegador no soporta notificaciones.");
      return;
    }
    if (await Notification.requestPermission() === "granted") {
      localStorage.setItem("plantkeep.notify", "1");
      setNotifyOn(true);
      sessionStorage.removeItem("plantkeep.seenAlerts");
      refresh();
    }
  }

  function toggleSound() {
    const next = !soundOn;
    localStorage.setItem("plantkeep.alertSound", next ? "1" : "0");
    setSoundOn(next);
  }

  return (
    <>
      <PageHeader
        title="Centro de alertas"
        subtitle="Preventivos, órdenes críticas, paros prolongados y técnicos sin iniciar atención."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={enablePush}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${notifyOn ? "bg-emerald-100 text-emerald-800" : "bg-slate-900 text-white"}`}
            >
              {notifyOn ? "Push activo" : "Activar notificaciones"}
            </button>
            <button
              type="button"
              onClick={toggleSound}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Sonido urgente: {soundOn ? "Sí" : "No"}
            </button>
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm sm:gap-4">
        <Card className="py-3">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-2xl font-semibold">{data.alerts.length}</p>
        </Card>
        <Card className="py-3">
          <p className="text-xs text-slate-500">Críticas</p>
          <p className="text-2xl font-semibold text-red-600">{critical}</p>
        </Card>
        <Card className="py-3">
          <p className="text-xs text-slate-500">Advertencias</p>
          <p className="text-2xl font-semibold text-amber-600">{warning}</p>
        </Card>
      </div>

      <Card className="mb-4 border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-700">
          <strong>Canales en esta demo:</strong> listado en tiempo real, campana en el menú,{" "}
          <strong>notificaciones del sistema</strong> (escritorio/móvil) y{" "}
          <strong>beep</strong> en alertas críticas. El correo del técnico indica el destinatario de un envío futuro
          (SMTP / Teams).
        </p>
      </Card>

      <ul className="space-y-2">
        {data.alerts.map((a) => (
          <li key={a.id}>
            <ListCard href={a.href ?? "/alertas"}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={ALERT_SEVERITY_STYLE[a.severity]}>
                  {a.severity === "critical" ? "Crítica" : a.severity === "warning" ? "Advertencia" : "Info"}
                </Badge>
                <Badge className="bg-slate-100 text-slate-700">{ALERT_KIND_LABEL[a.kind]}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-800">{a.message}</p>
              <CardMetaGrid>
                <CardMetaRow label="Referencia">{formatDateTime(a.dueAt)}</CardMetaRow>
                <CardMetaRow label="Notificar a">
                  {a.technicianIds
                    .slice(0, 4)
                    .map((id) => techById.get(id)?.name ?? id)
                    .join(", ")}
                  {a.technicianIds.length > 4 ? "…" : ""}
                </CardMetaRow>
              </CardMetaGrid>
            </ListCard>
          </li>
        ))}
        {data.alerts.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-500">No hay alertas activas en este momento.</p>
        )}
      </ul>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/preventivo" className="text-orange-600 hover:underline">
          Calendario preventivo
        </Link>
        {" · "}
        <Link href="/ordenes" className="text-orange-600 hover:underline">
          Órdenes de trabajo
        </Link>
      </p>
    </>
  );
}
