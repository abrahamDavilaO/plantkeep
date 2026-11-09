import type {
  FailureCategory,
  MachineStatus,
  Priority,
  WorkOrderStatus,
} from "./types";

export const CATEGORY_LABEL: Record<FailureCategory, string> = {
  mecanica: "Mecánica",
  electrica: "Eléctrica",
  hidraulica: "Hidráulica",
  neumatica: "Neumática",
  control: "Control / PLC",
  seguridad: "Seguridad",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

export const PRIORITY_STYLE: Record<Priority, string> = {
  baja: "bg-slate-100 text-slate-700",
  media: "bg-sky-100 text-sky-800",
  alta: "bg-amber-100 text-amber-800",
  critica: "bg-red-100 text-red-800",
};

export const STATUS_LABEL: Record<WorkOrderStatus, string> = {
  abierta: "Abierta",
  asignada: "Asignada",
  en_proceso: "En proceso",
  completada: "Completada",
};

export const STATUS_STYLE: Record<WorkOrderStatus, string> = {
  abierta: "bg-red-50 text-red-700 ring-red-200",
  asignada: "bg-amber-50 text-amber-700 ring-amber-200",
  en_proceso: "bg-blue-50 text-blue-700 ring-blue-200",
  completada: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export const MACHINE_STATUS_LABEL: Record<MachineStatus, string> = {
  operando: "Operando",
  detenida: "Detenida",
  en_mantenimiento: "En mantenimiento",
};

export const MACHINE_STATUS_STYLE: Record<MachineStatus, string> = {
  operando: "bg-emerald-500",
  detenida: "bg-red-500",
  en_mantenimiento: "bg-blue-500",
};
