# QA · Sprint 4 — Alertas de Vencimiento, Búsqueda Avanzada, Devoluciones y Reportes

| Campo                    | Detalle                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Sprint                   | 4 (18 de octubre – 07 de noviembre)                                                                                         |
| Módulos asignados        | Alertas de vencimiento (Jose Carlos) · Búsqueda avanzada (Carolina) · Gestión de devoluciones (Armando) · Reporte de movimientos (Alessandro) |
| Requerimientos cubiertos | **RF-06** Alertas de vencimiento · **RF-07** Búsqueda avanzada · **RF-11** Devoluciones · **RF-08** Reporte de movimientos    |
| Responsable QA           | Manuel                                                                                                                       |
| Rama de trabajo          | `manuelBranch`                                                                                                               |
| Fechas de certificación  | **13/10/2026:** Ronda 1 (RF-06 Alertas de vencimiento de Jose Carlos) · **19/10/2026:** Ronda 2 (RF-07 Búsqueda avanzada de Carolina) |

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

### Reglas de integridad sobre la base compartida (Supabase)
- **Marca identificadora:** Todo dato creado en pruebas lleva el prefijo `[QA-TEST]` y un timestamp (`corrida`) único.
- **Limpieza en orden estricto de dependencias foráneas (`afterAll`):**
  1. `lote` (eliminación de lotes auxiliares de prueba).
  2. `producto` (eliminación de productos auxiliares de prueba).
- **Verificación de residuales:** Se garantiza **0 registros residuales** tras finalizar la ejecución de las suites.

---

## 3. Matriz de Pruebas Unitarias (RF-06 · Alertas de Vencimiento)

### 3.1 DTO (`ConsultaAlertasSchema`)
| ID | Caso de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UD-01 | Parámetros vacíos `{}` | Valida con éxito asignando `undefined` a campos opcionales | ✅ Pasa |
| UD-02 | Conversión de strings numéricos (`'7'`) | Transforma a `number` entero `7` | ✅ Pasa |
| UD-03 | Conversión de strings booleanos (`'true'`) | Transforma a `boolean` `true` | ✅ Pasa |
| UD-04 | Límite inferior permitido (`dias_anticipacion = 1`) | Valida con éxito | ✅ Pasa |
| UD-05 | Límite superior permitido (`dias_anticipacion = 365`) | Valida con éxito | ✅ Pasa |
| UD-06 | Días menores que 1 (`0`, `-5`) | Rechaza con error de validación Zod | ✅ Pasa |
| UD-07 | Días mayores que 365 (`366`) | Rechaza con error de validación Zod | ✅ Pasa |
| UD-08 | Valores vacíos o no numéricos (`''`, `'texto'`) | Trata como opcional asignando `undefined` | ✅ Pasa |

### 3.2 Lógica de Negocio (`AlertaService`)
| ID | Caso de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| US-01 | Fecha vencimiento igual a hoy | Diferencia calculada = 0 | ✅ Pasa |
| US-02 | Fecha vencimiento futura | Diferencia positiva en días | ✅ Pasa |
| US-03 | Fecha vencimiento pasada (vencido) | Diferencia negativa en días | ✅ Pasa |
| US-04 | Umbral estándar (3 días) y clasificación | Clasifica `CRITICO` (vencidos y hoy), `ALTO` (1-2 días), `MEDIO` (3 días); excluye lotes con más días | ✅ Pasa |
| US-05 | Generación de mensajes descriptivos | Genera `Venció hace X días`, `Vence hoy`, `Vence mañana`, `Vence en X días` | ✅ Pasa |
| US-06 | Ordenamiento de prioridad | Orden ascendente por `dias_restantes` (los más vencidos primero) | ✅ Pasa |
| US-07 | Umbral personalizado (`dias_anticipacion`) | Respeta el umbral dinámico sin consultar configuración | ✅ Pasa |
| US-08 | Filtros exclusivos (`solo_vencidos` / `solo_por_vencer`) | Retorna únicamente los lotes del estado filtrado manteniendo el resumen global | ✅ Pasa |

### 3.3 Endpoint Unitario (`GET /api/alertas/vencimientos`)
| ID | Caso de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UE-01 | Días de anticipación menor que 1 (`0`, `-1`) | Rechaza con HTTP 400 (`Parámetros de consulta inválidos.`) | ✅ Pasa |
| UE-02 | Días de anticipación superior a 365 (`400`) | Rechaza con HTTP 400 (`Parámetros de consulta inválidos.`) | ✅ Pasa |
| UE-03 | Consulta por defecto sin parámetros | Responde 200 con `{ success: true, data: [...], resumen: {...} }` | ✅ Pasa |
| UE-04 | Consulta con filtros válidos (`dias_anticipacion=15`, `solo_vencidos=true`) | Pasa los parámetros transformados a la capa de servicio | ✅ Pasa |
| UE-05 | Excepción interna del servicio | Propaga el error adecuadamente con su status correspondiente | ✅ Pasa |

