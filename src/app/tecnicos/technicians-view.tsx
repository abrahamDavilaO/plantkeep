"use client";

import { useState } from "react";
import { CardMetaGrid, CardMetaRow, ListCard } from "@/components/list-cards";
import { ReadOnlyNote, useEditAccess } from "@/components/edit-access";
import { Card, Loading, PageHeader } from "@/components/ui";
import { api, usePlant } from "@/lib/use-plant";

const SHIFTS = ["Matutino", "Vespertino", "Nocturno"] as const;

export function TechniciansView() {
  const { data, error, refresh } = usePlant();
  const { canEdit } = useEditAccess();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [shift, setShift] = useState<(typeof SHIFTS)[number]>("Matutino");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!data) return <Loading error={error} />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await api("/api/technicians", "POST", { name, specialty, shift, email: email || undefined, phone: phone || undefined });
      setName("");
      setSpecialty("");
      setEmail("");
      setPhone("");
      refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Personal de mantenimiento"
        subtitle="Aquí se registran técnicos y responsables. Reciben alertas de preventivos y aparecen al asignar órdenes correctivas."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-2 lg:hidden">
          {data.technicians.map((t) => (
            <li key={t.id}>
              <ListCard>
                <p className="font-medium text-slate-900">{t.name}</p>
                <p className="font-mono text-xs text-slate-500">{t.id}</p>
                <CardMetaGrid>
                  <CardMetaRow label="Especialidad">{t.specialty}</CardMetaRow>
                  <CardMetaRow label="Turno">{t.shift}</CardMetaRow>
                  <CardMetaRow label="Correo">{t.email}</CardMetaRow>
                  {t.phone && <CardMetaRow label="Teléfono">{t.phone}</CardMetaRow>}
                </CardMetaGrid>
              </ListCard>
            </li>
          ))}
        </ul>

        <Card className="hidden overflow-x-auto p-0 lg:block">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="font-medium">Nombre</th>
                <th className="font-medium">Especialidad</th>
                <th className="font-medium">Turno</th>
                <th className="px-4 font-medium">Contacto alertas</th>
              </tr>
            </thead>
            <tbody>
              {data.technicians.map((t) => (
                <tr key={t.id} className="border-b border-slate-100">
                  <td className="px-4 py-2.5 font-mono text-xs">{t.id}</td>
                  <td className="font-medium">{t.name}</td>
                  <td className="text-slate-600">{t.specialty}</td>
                  <td className="text-slate-600">{t.shift}</td>
                  <td className="px-4 text-xs text-slate-500">
                    {t.email}
                    {t.phone && <span className="block">{t.phone}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Agregar técnico</h2>
          <form onSubmit={submit} className="mt-3 space-y-3 text-sm">
            <label className="block">
              <span className="text-slate-600">Nombre</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-slate-600">Especialidad</span>
              <input
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Mecánica, Eléctrica…"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-slate-600">Turno</span>
              <select value={shift} onChange={(e) => setShift(e.target.value as (typeof SHIFTS)[number])} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                {SHIFTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-slate-600">Correo (alertas)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="opcional"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-slate-600">Teléfono</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="opcional"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            {formError && <p className="text-red-600">{formError}</p>}
            <ReadOnlyNote />
            <button
              type="submit"
              disabled={!canEdit || busy}
              className="w-full rounded-lg bg-orange-500 py-2.5 font-medium text-white hover:bg-orange-600 disabled:bg-slate-300"
            >
              {busy ? "Guardando…" : "Registrar técnico"}
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-500">
            En producción, el correo dispararía notificaciones (SMTP, Teams o WhatsApp). En esta demo las alertas se muestran en la app y, si activas permisos, como notificación del navegador.
          </p>
        </Card>
      </div>
    </>
  );
}
