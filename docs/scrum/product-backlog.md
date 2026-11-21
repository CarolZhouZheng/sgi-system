# Product Backlog — SGI Sistema de Gestión de Inventario
## Panadería La Nueva Victoria · UNA · Ingeniería en Sistemas II · 2026

---

## Descripción del Producto

Sistema web para la gestión de inventario, pedidos, producción y devoluciones de la **Panadería La Nueva Victoria**. Permite al administrador controlar el stock de productos, registrar pedidos a destinatarios, gestionar la producción, registrar pérdidas, procesar devoluciones y generar reportes de movimientos.

**Stack:** Nuxt 4 · Vue 3 · TypeScript · Supabase (PostgreSQL) · TailwindCSS

---

## Equipo

| Integrante | Usuario GitHub | Rama |
|---|---|---|
| Carol Zhou Zheng | CarolZhouZheng | CaritoBranch |
| Manuel Josué Cárdenas Sánchez | manueldeveloper99 | manuelBranch |
| Armando José Solís Villegas | — | ArmandoBranch |
| Alessandro Godinez | — | Branch-Alessandro |
| José Carlos Ordóñez | JcOrdonezUI | JoseBranch |

---

## Historias de Usuario (Product Backlog)

### Sprint 1 — Autenticación y Productos (05 – 26 sep 2026)

| ID | Historia | Criterio de Aceptación | Prioridad | Responsable | Estado |
|----|----------|------------------------|-----------|-------------|--------|
| US-01 | Como administrador, quiero iniciar sesión con usuario y contraseña para acceder al sistema de forma segura. | El sistema valida credenciales contra la BD, genera una cookie de sesión HttpOnly y redirige a `/productos`. Si son incorrectas, muestra "Credenciales inválidas". | Alta | Manuel | ✅ Completado |
| US-02 | Como administrador, quiero registrar productos consumibles con nombre, descripción, categoría, unidad de medida y stock para llevar el inventario. | Se crea el producto en Supabase, aparece en el listado y se rechaza si faltan campos obligatorios. | Alta | Carolina | ✅ Completado |
| US-03 | Como administrador, quiero editar los datos de un producto existente para corregir información incorrecta. | El PUT actualiza nombre, categoría, stock y demás campos. Devuelve 404 si no existe. | Media | Alessandro | ✅ Completado |
| US-04 | Como administrador, quiero dar de baja un producto para que ya no aparezca en operaciones activas sin eliminarlo de la BD. | El estado del producto cambia a `false`. Se puede reactivar posteriormente. | Media | Armando | ✅ Completado |

### Sprint 2 — Destinatarios y Pedidos (19 sep – 02 oct 2026)

| ID | Historia | Criterio de Aceptación | Prioridad | Responsable | Estado |
|----|----------|------------------------|-----------|-------------|--------|
| US-05 | Como administrador, quiero registrar destinatarios (empresas distribuidoras) con nombre, teléfono, correo y dirección para asignarlos a pedidos. | Se validan y guardan los datos. Se rechazan campos vacíos o solo espacios. | Alta | Manuel | ✅ Completado |
| US-06 | Como administrador, quiero registrar pedidos seleccionando un destinatario, productos, cantidades y fecha de entrega para organizar las entregas. | El pedido se guarda con sus detalles. El `id_usuario` se toma de la sesión (cookie), no del formulario. | Alta | José Carlos | ✅ Completado |
| US-07 | Como administrador, quiero ver el listado de productos actualizarse en tiempo real sin recargar la página para detectar cambios de stock inmediatamente. | Al crear/modificar un producto en otra pestaña, el listado se actualiza vía Supabase Realtime. | Alta | Carolina | ✅ Completado |

### Sprint 3 — Producción y Mermas (03 – 17 oct 2026)

| ID | Historia | Criterio de Aceptación | Prioridad | Responsable | Estado |
|----|----------|------------------------|-----------|-------------|--------|
| US-08 | Como administrador, quiero ver y gestionar la cola de producción en tiempo real para saber qué órdenes están pendientes, en proceso o completadas. | El listado de órdenes se actualiza en tiempo real. Se puede cambiar estado de PENDIENTE → EN_PROCESO → COMPLETADA. | Alta | José Carlos | ✅ Completado |
| US-09 | Como administrador, quiero marcar pedidos como completados para indicar que fueron entregados al destinatario. | El pedido cambia a estado COMPLETADO. Se registra en auditoría. No se puede completar uno ya completado o cancelado. | Media | Manuel | ✅ Completado |
| US-10 | Como administrador, quiero registrar pérdidas de inventario indicando producto, cantidad, motivo y tipo de pérdida para descontar el stock correctamente. | La pérdida se guarda, el stock del producto disminuye y se genera un movimiento de inventario tipo PERDIDA. | Alta | Carolina | ✅ Completado |

### Sprint 4 — Alertas, Búsqueda, Devoluciones y Reportes (18 oct – 07 nov 2026)

| ID | Historia | Criterio de Aceptación | Prioridad | Responsable | Estado |
|----|----------|------------------------|-----------|-------------|--------|
| US-11 | Como administrador, quiero recibir alertas visuales cuando un lote de producto esté próximo a vencer o ya vencido para tomar acciones preventivas. | La campana muestra el número de alertas. Los lotes próximos a vencer (configurable, default 3 días) aparecen destacados. | Alta | José Carlos | ✅ Completado |
| US-12 | Como administrador, quiero filtrar y buscar productos por nombre, categoría, estado (activo/inactivo) y nivel de stock para localizar ítems rápidamente. | El listado se filtra en tiempo real al escribir o seleccionar un filtro. Los filtros se pueden combinar. | Media | Carolina | ✅ Completado |
| US-13 | Como administrador, quiero registrar y gestionar devoluciones de pedidos para reingresar productos al inventario cuando un destinatario devuelve mercancía. | Se registra la devolución, el stock aumenta, se genera un movimiento DEVOLUCION y se registra en auditoría. | Alta | Armando | ✅ Completado |
| US-14 | Como administrador, quiero ver un reporte de todos los movimientos de inventario filtrado por fecha, tipo y producto para auditar el historial de stock. | El reporte muestra entradas, salidas, pérdidas, devoluciones y producciones con sus fechas y usuarios. | Alta | Alessandro | ✅ Completado |

---

## Resumen de entregas

| Sprint | Periodo | RFs entregados | PR mergeados |
|--------|---------|----------------|--------------|
| Sprint 1 | 05 – 26 sep 2026 | RF-15, RF-01, RF-03, RF-04 | #1, #2, #3, #5 |
| Sprint 2 | 19 sep – 06 oct 2026 | RF-12, RF-02, RF-05 | #6, #7, #8, #9, #10, #11, #13, #14, #15, #17 |
| Sprint 3 | 03 – 08 oct 2026 | RF-20, RF-21, RF-09 | #18, #19, #20, #21, #22 |
| Sprint 4 | 18 oct – 28 oct 2026 | RF-06, RF-07, RF-08, RF-11 | #33, #38, #39, #40, #41 |
| Cierre / Estabilización | 29 oct – 20 nov 2026 | Docker/Compose, CI/CD (GHCR), Playwright E2E, `fecha_vencimiento`, Documentación Scrum y Técnica | #42, #43, #44, #45, #46, #47, #48, #49, #50 |
