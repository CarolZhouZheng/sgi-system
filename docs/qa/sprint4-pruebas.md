# QA · Sprint 4 — Alertas de Vencimiento, Búsqueda Avanzada, Devoluciones y Reportes

| Campo                    | Detalle                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Sprint                   | 4 (18 de octubre – 07 de noviembre)                                                                                         |
| Módulos asignados        | Alertas de vencimiento (Jose Carlos) · Búsqueda avanzada (Carolina) · Gestión de devoluciones (Armando) · Reporte de movimientos (Alessandro) |
| Requerimientos cubiertos | **RF-06** Alertas de vencimiento · **RF-07** Búsqueda avanzada · **RF-11** Devoluciones · **RF-08** Reporte de movimientos    |
| Responsable QA           | Manuel                                                                                                                       |
| Rama de trabajo          | `manuelBranch`                                                                                                               |
| Fechas de certificación  | **13/10/2026:** Ronda 1 (RF-06 Jose Carlos) · **19/10/2026:** Ronda 2 (RF-07 Carolina) · **20/10/2026:** Ronda 3 (RF-08 Alessandro) · **28/10/2026:** Ronda 4 (RF-11 Armando) |

---

## 1. Alcance

Siguiendo la arquitectura en capas del sistema SGI:

```text
Frontend (Vue / Composables) → API (server/api) → DTO (Zod) → Service → Repository → Supabase (PostgreSQL)
```

### Componentes evaluados

| Módulo / RF | Capa | Archivo evaluado |
| --- | --- | --- |
| **RF-06** Alertas de vencimiento (Jose Carlos) | Frontend | `app/components/alertas/CampanaAlertas.vue` (Campana interactiva, modal dropdown, badges dinámicos) |
| | Composable | `app/composables/useAlertasVencimiento.ts` (Estado reactivo, polling y filtros) |
| | Layout | `app/layouts/default.vue` (Incrustación en header del sistema) |
| | API Endpoint | `server/api/alertas/vencimientos.get.ts` |
| | DTO | `server/dtos/alerta.dto.ts` (`ConsultaAlertasSchema`) |
| | Service | `server/services/alerta.service.ts` (`calcularDiasDiferencia`, `obtenerAlertasVencimiento`) |
| | Repository | `server/repositories/alerta.repository.ts` (`obtenerDiasConfiguracion`, `obtenerLotesCandidatos`) |
| **RF-07** Búsqueda avanzada (Carolina) | Frontend | `app/components/productos/ListadoProductos/ListadoProductos.vue` y `.ts` (Búsqueda en tiempo real, filtros de categoría, estado y stock) |
| | API Endpoint | `server/api/productos/index.get.ts` |
| | DTO | `server/dtos/producto.dto.ts` (`FiltroProductosSchema`) |
| | Service | `server/services/producto.service.ts` (`listarProductos` con filtro en memoria de stock bajo) |
| | Repository | `server/repositories/producto.repository.ts` (Consultas dinámicas ILIKE y filtros Supabase) |
| **RF-08** Reporte de movimientos (Alessandro) | Frontend | `app/pages/reportes/index.vue`, `app/components/reportes/ReporteMovimientos/` |
| | API Endpoint | `server/api/movimientos/index.get.ts` |
| | DTO | `server/dtos/movimiento.dto.ts` (`ConsultaMovimientosSchema`) |
| | Service | `server/services/movimiento.service.ts` (`generarReporte`, `calcularResumen`, `calcularRangoFechas`) |
| | Repository | `server/repositories/movimiento.repository.ts` (Consultas con joins de producto y usuario) |
| **RF-11** Gestión de devoluciones (Armando) | Frontend | `app/pages/devoluciones/index.vue`, `app/components/devoluciones/` (`FormularioDevolucion.vue`, `ListadoDevoluciones.vue`, `ModalComprobanteDevolucion.vue`) |
| | Layout | `app/layouts/default.vue` (Acceso en barra lateral y rutas de navegación) |
| | API Endpoints | `server/api/devoluciones/index.get.ts`, `index.post.ts`, `pedidos-elegibles.get.ts`, `[id]/index.get.ts`, `[id]/estado.patch.ts` |
| | DTO | `server/dtos/devolucion.dto.ts` (`CrearDevolucionSchema`, `CambiarEstadoDevolucionSchema`, `DevolucionIdParamSchema`, `FiltrosDevolucionSchema`) |
| | Service | `server/services/devolucion.service.ts` (`registrarDevolucion`, `cambiarEstadoDevolucion`, `listarDevoluciones`, `obtenerDevolucionPorId`, `obtenerPedidosElegibles`) |
| | Repository | `server/repositories/devolucion.repository.ts` (Consultas con relaciones completas, inserciones, transiciones y auditoría) |

