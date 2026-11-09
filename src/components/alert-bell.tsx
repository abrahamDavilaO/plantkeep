"use client";

import Link from "next/link";
import { usePlant } from "@/lib/use-plant";

export function AlertBell() {
  const { data } = usePlant(15_000);
  const count = data?.alerts.length ?? 0;
  const critical = data?.alerts.filter((a) => a.severity === "critical").length ?? 0;

  return (
    <Link
      href="/alertas"
      className="relative flex items-center gap-2 rounded-lg bg-slate-800/80 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-white"
      title="Centro de alertas"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm7-5v-5.5A7 7 0 0 0 6.03 8.06l-1.27-1.27L3.28 8.22l1.27 1.27A9 9 0 0 1 19 11.5V17h2zm-14 0h2v-5.5a7 7 0 0 1 2.4-5.28l-1.4-1.42-1.42 1.4A9.02 9.02 0 0 0 5 11.5V17z" />
      </svg>
      Alertas
      {count > 0 && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
            critical ? "bg-red-500 text-white" : "bg-amber-400 text-slate-900"
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}
