import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { AlertNotifier } from "@/components/alert-notifier";
import { GuidedTour } from "@/components/guided-tour";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlantKeep · Mantenimiento de planta",
  description: "Reporte de fallas, órdenes de mantenimiento y disponibilidad de equipos.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 font-sans text-slate-800 md:flex-row">
        <AlertNotifier />
        <GuidedTour />
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-4 md:p-8">{children}</main>
      </body>
    </html>
  );
}