---

## 2. Herramientas y comandos de ejecución

| Módulo | Tipo de prueba | Archivo de prueba | Comando de ejecución | Conexión Supabase | Estado |
| --- | --- | --- | --- | --- | --- |
| **RF-06** | Unitarias (DTO) | `tests/unit/alerta/alerta.dto.test.ts` | `npx vitest run tests/unit/alerta/alerta.dto.test.ts` | No (Mock / Zod) | ✅ 8/8 Pasan |
| **RF-06** | Unitarias (Service) | `tests/unit/alerta/alerta.service.test.ts` | `npx vitest run tests/unit/alerta/alerta.service.test.ts` | No (Mock isolated) | ✅ 8/8 Pasan |
| **RF-06** | Unitarias (Endpoint) | `tests/unit/alerta/alerta.endpoint.test.ts` | `npx vitest run tests/unit/alerta/alerta.endpoint.test.ts` | No (H3 Mock) | ✅ 5/5 Pasan |
| **RF-06** | Integración real | `tests/integration/alerta-vencimiento.test.ts` | `npx vitest run tests/integration/alerta-vencimiento.test.ts --config vitest.integration.config.ts` | Sí (Base compartida) | ✅ 12/12 Pasan |
| **RF-07** | Unitarias (DTO) | `tests/unit/producto/producto.dto.test.ts` | `npx vitest run tests/unit/producto/producto.dto.test.ts` | No (Mock / Zod) | ✅ 37/37 Pasan |
| **RF-07** | Unitarias (Service) | `tests/unit/producto/producto.service.test.ts` | `npx vitest run tests/unit/producto/producto.service.test.ts` | No (Mock isolated) | ✅ 15/15 Pasan |
| **RF-07** | Unitarias (Endpoint) | `tests/unit/producto/producto.endpoint.test.ts` | `npx vitest run tests/unit/producto/producto.endpoint.test.ts` | No (H3 Mock) | ✅ 4/4 Pasan |
| **RF-07** | Integración real | `tests/integration/producto-busqueda.test.ts` | `npx vitest run tests/integration/producto-busqueda.test.ts --config vitest.integration.config.ts` | Sí (Base compartida) | ✅ 12/12 Pasan |
| **RF-08** | Unitarias (DTO) | `tests/unit/movimiento/movimiento.dto.test.ts` | `npx vitest run tests/unit/movimiento/movimiento.dto.test.ts` | No (Mock / Zod) | ✅ 9/9 Pasan |
| **RF-08** | Unitarias (Service) | `tests/unit/movimiento/movimiento.service.test.ts` | `npx vitest run tests/unit/movimiento/movimiento.service.test.ts` | No (Mock isolated) | ✅ 13/13 Pasan |
| **RF-08** | Unitarias (Endpoint) | `tests/unit/movimiento/movimiento.endpoint.test.ts` | `npx vitest run tests/unit/movimiento/movimiento.endpoint.test.ts` | No (H3 Mock) | ✅ 5/5 Pasan |
| **RF-08** | Integración real | `tests/integration/movimiento-reporte.test.ts` | `npx vitest run tests/integration/movimiento-reporte.test.ts --config vitest.integration.config.ts` | Sí (Base compartida) | ✅ 12/12 Pasan |
| **RF-11** | Unitarias (DTO) | `tests/unit/devolucion/devolucion.dto.test.ts` | `npx vitest run tests/unit/devolucion/devolucion.dto.test.ts` | No (Mock / Zod) | ✅ 19/19 Pasan |
| **RF-11** | Unitarias (Service) | `tests/unit/devolucion/devolucion.service.test.ts` | `npx vitest run tests/unit/devolucion/devolucion.service.test.ts` | No (Mock isolated) | ✅ 16/16 Pasan |
| **RF-11** | Unitarias (Endpoint) | `tests/unit/devolucion/devolucion.endpoint.test.ts` | `npx vitest run tests/unit/devolucion/devolucion.endpoint.test.ts` | No (H3 Mock) | ✅ 10/10 Pasan |
| **RF-11** | Integración real | `tests/integration/devolucion.test.ts` | `npx vitest run tests/integration/devolucion.test.ts --config vitest.integration.config.ts` | Sí (Base compartida) | ✅ 13/13 Pasan |