---

## 4. Matriz de Pruebas Unitarias (RF-07 · Búsqueda Avanzada)

### 4.1 DTO (`FiltroProductosSchema`)
| ID | Caso de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UDF-01 | Parámetros vacíos `{}` | Asigna default `stock: 'todos'` y campos opcionales `undefined` | ✅ Pasa |
| UDF-02 | Conversión de estado desde string (`'true'` / `'false'`) | Transforma a booleano correspondiente | ✅ Pasa |
| UDF-03 | Manejo de estado vacío (`''`) | Asigna `undefined` (sin filtro de estado) | ✅ Pasa |
| UDF-04 | Limpieza con trim en búsqueda y categoría | Remueve espacios al inicio y final | ✅ Pasa |
| UDF-05 | Valores permitidos de stock (`'todos'`, `'bajo'`, `'disponible'`, `'agotado'`) | Valida con éxito | ✅ Pasa |
| UDF-06 | Opción de stock no permitida (`'invalido'`) | Rechaza con error de validación Zod | ✅ Pasa |

### 4.2 Lógica de Negocio (`ProductoService.listarProductos`)
| ID | Caso de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| USF-01 | Delegación de filtros al repositorio | Envía objeto de filtros al método `listar` del repositorio | ✅ Pasa |
| USF-02 | Filtro en memoria para `stock: 'bajo'` | Filtra conservando únicamente productos con `stock_actual <= stock_minimo` | ✅ Pasa |
| USF-03 | Filtro `stock: 'disponible'` o `'todos'` | No aplica filtro restrictivo por stock mínimo en servicio | ✅ Pasa |

### 4.3 Endpoint Unitario (`GET /api/productos`)
| ID | Caso de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UEF-01 | Consulta estándar sin query params | Procesa con defaults y responde `{ success: true, total, data }` | ✅ Pasa |
| UEF-02 | Parámetros completos de búsqueda y filtros válidos | Pasa filtros validados al servicio | ✅ Pasa |
| UEF-03 | Parámetro stock con valor inválido | Rechaza con HTTP 400 (`Parámetros de búsqueda inválidos`) | ✅ Pasa |
| UEF-04 | Excepción interna del servicio | Propaga error con código de estado HTTP correspondiente | ✅ Pasa |

---

## 5. Matriz de Pruebas de Integración Reales con Supabase

### 5.1 RF-06 · Alertas de Vencimiento (`tests/integration/alerta-vencimiento.test.ts`)
| ID | Endpoint / Flujo | Escenario de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- | --- |
| **IAL-01** | `GET /api/alertas/vencimientos` | Consulta estándar del endpoint | Responde HTTP 200 con estructura `{ success: true, data, resumen }` | ✅ Pasa |
| **IAL-02** | `GET /api/alertas/vencimientos` | Detección de lotes dentro del umbral | Incluye lotes vencidos, lote de hoy y lotes por vencer en ≤ 3 días | ✅ Pasa |
| **IAL-03** | `GET /api/alertas/vencimientos` | Exclusión de lotes fuera del umbral | Excluye lotes cuya fecha de vencimiento supere los 3 días configurados | ✅ Pasa |
| **IAL-04** | `GET /api/alertas/vencimientos` | Filtro de activos y existencias | Excluye lotes inactivos (`estado: false`) y lotes agotados (`cantidad: 0`) | ✅ Pasa |
| **IAL-05** | `GET /api/alertas/vencimientos` | Validación de lote vencido | `estado_vencimiento: 'VENCIDO'`, `urgencia: 'CRITICO'`, `dias_restantes < 0` | ✅ Pasa |
| **IAL-06** | `GET /api/alertas/vencimientos` | Validación de lote que vence hoy | `estado_vencimiento: 'POR_VENCER'`, `urgencia: 'CRITICO'`, `dias_restantes: 0` | ✅ Pasa |
| **IAL-07** | `GET /api/alertas/vencimientos` | Validación de lote que vence en 2 días | `estado_vencimiento: 'POR_VENCER'`, `urgencia: 'ALTO'`, `dias_restantes: 2` | ✅ Pasa |
| **IAL-08** | `GET /api/alertas/vencimientos?dias_anticipacion=60` | Ampliación de umbral por parámetro | Incluye el lote lejano (45 días) y actualiza `resumen.dias_umbral_alerta: 60` | ✅ Pasa |
| **IAL-09** | `GET /api/alertas/vencimientos?solo_vencidos=true` | Filtro exclusivo de vencidos | Retorna únicamente lotes vencidos excluyendo lotes por vencer | ✅ Pasa |
| **IAL-10** | `GET /api/alertas/vencimientos?solo_por_vencer=true` | Filtro exclusivo de por vencer | Retorna únicamente lotes por vencer excluyendo lotes vencidos | ✅ Pasa |
| **IAL-11** | `GET /api/alertas/vencimientos?dias_anticipacion=-5` | Validación de parámetros fuera de rango | Rechaza con HTTP 400 (`Parámetros de consulta inválidos.`) | ✅ Pasa |
| **IAL-12** | `GET /api/alertas/vencimientos` | Consistencia estadística del resumen | `total = total_vencidos + total_por_vencer` consistente con registros reales | ✅ Pasa |

