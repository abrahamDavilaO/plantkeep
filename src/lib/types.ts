export type Criticality = "A" | "B" | "C";

export type Machine = {
  id: string;
  name: string;
  line: string;
  assetCode: string;
  criticality: Criticality;
};

export type Technician = {
  id: string;
  name: string;
  specialty: string;
  shift: "Matutino" | "Vespertino" | "Nocturno";
  /** Canal para alertas (correo / SMS futuro). */
  email?: string;
  phone?: string;
};

export type PreventivePlan = {
  id: string;
  machineId: string;
  title: string;
  description?: string;
  /** Días entre ejecuciones tras completar. */
  intervalDays: number;
  nextDueAt: string;
  technicianIds: string[];
  notifyDaysBefore: number;
  lastCompletedAt?: string;
  active: boolean;
};

export type PlantAlertKind =
  | "preventivo_vencido"
  | "preventivo_proximo"
  | "ot_critica_sin_asignar"
  | "ot_alta_sin_asignar"
  | "ot_paro_prolongado"
  | "ot_sin_atencion";

export type PlantAlert = {
  id: string;
  kind: PlantAlertKind;
  severity: "critical" | "warning" | "info";
  message: string;
  technicianIds: string[];
  preventiveId?: string;
  workOrderId?: string;
  href?: string;
  dueAt: string;
  createdAt: string;
};

export type Priority = "baja" | "media" | "alta" | "critica";

export type FailureCategory =
  | "mecanica"
  | "electrica"
  | "hidraulica"
  | "neumatica"
  | "control"
  | "seguridad";

export type WorkOrderStatus = "abierta" | "asignada" | "en_proceso" | "completada";

export type WorkOrder = {
  id: string;
  machineId: string;
  category: FailureCategory;
  priority: Priority;
  description: string;
  stopsMachine: boolean;
  reportedBy: string;
  reportedAt: string;
  status: WorkOrderStatus;
  technicianId?: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  resolution?: string;
  partsUsed?: string;
};

export type Db = {
  createdAt: string;
  /** Sube al reiniciar la demo. Gana sobre cualquier revisión anterior. */
  epoch: number;
  /** Sube con cada cambio dentro de la misma época. */
  revision: number;
  machines: Machine[];
  technicians: Technician[];
  workOrders: WorkOrder[];
  preventivePlans: PreventivePlan[];
  counters: { workOrder: number; technician: number; preventive: number };
};

export type MachineStatus = "operando" | "detenida" | "en_mantenimiento";
