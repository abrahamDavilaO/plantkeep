import type { PlantAlertKind } from "./types";

export const ALERT_KIND_LABEL: Record<PlantAlertKind, string> = {
  preventivo_vencido: "Preventivo vencido",
  preventivo_proximo: "Preventivo próximo",
  ot_critica_sin_asignar: "OT crítica sin asignar",
  ot_alta_sin_asignar: "OT alta sin asignar",
  ot_paro_prolongado: "Paro prolongado",
  ot_sin_atencion: "Sin iniciar atención",
};

export const ALERT_SEVERITY_STYLE = {
  critical: "bg-red-100 text-red-800",
  warning: "bg-amber-100 text-amber-900",
  info: "bg-sky-100 text-sky-900",
} as const;