### 5.2 RF-07 · Búsqueda Avanzada de Productos (`tests/integration/producto-busqueda.test.ts`)
| ID | Endpoint / Flujo | Escenario de prueba | Resultado esperado | Estado |
| --- | --- | --- | --- | --- |
| **IBA-01** | `GET /api/productos?busqueda=Frances` | Búsqueda por texto en nombre | Responde 200 retornando exclusivamente el producto con ese nombre | ✅ Pasa |
| **IBA-02** | `GET /api/productos?busqueda=arequipe` | Búsqueda por texto en descripción | Responde 200 retornando el producto con esa descripción | ✅ Pasa |
| **IBA-03** | `GET /api/productos?busqueda=mIlHoJaS` | Búsqueda insensible a mayúsculas/minúsculas | Coincidencia ILIKE efectiva en base de datos | ✅ Pasa |
| **IBA-04** | `GET /api/productos?categoria=Reposteria` | Filtro exacto por categoría | Devuelve solo productos correspondientes a la categoría seleccionada | ✅ Pasa |
| **IBA-05** | `GET /api/productos?estado=true` | Filtro por productos activos | Excluye productos dados de baja (`estado: false`) | ✅ Pasa |
| **IBA-06** | `GET /api/productos?estado=false` | Filtro por productos inactivos | Devuelve productos dados de baja | ✅ Pasa |
| **IBA-07** | `GET /api/productos?stock=disponible` | Filtro de stock disponible | Devuelve productos con existencias (`stock_actual > 0`) | ✅ Pasa |
| **IBA-08** | `GET /api/productos?stock=agotado` | Filtro de stock agotado | Devuelve productos sin existencias (`stock_actual <= 0`) | ✅ Pasa |
| **IBA-09** | `GET /api/productos?stock=bajo` | Filtro de stock bajo (alerta mínima) | Devuelve productos con `stock_actual <= stock_minimo` | ✅ Pasa |
| **IBA-10** | `GET /api/productos?busqueda=...&categoria=...&estado=...&stock=...` | Búsqueda combinada multicriterio | Filtra con precisión cruzando todos los criterios | ✅ Pasa |
| **IBA-11** | `GET /api/productos?stock=invalido` | Validación de parámetros | Rechaza con HTTP 400 (`Parámetros de búsqueda inválidos`) | ✅ Pasa |
| **IBA-12** | `GET /api/productos` | Coherencia del total | `total === data.length` en todas las consultas | ✅ Pasa |

---

## 6. Resumen de Defectos y Observaciones Detectadas en QA

| ID | Módulo | Tipo | Descripción | Acción realizada | Estado |
| --- | --- | --- | --- | --- | --- |
| **OBS-01** | RF-06 | Cobertura | Jose Carlos había eliminado las pruebas unitarias de alerta en commit `eb4d4`. | Se restauraron y ampliaron con cobertura exhaustiva (21 casos). | ✅ Resuelto |
| **OBS-02** | RF-06 | Integración | El módulo de alertas no contaba con pruebas automatizadas contra Supabase. | Se diseñó e implementó la suite completa `alerta-vencimiento.test.ts` (12 casos). | ✅ Resuelto |
| **OBS-03** | General | Mantenibilidad | Fecha fija en el pasado en `pedido.service.test.ts`. | Se actualizó a fecha futura válida garantizando estabilidad. | ✅ Resuelto |
| **OBS-04** | RF-07 | Cobertura | Carolina entregó la funcionalidad de búsqueda avanzada sin pruebas unitarias ni de integración. | Se diseñó e implementó la cobertura completa (DTO, Service, Endpoint e Integración). | ✅ Resuelto |

---

## 7. Dictamen Final de QA (Sprint 4)

* **RF-06 (Alertas de vencimiento - Jose Carlos):** ✅ **APROBADO Y CERTIFICADO**
* **RF-07 (Búsqueda avanzada - Carolina):** ✅ **APROBADO Y CERTIFICADO**

Ambos módulos cumplen a cabalidad con la arquitectura en capas, validación Zod, lógica de negocio y pruebas reales contra Supabase sin registros residuales.
