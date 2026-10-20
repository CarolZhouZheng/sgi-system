# QA · Sprint 4 — Alertas de Vencimiento, Búsqueda Avanzada, Devoluciones y Reportes

| Campo                    | Detalle                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Sprint                   | 4 (18 de octubre – 07 de noviembre)                                                                                         |
| Módulos asignados        | Alertas de vencimiento (Jose Carlos) · Búsqueda avanzada (Carolina) · Gestión de devoluciones (Armando) · Reporte de movimientos (Alessandro) |
| Requerimientos cubiertos | **RF-06** Alertas de vencimiento · **RF-07** Búsqueda avanzada · **RF-11** Devoluciones · **RF-08** Reporte de movimientos    |
| Responsable QA           | Manuel                                                                                                                       |
| Rama de trabajo          | `manuelBranch`                                                                                                               |
| Fechas de certificación  | **13/10/2026:** Ronda 1 (RF-06 Jose Carlos) · **19/10/2026:** Ronda 2 (RF-07 Carolina) · **20/10/2026:** Ronda 3 (RF-08 Alessandro) |

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

### Reglas de integridad sobre la base compartida (Supabase)
- **Marca identificadora:** Todo dato creado en pruebas lleva el prefijo `[QA-TEST]` y un timestamp (`corrida`) único.
- **Limpieza en orden estricto de dependencias foráneas (`afterAll`):**
  1. `movimiento_inventario` y `lote` (eliminación de registros hijos).
  2. `producto` (eliminación de productos auxiliares de prueba).
- **Verificación de residuales:** Se garantiza **0 registros residuales** tras finalizar la ejecución de las suites.

---

## 3. Matriz de Pruebas Unitarias (RF-08 · Reporte de Movimientos)

### 3.1 DTO (`ConsultaMovimientosSchema`)
| ID | Caso de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UDM-01 | Parámetros vacíos `{}` | Aplica defaults (`limite: 500`) y campos opcionales `undefined` | ✅ Pasa |
| UDM-02 | Tratamiento de espacios y cadenas vacías | Convierte a `undefined` sin lanzar error | ✅ Pasa |
| UDM-03 | Rango de fechas ISO válido (`AAAA-MM-DD`) | Valida con éxito | ✅ Pasa |
| UDM-04 | Formato de fecha inválido (`01/10/2026`) | Rechaza con error de validación Zod | ✅ Pasa |
| UDM-05 | Incoherencia de fechas (`desde > hasta`) | Rechaza con mensaje descriptivo ("La fecha 'desde' no puede ser posterior a la fecha 'hasta'") | ✅ Pasa |
| UDM-06 | Fechas iguales (`desde === hasta`) | Valida con éxito permitiendo consultar un único día | ✅ Pasa |
| UDM-07 | ID de producto numérico y positivo | Valida con coerción; rechaza 0 y números negativos | ✅ Pasa |
| UDM-08 | Normalización de tipo de movimiento | Aplica `trim` y convierte a mayúsculas | ✅ Pasa |
| UDM-09 | Validación de límites (1 a 1000) | Acepta valores en el rango; rechaza 0 y > 1000 | ✅ Pasa |

### 3.2 Lógica de Negocio (`MovimientoService`)
| ID | Caso de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| USM-01 | Cálculo de rango de fechas ISO | Ajusta zona horaria Costa Rica (`-06:00`) y suma 1 día en UTC para fecha fin inclusiva | ✅ Pasa |
| USM-02 | Descripción de origen del movimiento | Retorna `Pérdida #X`, `Producción #X`, `Devolución #X` o `Lote #X` según referencia | ✅ Pasa |
| USM-03 | Mapeo de dirección ENTRADA | Asigna `ENTRADA` cuando `variacion > 0` | ✅ Pasa |
| USM-04 | Mapeo de dirección SALIDA | Asigna `SALIDA` cuando `variacion < 0` | ✅ Pasa |
| USM-05 | Concatenación de nombre de usuario | Concatena nombre y apellido o recurre a username / ID | ✅ Pasa |
| USM-06 | Cálculo de resumen global | Total de movimientos, entradas, salidas y productos afectados consistentes | ✅ Pasa |
| USM-07 | Resumen por tipo de movimiento | Agrupa cantidades por tipo ordenadas de mayor a menor | ✅ Pasa |
| USM-08 | Resumen por producto | Calcula acumulados de entradas, salidas y neto ordenado alfabéticamente | ✅ Pasa |
| USM-09 | Detección de reporte truncado | Marca `truncado: true` cuando la base contiene más filas que el límite solicitado | ✅ Pasa |
| USM-10 | Orquestación con repositorio | Coordina consulta de filas y tipos disponibles | ✅ Pasa |

