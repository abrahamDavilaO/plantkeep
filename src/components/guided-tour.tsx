"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const SEEN_KEY = "plantkeep-tour-v1";
const OPEN_EVENT = "plantkeep-open-tour";

const STEPS: { title: string; body: string; href?: string; tour?: string }[] = [
  {
    title: "PlantKeep",
    body: "Demo de mantenimiento para una planta automotriz: fallas, órdenes, preventivo y disponibilidad, sin conexión a SAP.",
    href: "/",
  },
  {
    title: "Panel de control",
    body: "Disponibilidad, horas de paro, MTTR y MTBF. Sirve para abrir la conversación con el estado de la planta.",
    href: "/",
    tour: "nav-panel",
  },
  {
    title: "Reportar falla",
    body: "La pantalla de piso. El operador elige equipo, prioridad y si la máquina quedó detenida.",
    href: "/reportar",
    tour: "nav-reportar",
  },
  {
    title: "Órdenes de trabajo",
    body: "Aquí se asigna al técnico, se inicia la atención y se cierra con la solución y las refacciones.",
    href: "/ordenes",
    tour: "nav-ordenes",
  },
  {
    title: "Preventivo",
    body: "Rutinas por calendario. Al completar una, la siguiente fecha se reprograma sola.",
    href: "/preventivo",
    tour: "nav-preventivo",
  },
  {
    title: "Centro de alertas",
    body: "Preventivos vencidos, órdenes críticas sin responsable y equipos detenidos demasiado tiempo.",
    href: "/alertas",
    tour: "alertas",
  },
  {
    title: "Máquinas",
    body: "Catálogo por línea y criticidad. Desde aquí se ve qué equipos concentran el paro.",
    href: "/maquinas",
    tour: "nav-maquinas",
  },
  {
    title: "Técnicos",
    body: "El equipo de mantenimiento, por especialidad y turno, listo para asignar trabajo.",
    href: "/tecnicos",
    tour: "nav-tecnicos",
  },
  {
    title: "La demo se queda en este navegador",
    body: "Lo que reportes o cierres sigue aquí al recargar. Reiniciar datos demo vuelve al escenario inicial cuando quieras empezar de nuevo.",
    tour: "reset",
  },
];

export function openTour() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function visibleTarget(id: string) {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`);
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }
  return null;
}

function placeCard(rect: DOMRect | null) {
  const width = Math.min(352, window.innerWidth - 32);
  const height = 230;
  if (!rect) {
    return {
      top: Math.max(16, (window.innerHeight - height) / 2),
      left: Math.max(16, (window.innerWidth - width) / 2),
      width,
    };
  }
  const gap = 12;
  let left = rect.right + gap;
  let top = rect.top;
  if (left + width > window.innerWidth - 16) {
    left = Math.max(16, Math.min(rect.left, window.innerWidth - width - 16));
    top = rect.bottom + gap;
  }
  if (top + height > window.innerHeight - 16) top = Math.max(16, rect.top - height - gap);
  if (top + height > window.innerHeight - 16) top = Math.max(16, window.innerHeight - height - 16);
  left = Math.min(Math.max(16, left), window.innerWidth - width - 16);
  return { top, left, width };
}

export function GuidedTour() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [spot, setSpot] = useState<DOMRect | null>(null);

  const close = useCallback((remember: boolean) => {
    if (remember) localStorage.setItem(SEEN_KEY, "done");
    setOpen(false);
  }, []);

  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY) !== "done") {
      const timer = window.setTimeout(() => setOpen(true), 700);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const start = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, start);
    return () => window.removeEventListener(OPEN_EVENT, start);
  }, []);

  useEffect(() => {
    if (!open) return;
    const href = STEPS[step]?.href;
    if (href && pathname !== href) router.push(href);
  }, [open, step, pathname, router]);

  useEffect(() => {
    if (!open) return;
    const current = STEPS[step];
    if (current?.href && pathname !== current.href) return;

    const measure = () => {
      const node = current?.tour ? visibleTarget(current.tour) : null;
      node?.scrollIntoView({ block: "nearest", inline: "nearest" });
      setSpot(node ? node.getBoundingClientRect() : null);
    };
    measure();
    const timer = window.setTimeout(measure, 60);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step, pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
      if (event.key === "ArrowRight") setStep((current) => Math.min(STEPS.length - 1, current + 1));
      if (event.key === "ArrowLeft") setStep((current) => Math.max(0, current - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  const current = STEPS[step];
  const card = placeCard(spot);
  const last = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50">
      {spot ? (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-orange-400"
          style={{
            top: spot.top - 4,
            left: spot.left - 4,
            width: spot.width + 8,
            height: spot.height + 8,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900/55" />
      )}
      <div className="absolute inset-0" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plantkeep-tour-title"
        className="absolute rounded-xl border border-slate-200 bg-white p-4 text-slate-800 shadow-xl"
        style={{ top: card.top, left: card.left, width: card.width }}
      >
        <p className="text-xs font-medium text-orange-600">
          Recorrido {step + 1} de {STEPS.length}
        </p>
        <h2 id="plantkeep-tour-title" className="mt-1 text-base font-semibold text-slate-900">
          {current.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{current.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={() => close(true)} className="text-sm text-slate-500 hover:text-slate-800">
            Saltar
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((currentStep) => currentStep - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Atrás
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? close(true) : setStep((currentStep) => currentStep + 1))}
              className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
            >
              {last ? "Empezar" : "Siguiente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
