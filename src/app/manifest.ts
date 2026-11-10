import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "PlantKeep · Mantenimiento de planta",
    short_name: "PlantKeep",
    description: "Reporte de fallas, órdenes de mantenimiento y disponibilidad de equipos.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Reportar falla", short_name: "Reportar", url: "/reportar" },
      { name: "Órdenes de trabajo", short_name: "Órdenes", url: "/ordenes" },
    ],
  };
}
