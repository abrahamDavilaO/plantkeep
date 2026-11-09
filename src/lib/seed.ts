import { createDefaultPreventivePlans } from "./migrate-db";
import type {
  Criticality,
  Db,
  FailureCategory,
  Machine,
  Priority,
  Technician,
  WorkOrder,
} from "./types";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LINES: { name: string; count: number; types: string[] }[] = [
  {
    name: "Estampado",
    count: 30,
    types: ["Prensa hidráulica 800t", "Prensa mecánica 400t", "Alimentador de rollo", "Transfer de prensas"],
  },
  {
    name: "Soldadura",
    count: 50,
    types: ["Robot de soldadura por puntos", "Robot MIG", "Mesa de sujeción", "Pinza servo"],
  },
  {
    name: "Pintura",
    count: 25,
    types: ["Robot de pintura", "Horno de curado", "Cabina de pintura", "Tanque de fosfatizado"],
  },
  {
    name: "Ensamble final",
    count: 45,
    types: ["Atornillador automático", "Transportador aéreo", "Elevador de carrocería", "Estación de llenado de fluidos"],
  },
  {
    name: "Motores",
    count: 30,
    types: ["Centro de maquinado CNC", "Torno CNC", "Banco de pruebas", "Lavadora industrial"],
  },
  {
    name: "Inyección de plástico",
    count: 20,
    types: ["Inyectora 1200t", "Inyectora 650t", "Chiller", "Secador de resina"],
  },
];

const TECHNICIANS: Technician[] = [
  { id: "T-01", name: "Luis Hernández", specialty: "Mecánica", shift: "Matutino", email: "t-01@planta.local" },
  { id: "T-02", name: "María González", specialty: "Eléctrica", shift: "Matutino", email: "t-02@planta.local" },
  { id: "T-03", name: "Jorge Ramírez", specialty: "Robótica / PLC", shift: "Matutino", email: "t-03@planta.local" },
  { id: "T-04", name: "Ana Torres", specialty: "Hidráulica", shift: "Vespertino", email: "t-04@planta.local" },
  { id: "T-05", name: "Carlos Mendoza", specialty: "Mecánica", shift: "Vespertino", email: "t-05@planta.local" },
  { id: "T-06", name: "Sofía Castillo", specialty: "Eléctrica", shift: "Vespertino", email: "t-06@planta.local" },
  { id: "T-07", name: "Ricardo Flores", specialty: "Robótica / PLC", shift: "Nocturno", email: "t-07@planta.local" },
  { id: "T-08", name: "Daniela Ruiz", specialty: "Neumática", shift: "Nocturno", email: "t-08@planta.local" },
];

const OPERATORS = [
  "Pedro Sánchez",
  "Laura Jiménez",
  "Miguel Ortiz",
  "Fernanda Vega",
  "Raúl Morales",
  "Patricia Cruz",
  "Héctor Navarro",
];

const DESCRIPTIONS: Record<FailureCategory, string[]> = {
  mecanica: ["Ruido anormal en reductor", "Banda desalineada", "Rodamiento con vibración alta", "Atascamiento de pieza"],
  electrica: ["Motor no arranca", "Disparo de térmico", "Sensor inductivo sin señal", "Falla en variador de frecuencia"],
  hidraulica: ["Fuga de aceite en cilindro", "Presión baja en unidad hidráulica", "Temperatura alta de aceite"],
  neumatica: ["Fuga de aire en válvula", "Cilindro neumático lento", "Presión de aire insuficiente"],
  control: ["Error de comunicación con PLC", "Robot en alarma de colisión", "HMI congelada", "Pérdida de programa"],
  seguridad: ["Cortina de luz sin funcionar", "Paro de emergencia dañado", "Guarda de seguridad abierta"],
};

const RESOLUTIONS = [
  "Se reemplazó el componente dañado y se probó el equipo.",
  "Se ajustó y lubricó; equipo operando normal.",
  "Se reinició el controlador y se recalibró.",
  "Se corrigió la conexión y se verificó el circuito.",
];

const PARTS = ["Rodamiento 6205", "Sensor inductivo M18", "Sello hidráulico", "Válvula 5/2", "Contactor 32A", ""];