### Reglas de integridad sobre la base compartida (Supabase)
- **Marca identificadora:** Todo dato creado en pruebas lleva el prefijo `[QA-TEST]` y un timestamp (`corrida`) único.
- **Limpieza en orden estricto de dependencias foráneas (`afterAll`):**
  1. `movimiento_inventario` (registros vinculados a `id_devolucion` o auxiliares).
  2. `auditoria` (registros con `tabla_afectada = 'devolucion'`).
  3. `devolucion` (registros de devolución).
  4. `detalle_pedido` y `pedido` (pedidos auxiliares).
  5. `destinatario` (destinatarios auxiliares).
  6. `producto` (productos auxiliares de prueba).
- **Verificación de residuales:** Se garantiza **0 registros residuales** tras finalizar la ejecución de las suites.

---

## 3. Matriz de Pruebas Unitarias (RF-11 · Gestión de Devoluciones)

### 3.1 DTO (`devolucion.dto.ts`)
| ID | Caso de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UDD-01 | Payload completo válido | Valida exitosamente con coacciones correctas | ✅ Pasa |
| UDD-02 | Estado omitido en creación | Aplica default `'PENDIENTE'` | ✅ Pasa |
| UDD-03 | Campo `id_lote` nulo u omitido | Valida con éxito permitiendo devoluciones sin lote específico | ✅ Pasa |
| UDD-04 | Coacción de tipos numéricos en strings | Convierte strings numéricos a números | ✅ Pasa |
| UDD-05 | Ausencia de `id_pedido` o `id_producto` | Rechaza con error de campo requerido | ✅ Pasa |
| UDD-06 | IDs `<= 0` o no enteros | Rechaza con error de validación Zod | ✅ Pasa |
| UDD-07 | `cantidad_devuelta <= 0` | Rechaza cantidades menores o iguales a cero | ✅ Pasa |
| UDD-08 | Longitud de `motivo` (`< 3` o `> 150`) | Rechaza cadenas fuera del rango y acepta válidas | ✅ Pasa |
| UDD-09 | Formato de `fecha` AAAA-MM-DD | Acepta ISO y rechaza formatos inválidos | ✅ Pasa |
| UDD-10 | Catálogo de estados válidos | Acepta `PENDIENTE`, `APROBADA`, `RECHAZADA`; rechaza otros | ✅ Pasa |
| UDD-11 | Límite de observaciones (`<= 500`) | Rechaza textos superiores a 500 caracteres | ✅ Pasa |
| UDD-12 | `CambiarEstadoDevolucionSchema` | Valida transición a estados válidos con observaciones opcionales | ✅ Pasa |
| UDD-13 | `DevolucionIdParamSchema` | Valida que el ID en URL sea entero positivo | ✅ Pasa |
| UDD-14 | Filtros vacíos | Aplica default `limite: 200` y campos `undefined` | ✅ Pasa |
| UDD-15 | Normalización de estado en filtros | Aplica `trim` y convierte a mayúsculas | ✅ Pasa |
| UDD-16 | Rango de fechas en filtros (`desde > hasta`) | Rechaza con mensaje descriptivo de coherencia | ✅ Pasa |
| UDD-17 | Límites en filtros (`1 <= limite <= 1000`) | Acepta valores en el rango y rechaza límites fuera de rango | ✅ Pasa |

