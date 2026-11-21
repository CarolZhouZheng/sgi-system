# Evidencias Scrum — Sprint 4
## SGI Sistema de Gestión de Inventario · Panadería La Nueva Victoria

| Campo | Detalle |
|-------|---------|
| Sprint | 4 |
| Periodo | 18 de octubre – 07 de noviembre de 2026 |
| Objetivo | Alertas de vencimiento, búsqueda avanzada, gestión de devoluciones y reporte de movimientos |
| Responsable QA | Manuel Cárdenas |

---

## Planning — Sprint 4

**Fecha:** 18 de octubre de 2026

**Objetivo del Sprint acordado:** Completar los módulos de alerta de lotes vencidos (RF-06), búsqueda avanzada de productos (RF-07), devoluciones con reingreso a inventario (RF-11) y reporte completo de movimientos de inventario (RF-08).

**Tareas asignadas:**

| Responsable | Tarea | RF |
|---|---|---|
| José Carlos Ordóñez | Alertas de vencimiento de lotes | RF-06 |
| Carolina Zhou | Búsqueda avanzada de productos con múltiples filtros | RF-07 |
| Armando Solís | Gestión de devoluciones con reingreso a inventario | RF-11 |
| Alessandro Godinez | Reporte de movimientos de inventario | RF-08 |
| Manuel Cárdenas | QA / Pruebas de integración de todo el sprint | — |

**Definition of Done:**
- PR mergeado a `main` con certificación QA de Manuel.
- Pruebas unitarias (DTO + Service + Endpoint) y de integración pasando.
- Reporte QA en `docs/qa/sprint4-pruebas.md`.

---

## Daily Scrums — Sprint 4

> Las reuniones se realizaron vía **WhatsApp/Discord** (capturas disponibles en el equipo).

| Fecha | Qué se hizo | Qué sigue | Impedimentos |
|-------|------------|-----------|--------------|
| 12 oct 2026 | José Carlos: RF-06 implementado (campana de alertas con modal, polling, días configurables). | QA de RF-06. | — |
| 13 oct 2026 | Manuel: QA RF-06 certificado (ronda 1). | RF-07 Carolina, RF-08 Alessandro. | — |
| 19 oct 2026 | Carolina: RF-07 implementado (filtros de categoría, estado, stock, búsqueda en tiempo real). Alessandro: RF-08 implementado (reporte de movimientos con filtros de fecha y tipo). | QA de RF-07 y RF-08. | — |
| 20 oct 2026 | Manuel: QA RF-07 y RF-08 certificados (rondas 2 y 3). José Carlos: agrega producciones al reporte de movimientos. | RF-11 Armando. | — |
| 27 oct 2026 | Armando: RF-11 implementado (devoluciones con reingreso a stock, movimiento DEVOLUCION, auditoría). | QA RF-11. | — |
| 28 oct 2026 | Manuel: QA RF-11 certificado (ronda 4). Sprint 4 cerrado. | Preparación presentación final. | — |

---

## Sprint Review — Sprint 4

**Fecha:** 28 de octubre de 2026

**Funcionalidades demostradas:**

| RF | Funcionalidad | Resultado |
|----|---------------|-----------|
| RF-06 | Campana en el header con badge de alertas, modal con lista de lotes próximos a vencer | ✅ Funciona |
| RF-07 | Filtros combinables: nombre, categoría, estado activo/inactivo, nivel de stock | ✅ Funciona |
| RF-08 | Reporte de movimientos con filtros por fecha, tipo (entrada/salida/pérdida/devolución/producción) y producto | ✅ Funciona |
| RF-11 | Crear devolución de pedido, aprobar/rechazar, reingreso automático de stock, registro en auditoría | ✅ Funciona |

**Métricas de pruebas al cierre del Sprint 4:**

| Módulo | Pruebas Unitarias | Pruebas Integración |
|--------|-----------------|---------------------|
| RF-11 Devoluciones (Armando - QA Manuel) | 19 DTO + 16 Service + 10 Endpoint = **45 pruebas** | 13 pruebas |
| RF-06 Alertas | 3 DTO + 8 Service + 3 Endpoint = 14 pruebas | — |
| RF-07/08 | Integrados en suite de productos y movimientos | — |
| **Total del sistema** | **~296 pruebas unitarias** | **10 suites de integración** |

---

## Retrospectiva — Sprint 4

**Fecha:** 28 de octubre de 2026

| Categoría | Observación |
|-----------|-------------|
| ✅ Qué salió bien | Se completaron los 4 RFs del sprint. QA exhaustivo con 45+ pruebas solo en RF-11. |
| ✅ Qué salió bien | El proceso de certificación QA funcionó bien: Manuel revisó y certificó cada módulo antes del merge. |
| ✅ Qué salió bien | El sistema tiene 8 módulos funcionales completamente integrados con Supabase. |
| ⚠️ Qué mejorar | Faltan pruebas E2E de navegador (Playwright) — solo se tienen pruebas de integración HTTP. |
| ⚠️ Qué mejorar | La dockerización del proyecto no se implementó durante los sprints. |
| ⚠️ Qué mejorar | La documentación de Scrum no se centralizó durante los sprints (corregido retroactivamente). |
| 🔧 Acciones finales | Implementar `Dockerfile`, pruebas E2E, corregir bugs UI menores y preparar presentación final. |

---

## Métricas del Sprint 4

| Métrica | Valor |
|---------|-------|
| Commits en el sprint | ~15 commits |
| PRs mergeados | #33 (Alessandro), #38, #39 (Carolina), #40 (Armando), #41 (Manuel QA) |
| Pruebas unitarias añadidas | 45 en RF-11 + 14 en RF-06 + product/movimiento |
| Pruebas de integración añadidas | 13 en RF-11, búsqueda-avanzada, movimiento-reporte, alerta-vencimiento |
| Defectos encontrados y resueltos | Todos los defectos del sprint resueltos antes del merge |
