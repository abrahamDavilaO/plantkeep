import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Kpi({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "good" | "bad" | "warn" }) {
  const color = { default: "text-slate-900", good: "text-emerald-600", bad: "text-red-600", warn: "text-amber-600" }[tone];
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums sm:text-3xl ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}

export function Badge({ children, className }: { children: ReactNode; className: string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-transparent ${className}`}>{children}</span>;
}

export function Loading({ error }: { error?: string | null }) {
  return (
    <div className="grid h-64 place-items-center text-sm text-slate-500">
      {error ? `No se pudo cargar la información: ${error}` : "Cargando información de planta…"}
    </div>
  );
}