### 3.2 Lógica de Negocio (`DevolucionService`)
| ID | Caso de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| USD-01 | Registro sin `id_usuario` | Rechaza con HTTP 400 | ✅ Pasa |
| USD-02 | Producto no pertenece al pedido | Consulta detalle y rechaza con HTTP 400 | ✅ Pasa |
| USD-03 | Cantidad devuelta supera disponible | Valida contra entregado menos devuelto previo y rechaza con HTTP 400 | ✅ Pasa |
| USD-04 | Registro en estado PENDIENTE | Crea registro y auditoría sin alterar stock ni crear movimientos | ✅ Pasa |
| USD-05 | Registro directo en estado APROBADA | Crea registro, suma stock vía `ProductoRepository` y genera `movimiento_inventario` tipo `DEVOLUCION` | ✅ Pasa |
| USD-06 | Cambiar estado de devolución inexistente | Rechaza con HTTP 404 | ✅ Pasa |
| USD-07 | Cambio a estado idéntico | Retorna registro sin ejecutar actualización | ✅ Pasa |
| USD-08 | Modificación de devolución ya APROBADA | Rechaza con HTTP 400 impidiendo doble reingreso de stock | ✅ Pasa |
| USD-09 | Transición PENDIENTE → APROBADA | Actualiza estado, suma stock y genera movimiento de inventario | ✅ Pasa |
| USD-10 | Transición PENDIENTE → RECHAZADA | Actualiza estado y audita sin modificar existencias de producto | ✅ Pasa |
| USD-11 | Listado con filtros | Valida parámetros con DTO y delega consulta al repositorio | ✅ Pasa |
| USD-12 | Listado con fechas incoherentes | Rechaza con HTTP 400 | ✅ Pasa |
| USD-13 | Consulta por ID inválido | Rechaza con HTTP 400 si ID `<= 0` | ✅ Pasa |
| USD-14 | Consulta por ID no encontrado | Rechaza con HTTP 404 | ✅ Pasa |
| USD-15 | Consulta por ID exitosa | Retorna detalle completo con relaciones | ✅ Pasa |
| USD-16 | Obtención de pedidos elegibles | Delega a repositorio y retorna pedidos con detalle | ✅ Pasa |

### 3.3 Endpoints Unitarios (`server/api/devoluciones`)
| ID | Caso de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UED-01 | `GET /api/devoluciones` consulta exitosa | Responde HTTP 200 con `{ success: true, total, data }` | ✅ Pasa |
| UED-02 | `GET /api/devoluciones` propagación de error | Captura error del servicio y responde con status correspondiente | ✅ Pasa |
| UED-03 | `POST /api/devoluciones` sin sesión | Rechaza con HTTP 401 "No hay sesión activa." | ✅ Pasa |
| UED-04 | `POST /api/devoluciones` cookie corrupta | Rechaza con HTTP 401 "La sesión está dañada..." | ✅ Pasa |
| UED-05 | `POST /api/devoluciones` exitoso | Inyecta usuario de sesión, registra y devuelve HTTP 200 | ✅ Pasa |
| UED-06 | `GET /api/devoluciones/pedidos-elegibles` | Responde HTTP 200 con lista de pedidos disponibles | ✅ Pasa |
| UED-07 | `GET /api/devoluciones/[id]` ID inválido | Rechaza con HTTP 400 | ✅ Pasa |
| UED-08 | `GET /api/devoluciones/[id]` detalle | Retorna HTTP 200 con datos de la devolución | ✅ Pasa |
| UED-09 | `PATCH /api/devoluciones/[id]/estado` body inválido | Rechaza con HTTP 400 | ✅ Pasa |
| UED-10 | `PATCH /api/devoluciones/[id]/estado` exitoso | Actualiza estado pasando usuario de sesión y devuelve HTTP 200 | ✅ Pasa |

---

## 4. Matriz de Pruebas de Integración (RF-11 · `tests/integration/devolucion.test.ts`)

