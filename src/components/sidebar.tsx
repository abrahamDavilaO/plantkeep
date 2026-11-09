"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertBell } from "./alert-bell";
import { DemoReset } from "./demo-reset";

const NAV = [
  { href: "/", label: "Panel de control", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { href: "/reportar", label: "Reportar falla", icon: "M12 2 1 21h22L12 2zm1 16h-2v-2h2v2zm0-4h-2v-4h2v4z" },
  { href: "/ordenes", label: "Órdenes de trabajo", icon: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-9 14H7v-2h3v2zm0-4H7v-2h3v2zm0-4H7V7h3v2zm7 8h-5v-2h5v2zm0-4h-5v-2h5v2zm0-4h-5V7h5v2z" },
  { href: "/preventivo", label: "Preventivo", icon: "M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10zM7 12h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" },
  { href: "/tecnicos", label: "Técnicos", icon: "M16 11c1.7 0 2.9-1.2 2.9-2.9S17.7 5.2 16 5.2s-2.9 1.2-2.9 2.9S14.3 11 16 11zm-8 0c1.7 0 2.9-1.2 2.9-2.9S9.7 5.2 8 5.2 5.1 6.4 5.1 8.1 6.3 11 8 11zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.6 0-1 .1 1.2.8 2 2 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z" },
  { href: "/maquinas", label: "Máquinas", icon: "M22.7 19 13.6 9.9c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" },
];

const NAV_SHORT: Record<string, string> = {
  "/": "Panel",
  "/reportar": "Reportar",
  "/ordenes": "Órdenes",
  "/preventivo": "Prevent.",
  "/tecnicos": "Técnicos",
  "/maquinas": "Máquinas",
};

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 z-20 flex w-full shrink-0 flex-col border-b border-slate-800 bg-slate-900 text-slate-300 md:h-screen md:w-60 md:border-b-0 md:sticky">
      <div className="flex items-center justify-between gap-2 px-4 py-3 md:px-5 md:py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-orange-500 font-bold text-white">PK</div>
          <div>
            <p className="font-semibold text-white">PlantKeep</p>
            <p className="text-xs text-slate-400">Planta Automotriz</p>
          </div>
        </div>
        <div className="shrink-0 md:hidden">
          <AlertBell />
        </div>
      </div>
      <div className="hidden px-3 md:block">
        <AlertBell />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-col md:pb-0 [&::-webkit-scrollbar]:hidden">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors md:gap-3 ${
                active ? "bg-slate-800 text-white" : "hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current" aria-hidden>
                <path d={item.icon} />
              </svg>
              <span className="whitespace-nowrap md:hidden">{NAV_SHORT[item.href] ?? item.label}</span>
              <span className="hidden whitespace-nowrap md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden px-5 py-4 text-xs text-slate-500 md:block">
        200 equipos · 6 líneas
        <DemoReset />
      </div>
    </aside>
  );
}
