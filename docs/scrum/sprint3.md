# Evidencias Scrum — Sprint 3
## SGI Sistema de Gestión de Inventario · Panadería La Nueva Victoria

| Campo | Detalle |
|-------|---------|
| Sprint | 3 |
| Periodo | 03 de octubre – 17 de octubre de 2026 |
| Objetivo | Cola de producción en tiempo real, marcar pedidos como completados y registro de mermas |
| Responsable QA | Armando Solís |

---

## Planning — Sprint 3

**Fecha:** 03 de octubre de 2026

**Objetivo del Sprint acordado:** Implementar el módulo de producción con cola en tiempo real (RF-20), la funcionalidad de completar pedidos (RF-21) y el registro de pérdidas/mermas de inventario (RF-09).

**Tareas asignadas:**

| Responsable | Tarea | RF |
|---|---|---|
| José Carlos Ordóñez | Cola de producción en tiempo real | RF-20 |
| Manuel Cárdenas | Marcar pedido como completado | RF-21 |
| Carolina Zhou | Registrar mermas/pérdidas de inventario | RF-09 |
| Armando Solís | QA / Pruebas de integración del módulo | — |
| Alessandro Godinez | Documentación técnica / apoyo general | — |

**Definition of Done:**
- PR mergeado a `main`.
- Pruebas unitarias y de integración pasando.
- Funcionalidad verificada manualmente en entorno de desarrollo.

---

## Daily Scrums — Sprint 3

> Las reuniones se realizaron vía **WhatsApp/Discord** (capturas disponibles en el equipo).

| Fecha | Qué se hizo | Qué sigue | Impedimentos |
|-------|------------|-----------|--------------|
| 06 oct 2026 | José Carlos: RF-20 implementado (módulo de producción con tiempo real). | RF-21 (Manuel), RF-09 (Carolina). | — |
| 07 oct 2026 | Manuel: RF-21 implementado (marcar pedido como completado con auditoría). Carolina: RF-09 implementado (mermas). | PRs y QA. | — |
| 07 oct 2026 | Armando: QA del RF-09 iniciado. | Pruebas de integración RF-09, RF-20, RF-21. | — |
| 08 oct 2026 | Armando: QA Sprint 3 completado (RF-21). PRs mergeados. | Inicio Sprint 4. | — |

---

## Sprint Review — Sprint 3

**Fecha:** 08 de octubre de 2026

**Funcionalidades demostradas:**

| RF | Funcionalidad | Resultado |
|----|---------------|-----------|
| RF-20 | Cola de producción en tiempo real: crear, cambiar estado, ver por pedido | ✅ Funciona |
| RF-21 | Botón "Completar" en pedidos pendientes/en proceso; transición visual inmediata | ✅ Funciona |
| RF-09 | Registrar pérdida con producto, cantidad, motivo y tipo; descuenta stock automáticamente | ✅ Funciona |

**Feedback:**
- Alessandro detectó que al completar una producción no se actualizaba correctamente el stock en casos donde el pedido tenía producción parcial. Se corrigió en el mismo sprint.
- Se identificó que el reporte de movimientos debería incluir producciones (agregado en Sprint 4 por sugerencia de Manuel).

---

## Retrospectiva — Sprint 3

**Fecha:** 08 de octubre de 2026

| Categoría | Observación |
|-----------|-------------|
| ✅ Qué salió bien | Los tres RFs se entregaron dentro del sprint. Tiempo real (RF-20) funcionó bien con Supabase Realtime. |
| ✅ Qué salió bien | El módulo de auditoría registra correctamente cada acción (completar pedido, registrar pérdida). |
| ⚠️ Qué mejorar | El módulo de producción no incluía inicialmente las producciones en el reporte de movimientos. Se planificó para Sprint 4. |
| ⚠️ Qué mejorar | El Sprint 3 quedó con QA y documentación marcados como "Pendiente" en el README. Se actualizó el README al cierre. |
| 🔧 Acción para el siguiente sprint | José Carlos: RF-06 (alertas). Carolina: RF-07 (búsqueda). Armando: RF-11 (devoluciones). Alessandro: RF-08 (reportes). |

---

## Métricas del Sprint 3

| Métrica | Valor |
|---------|-------|
| Commits en el sprint | ~15 commits |
| PRs mergeados | #18, #19, #20, #21, #22 |
| Pruebas unitarias añadidas | RF-21: 4 casos (service), RF-09: pruebas DTO/service |
| Defectos encontrados y resueltos | D-16 ✅ (cierre de sesión), D-17 ✅ |