### 3.3 Endpoint Unitario (`GET /api/movimientos`)
| ID | Caso de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UEM-01 | Consulta estándar sin query params | Responde HTTP 200 con estructura `{ success, total, data, resumen, tipos_disponibles }` | ✅ Pasa |
| UEM-02 | Consulta con filtros completos válidos | Pasa parámetros validados al servicio | ✅ Pasa |
| UEM-03 | Rango de fechas invertido (`desde > hasta`) | Rechaza con HTTP 400 | ✅ Pasa |
| UEM-04 | Límite superior excedido (`limite: 2000`) | Rechaza con HTTP 400 | ✅ Pasa |
| UEM-05 | Excepción interna del repositorio o servicio | Captura y responde con HTTP 500 descriptivo | ✅ Pasa |

---

## 4. Matriz de Pruebas de Integración (RF-08 · `tests/integration/movimiento-reporte.test.ts`)

| ID | Endpoint / Flujo | Escenario de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- | --- |
| **IMO-01** | `GET /api/movimientos` | Consulta estándar del endpoint | Responde HTTP 200 con estructura completa | ✅ Pasa |
| **IMO-02** | `GET /api/movimientos?id_producto=X` | Filtro por producto específico | Devuelve únicamente movimientos del producto seleccionado | ✅ Pasa |
| **IMO-03** | `GET /api/movimientos?tipo=PERDIDA` | Filtro por tipo de movimiento | Retorna únicamente movimientos del tipo indicado | ✅ Pasa |
| **IMO-04** | `GET /api/movimientos?desde=...&hasta=...` | Filtro por rango de fechas | Devuelve movimientos generados en el rango estipulado | ✅ Pasa |
| **IMO-05** | `GET /api/movimientos?desde=...&hasta=...` (invertido) | Validación de fechas | Rechaza con HTTP 400 Bad Request | ✅ Pasa |
| **IMO-06** | `GET /api/movimientos?limite=0` | Validación de límite | Rechaza con HTTP 400 Bad Request | ✅ Pasa |
| **IMO-07** | `GET /api/movimientos` | Validación de dirección y variación | `ENTRADA` con variación positiva y `SALIDA` con variación negativa | ✅ Pasa |
| **IMO-08** | `GET /api/movimientos` | Consistencia del resumen general | Conteos de entradas, salidas y total concuerdan con la lista | ✅ Pasa |
| **IMO-09** | `GET /api/movimientos` | Resumen por producto en base real | Calcula entradas (30), salidas (5) y neto (25) de forma exacta | ✅ Pasa |
| **IMO-10** | `GET /api/movimientos` | Resumen por tipo en base real | Agrupación estadística de tipos existentes (`PRODUCCION`, etc.) | ✅ Pasa |
| **IMO-11** | `GET /api/movimientos` | Catálogo de tipos disponibles | Retorna lista ordenada de tipos únicos registrados en la base | ✅ Pasa |
| **IMO-12** | `GET /api/movimientos` | Relación con tabla usuario | Resuelve nombre del usuario responsable en cada movimiento | ✅ Pasa |

---

## 5. Resumen de Defectos y Observaciones Detectadas en QA

| ID | Módulo | Tipo | Descripción | Acción realizada | Estado |
| --- | --- | --- | --- | --- | --- |
| **OBS-01** | RF-06 | Cobertura | Jose Carlos había eliminado las pruebas unitarias de alerta en commit `eb4d4`. | Se restauraron y ampliaron con cobertura exhaustiva (21 casos). | ✅ Resuelto |
| **OBS-02** | RF-06 | Integración | El módulo de alertas no contaba con pruebas automatizadas contra Supabase. | Se diseñó e implementó la suite completa `alerta-vencimiento.test.ts` (12 casos). | ✅ Resuelto |
| **OBS-03** | General | Mantenibilidad | Fecha fija en el pasado en `pedido.service.test.ts`. | Se actualizó a fecha futura válida garantizando estabilidad. | ✅ Resuelto |
| **OBS-04** | RF-07 | Cobertura | Carolina entregó búsqueda avanzada sin pruebas automatizadas. | Se diseñó e implementó cobertura completa (DTO, Service, Endpoint e Integración). | ✅ Resuelto |
| **OBS-05** | RF-08 | Cobertura | Alessandro entregó el reporte de movimientos sin pruebas unitarias ni de integración. | Se implementó la batería completa de 27 pruebas unitarias y 12 de integración. | ✅ Resuelto |

---

## 6. Dictamen Final de QA (Sprint 4)

* **RF-06 (Alertas de vencimiento - Jose Carlos):** ✅ **APROBADO Y CERTIFICADO**
* **RF-07 (Búsqueda avanzada - Carolina):** ✅ **APROBADO Y CERTIFICADO**
* **RF-08 (Reporte de movimientos - Alessandro):** ✅ **APROBADO Y CERTIFICADO**

Todos los módulos entregados hasta la fecha en el Sprint 4 se encuentran 100% cubiertos por pruebas unitarias y de integración reales contra Supabase, garantizando 0 registros residuales.