| ID | Endpoint / Flujo | Escenario de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- | --- |
| **IDEV-01** | `GET /api/devoluciones/pedidos-elegibles` | Consulta pedidos elegibles para selección rápida | Responde HTTP 200 y contiene el pedido auxiliar con su destinatario y detalle | ✅ Pasa |
| **IDEV-02** | `POST /api/devoluciones` | Intento de creación sin cookie de sesión | Rechaza con HTTP 401 No hay sesión activa | ✅ Pasa |
| **IDEV-03** | `POST /api/devoluciones` | Creación con cookie de sesión corrupta | Rechaza con HTTP 401 Sesión dañada o inválida | ✅ Pasa |
| **IDEV-04** | `POST /api/devoluciones` | Producto no perteneciente al pedido indicado | Rechaza con HTTP 400 "no forma parte del pedido" | ✅ Pasa |
| **IDEV-05** | `POST /api/devoluciones` | Cantidad devuelta superior a la disponible | Rechaza con HTTP 400 "supera la cantidad disponible" | ✅ Pasa |
| **IDEV-06** | `POST /api/devoluciones` | Registro en estado PENDIENTE | Retorna HTTP 200, genera ID y confirma que el stock no fue alterado | ✅ Pasa |
| **IDEV-07** | `GET /api/devoluciones` | Filtro por pedido y estado PENDIENTE | Localiza la devolución creada en la base real | ✅ Pasa |
| **IDEV-08** | `GET /api/devoluciones/:id` | Consulta de detalle por clave primaria | Retorna relaciones completas (producto, pedido, destinatario, usuario) | ✅ Pasa |
| **IDEV-09** | `PATCH /api/devoluciones/:id/estado` | Aprobación de devolución (PENDIENTE → APROBADA) | Reingresa pan (+5 stock) y crea fila en `movimiento_inventario` (tipo `DEVOLUCION`) | ✅ Pasa |
| **IDEV-10** | `PATCH /api/devoluciones/:id/estado` | Intento de re-modificar devolución ya APROBADA | Rechaza con HTTP 400 impidiendo inconsistencias o doble reingreso | ✅ Pasa |
| **IDEV-11** | `POST /api/devoluciones` | Registro directo como APROBADA | Inserta devolución, actualiza stock de inmediato y genera movimiento | ✅ Pasa |
| **IDEV-12** | `PATCH /api/devoluciones/:id/estado` | Rechazo de devolución (PENDIENTE → RECHAZADA) | Cambia estado a RECHAZADA sin afectar el stock del producto | ✅ Pasa |
| **IDEV-13** | `GET /api/devoluciones` | Validación de coherencia en fechas (`desde > hasta`) | Rechaza con HTTP 400 Bad Request | ✅ Pasa |

---

## 5. Resumen de Defectos y Observaciones Detectadas en QA

| ID | Módulo | Tipo | Descripción | Acción realizada | Estado |
| --- | --- | --- | --- | --- | --- |
| **OBS-01** | RF-06 | Cobertura | Jose Carlos había eliminado las pruebas unitarias de alerta en commit `eb4d4`. | Se restauraron y ampliaron con cobertura exhaustiva (21 casos). | ✅ Resuelto |
| **OBS-02** | RF-06 | Integración | El módulo de alertas no contaba con pruebas automatizadas contra Supabase. | Se diseñó e implementó la suite completa `alerta-vencimiento.test.ts` (12 casos). | ✅ Resuelto |
| **OBS-03** | General | Mantenibilidad | Fecha fija en el pasado en `pedido.service.test.ts`. | Se actualizó a fecha futura válida garantizando estabilidad. | ✅ Resuelto |
| **OBS-04** | RF-07 | Cobertura | Carolina entregó búsqueda avanzada sin pruebas automatizadas. | Se diseñó e implementó cobertura completa (DTO, Service, Endpoint e Integración). | ✅ Resuelto |
| **OBS-05** | RF-08 | Cobertura | Alessandro entregó el reporte de movimientos sin pruebas unitarias ni de integración. | Se implementó la batería completa de 27 pruebas unitarias y 12 de integración. | ✅ Resuelto |
| **OBS-06** | RF-11 | Cobertura | Armando entregó el módulo de devoluciones sin pruebas automatizadas unitarias ni de integración. | Se implementó la batería completa de 45 pruebas unitarias y 13 de integración real con Supabase (58 pruebas en verde). | ✅ Resuelto |

---

## 6. Dictamen Final de QA (Sprint 4)

* **RF-06 (Alertas de vencimiento - Jose Carlos):** ✅ **APROBADO Y CERTIFICADO**
* **RF-07 (Búsqueda avanzada - Carolina):** ✅ **APROBADO Y CERTIFICADO**
* **RF-08 (Reporte de movimientos - Alessandro):** ✅ **APROBADO Y CERTIFICADO**
* **RF-11 (Gestión de devoluciones - Armando):** ✅ **APROBADO Y CERTIFICADO**

Todos los módulos entregados en el Sprint 4 se encuentran **100% cubiertos** por pruebas unitarias y de integración reales contra Supabase, garantizando 0 registros residuales.