const CATEGORIES = Object.keys(DESCRIPTIONS) as FailureCategory[];

export function createSeed(now = Date.now()): Db {
  const rand = mulberry32(42);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  const machines: Machine[] = [];
  let n = 1;
  for (const line of LINES) {
    for (let i = 0; i < line.count; i++) {
      const type = line.types[i % line.types.length];
      const r = rand();
      const criticality: Criticality = r < 0.25 ? "A" : r < 0.7 ? "B" : "C";
      machines.push({
        id: `M-${String(n).padStart(3, "0")}`,
        name: `${type} ${Math.floor(i / line.types.length) + 1}`,
        line: line.name,
        assetCode: `EQ-${String(10004000 + n)}`,
        criticality,
      });
      n++;
    }
  }

  const HOUR = 3_600_000;
  const MIN = 60_000;
  const workOrders: WorkOrder[] = [];
  let woCounter = 1000;

  for (let i = 0; i < 260; i++) {
    const machine = pick(machines);
    const category = pick(CATEGORIES);
    const pr = rand();
    const priority: Priority = pr < 0.1 ? "critica" : pr < 0.35 ? "alta" : pr < 0.75 ? "media" : "baja";
    const reportedAt = now - Math.floor(rand() * 30 * 24 * HOUR) - HOUR * 3;
    const responseMin = 5 + Math.floor(rand() * (priority === "critica" ? 20 : 90));
    const repairMin = 15 + Math.floor(rand() * 240);
    const tech = pick(TECHNICIANS);
    const part = pick(PARTS);

    const wo: WorkOrder = {
      id: `OT-${++woCounter}`,
      machineId: machine.id,
      category,
      priority,
      description: pick(DESCRIPTIONS[category]),
      stopsMachine: priority === "critica" || priority === "alta" || rand() < 0.3,
      reportedBy: pick(OPERATORS),
      reportedAt: new Date(reportedAt).toISOString(),
      status: "completada",
      technicianId: tech.id,
      assignedAt: new Date(reportedAt + Math.floor(responseMin / 2) * MIN).toISOString(),
      startedAt: new Date(reportedAt + responseMin * MIN).toISOString(),
      completedAt: new Date(reportedAt + (responseMin + repairMin) * MIN).toISOString(),
      resolution: pick(RESOLUTIONS),
      partsUsed: part || undefined,
    };
    workOrders.push(wo);
  }

  const openStates: WorkOrder["status"][] = ["abierta", "abierta", "asignada", "asignada", "en_proceso", "en_proceso", "en_proceso", "abierta"];
  openStates.forEach((status, i) => {
    const machine = machines[(i * 23 + 7) % machines.length];
    const category = CATEGORIES[i % CATEGORIES.length];
    const reportedAt = now - (20 + i * 25) * MIN;
    const tech = TECHNICIANS[i % TECHNICIANS.length];
    workOrders.push({
      id: `OT-${++woCounter}`,
      machineId: machine.id,
      category,
      priority: i % 3 === 0 ? "critica" : i % 3 === 1 ? "alta" : "media",
      description: DESCRIPTIONS[category][0],
      stopsMachine: i % 3 !== 2,
      reportedBy: OPERATORS[i % OPERATORS.length],
      reportedAt: new Date(reportedAt).toISOString(),
      status,
      technicianId: status === "abierta" ? undefined : tech.id,
      assignedAt: status === "abierta" ? undefined : new Date(reportedAt + 5 * MIN).toISOString(),
      startedAt: status === "en_proceso" ? new Date(reportedAt + 12 * MIN).toISOString() : undefined,
    });
  });

  workOrders.sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));

  const preventivePlans = createDefaultPreventivePlans(machines, TECHNICIANS, now);
  const maxPreventive = preventivePlans.reduce((m, p) => Math.max(m, parseInt(p.id.replace("MP-", ""), 10) || 0), 100);

  return {
    createdAt: new Date(now).toISOString(),
    epoch: 1,
    revision: 1,
    machines,
    technicians: TECHNICIANS,
    workOrders,
    preventivePlans,
    counters: { workOrder: woCounter, technician: TECHNICIANS.length, preventive: maxPreventive },
  };
}
