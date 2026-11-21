# Evidencias Scrum — Sprint 1
## SGI Sistema de Gestión de Inventario · Panadería La Nueva Victoria

| Campo | Detalle |
|-------|---------|
| Sprint | 1 |
| Periodo | 05 de septiembre – 26 de septiembre de 2026 |
| Objetivo | Autenticación de administrador y CRUD completo de productos |
| Responsable QA | José Carlos Ordóñez |

---

## Planning — Sprint 1

**Fecha:** 05 de septiembre de 2026

**Objetivo del Sprint acordado:** Implementar el módulo de autenticación (RF-15) y el CRUD completo de productos (RF-01, RF-03, RF-04) como base del sistema.

**Tareas asignadas:**

| Responsable | Tarea | RF |
|---|---|---|
| Carol Zhou | Registro de producto consumible (frontend + backend + BD) | RF-01 |
| Manuel Cárdenas | Autenticación de administrador (login nativo + Google Auth) | RF-15 |
| Alessandro Godinez | Actualización de datos de producto | RF-03 |
| Armando Solís | Baja/reactivación de producto | RF-04 |
| José Carlos Ordóñez | QA / Pruebas de integración del módulo | — |

**Acuerdo de Definition of Done:**
- Código en rama personal, PR abierto hacia `main`.
- Prueba manual exitosa del flujo completo.
- Sin errores de compilación (`npm run build`).

---

## Daily Scrums — Sprint 1

> Las reuniones diarias se realizaron vía **WhatsApp** (capturas disponibles en el equipo).

| Fecha | Qué se hizo | Qué sigue | Impedimentos |
|-------|------------|-----------|--------------|
| 20 sep 2026 | Carol: estructura inicial del proyecto en GitHub (commit inicial, carpetas). | Implementar RF-01. | — |
| 21 sep 2026 | Carol: RF-01 completo (registro de producto). Manuel: revisión de arquitectura. | RF-15, RF-03, RF-04. | — |
| 23 sep 2026 | Manuel: RF-15 implementado (login nativo + Google). Armando: RF-04 implementado (baja de producto). | Integrar y hacer PRs. | Ninguno. |
| 25 sep 2026 | Alessandro: RF-03 implementado (actualización de datos). | PR review y QA. | — |
| 27 sep 2026 | Manuel: CI Pipeline configurado en GitHub Actions. | QA del sprint. | — |

---

## Sprint Review — Sprint 1

**Fecha:** 26 de septiembre de 2026

**Funcionalidades demostradas al equipo:**

| RF | Funcionalidad | Resultado |
|----|---------------|-----------|
| RF-15 | Login con usuario/contraseña (`admin`) y redirección a `/productos` | ✅ Funciona |
| RF-01 | Formulario para crear producto: nombre, descripción, categoría, unidad, stock | ✅ Funciona |
| RF-03 | Edición de producto existente con todos sus campos | ✅ Funciona |
| RF-04 | Dar de baja y reactivar producto (cambio de estado) | ✅ Funciona |
| CI | Pipeline de GitHub Actions con `npm install`, `npm build`, `npm test` | ✅ Verde |

**Feedback del equipo:**
- El login con Google requiere configuración adicional en Supabase Auth.
- La cookie de sesión necesitaba ser `HttpOnly` (marcado como deuda técnica, corregido en Sprint 2).

---

## Retrospectiva — Sprint 1

**Fecha:** 26 de septiembre de 2026

| Categoría | Observación |
|-----------|-------------|
| ✅ Qué salió bien | El equipo entregó todos los RFs del sprint. La arquitectura en capas (API → DTO → Service → Repository → Supabase) quedó establecida y todos la siguieron. |
| ✅ Qué salió bien | Se configuró CI desde el Sprint 1, lo que detectó errores de compilación tempranamente. |
| ⚠️ Qué mejorar | Las cookies de sesión no eran seguras (`HttpOnly` faltaba). Se añadió como deuda técnica. |
| ⚠️ Qué mejorar | El middleware de autenticación no protegía las rutas. Se corrigió en Sprint 2. |
| 🔧 Acción para el siguiente sprint | Manuel agrega `HttpOnly` a la cookie y el middleware global de autenticación. |

---

## Métricas del Sprint 1

| Métrica | Valor |
|---------|-------|
| Commits en el sprint | ~12 commits |
| PRs mergeados | #1 (Armando), #2 (Manuel), #3 (Alessandro), #5 (Manuel-CI) |
| Pruebas unitarias añadidas | Iniciales de producto y auth |
| Defectos encontrados en QA | D-11 (trim en nombre), D-12 (bcrypt con NULL), D-13 (Zod 401), D-14 (middleware) |
| Defectos resueltos antes del cierre | D-11 ✅ (en Sprint 2 ronda 2) |
