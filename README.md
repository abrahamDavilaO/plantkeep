# PlantKeep

Aplicación de apoyo a mantenimiento para planta automotriz: reporte de fallas desde tableta, órdenes de trabajo, asignación de técnicos, tiempos de respuesta/reparación y disponibilidad/tiempos muertos.

## Requisitos

- Node.js **20.19+** o **22.13+** (recomendado; con 20.17 aparecen avisos `EBADENGINE` de ESLint).
- npm 10+

## Arranque

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

Los datos viven en `data/db.json` (generado al iniciar con datos simulados para 200 equipos). Está ignorado en git.

## Rutas

| Ruta | Uso |
|------|-----|
| `/` | Panel: OEE aproximado, paro, MTTR, líneas, incidencias activas |
| `/reportar` | Formulario táctil para reportar fallas |
| `/ordenes` | Listado y flujo asignar → iniciar → cerrar |
| `/maquinas` | 200 máquinas e historial por equipo |
| `/tecnicos` | Registro de personal de mantenimiento y correos para alertas |
| `/preventivo` | Calendario de rutinas, alertas y programación de preventivos |

## API

- `GET /api/state` — estado completo
- `POST /api/work-orders` — nueva OT
- `PATCH /api/work-orders/[id]` — `assign` | `start` | `complete`
- `POST /api/reset` — regenera la base con el seed

## Exportar y demo

- En **Órdenes de trabajo**, el botón **Exportar CSV** descarga el listado filtrado (útil para el supervisor en lugar de Excel).
- En el pie del menú lateral (escritorio), **Reiniciar datos demo** vuelve a cargar el seed de 200 equipos.

## Integración SAP

No implementada en esta versión; la app funciona de forma autónoma. Cuando haga falta, se puede añadir un conector (OData/RFC) sin cambiar el flujo de pantallas.

## Notas técnicas

- El proyecto usa **Tailwind CSS v3** con webpack (`next dev --webpack` / `next build --webpack`) por compatibilidad con la versión actual de Node en este entorno.
- El comando `npm run build` ya incluye `--webpack`.
