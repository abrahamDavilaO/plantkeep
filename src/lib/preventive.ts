import type { PreventivePlan } from "./types";

const DAY_MS = 86_400_000;

export function completePreventivePlan(plan: PreventivePlan, now: number): void {
  plan.lastCompletedAt = new Date(now).toISOString();
  plan.nextDueAt = new Date(now + plan.intervalDays * DAY_MS).toISOString();
}

export function plansDueOnDay(plans: PreventivePlan[], dayStartMs: number) {
  const end = dayStartMs + DAY_MS;
  return plans.filter((p) => {
    const t = Date.parse(p.nextDueAt);
    return p.active && t >= dayStartMs && t < end;
  });
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}
