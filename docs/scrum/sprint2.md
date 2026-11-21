# Evidencias Scrum — Sprint 2
## SGI Sistema de Gestión de Inventario · Panadería La Nueva Victoria

| Campo | Detalle |
|-------|---------|
| Sprint | 2 |
| Periodo | 19 de septiembre – 06 de octubre de 2026 |
| Objetivo | Registro de destinatarios, pedidos y listado en tiempo real |
| Responsable QA | Alessandro Godinez |

---

## Planning — Sprint 2

**Fecha:** 19 de septiembre de 2026

**Objetivo del Sprint acordado:** Implementar el módulo de destinatarios (RF-12), pedidos (RF-02) y listado de productos en tiempo real con Supabase Realtime (RF-05).

**Tareas asignadas:**

| Responsable | Tarea | RF |
|---|---|---|
| Manuel Cárdenas | Registro de destinatario (frontend + backend) | RF-12 |
| José Carlos Ordóñez | Registro de pedidos con múltiples productos | RF-02 |
| Carolina Zhou | Listado de productos en tiempo real (Supabase Realtime) | RF-05 |
| Alessandro Godinez | QA / Pruebas de integración del módulo | — |
| Armando Solís | Documentación técnica / apoyo general | — |

**Definition of Done:**
- PR mergeado a `main` con al menos 1 revisión.
- Pruebas de integración pasando en CI.
- Sin defectos bloqueantes abiertos.

---

## Daily Scrums — Sprint 2

> Las reuniones se realizaron vía **WhatsApp/Discord** (capturas disponibles en el equipo).

| Fecha | Qué se hizo | Qué sigue | Impedimentos |
|-------|------------|-----------|--------------|
| 01 oct 2026 | Carolina: RF-05 completo (Realtime + frontend ordenado). | RF-12, RF-02 en recta final. | — |
| 02 oct 2026 | Manuel: RF-12 implementado. José Carlos: RF-02 implementado (módulo de pedidos). | Revisión cruzada y PRs. | — |
| 03 oct 2026 | Alessandro: QA Sprint 2 iniciado. Armando: Correcciones de defectos RF-02. | Corregir D-04, D-07, D-08. | — |
| 04 oct 2026 | Manuel: D-03, D-12, D-13, D-14, D-15 corregidos (sesión con HttpOnly, middleware global). | Cierre del sprint. | — |
| 06 oct 2026 | Alessandro: QA Sprint 2 finalizado. José Carlos: D-02 corregido. | Inicio Sprint 3. | — |

---

## Sprint Review — Sprint 2

**Fecha:** 06 de octubre de 2026

**Funcionalidades demostradas:**

| RF | Funcionalidad | Resultado |
|----|---------------|-----------|
| RF-12 | Crear, listar y dar de baja destinatarios | ✅ Funciona |
| RF-02 | Registrar pedido con múltiples productos; `id_usuario` tomado de sesión (cookie) | ✅ Funciona |
| RF-05 | Listado de productos con actualización en tiempo real vía Supabase Realtime | ✅ Funciona |
| RF-15 (fix) | Cookie de sesión ahora es `HttpOnly`; middleware protege todas las páginas | ✅ Funciona |

**Feedback:**
- Se aclaró que Realtime aplica solo al listado de Productos (no a Pedidos/Destinatarios) según el alcance del RF-05.
- El cierre de sesión (D-16) quedó como deuda técnica por depender de un requerimiento pendiente.

---

## Retrospectiva — Sprint 2

**Fecha:** 06 de octubre de 2026

| Categoría | Observación |
|-----------|-------------|
| ✅ Qué salió bien | QA detectó y se corrigieron 7 defectos en el sprint. El proceso de PR + review funcionó bien. |
| ✅ Qué salió bien | El middleware de autenticación global ya protege todas las rutas del sistema. |
| ⚠️ Qué mejorar | El registro de pedidos no era transaccional (D-02): si fallaban los detalles, el pedido quedaba sin productos. Se mejoró el manejo de errores. |
| ⚠️ Qué mejorar | Las cookies no estaban firmadas (D-03): cualquiera podía editarlas en el navegador. Quedó como deuda técnica. |
| 🔧 Acción para el siguiente sprint | José Carlos implementa RF-20 (producción en tiempo real). Carolina implementa RF-09 (mermas). |

---

## Métricas del Sprint 2

| Métrica | Valor |
|---------|-------|
| Commits en el sprint | ~20 commits |
| PRs mergeados | #6, #7, #8, #9, #10, #11, #13, #14, #15, #17 |
| Pruebas de integración | 10 suites de integración HTTP/API |
| Defectos encontrados en QA | D-02 al D-10, D-15, D-16 |
| Defectos resueltos antes del cierre | D-04 ✅, D-07 ✅, D-08 ✅, D-12 ✅, D-13 ✅, D-14 ✅, D-15 ✅ |
