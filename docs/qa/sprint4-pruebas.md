# QA · Sprint 4 — Alertas de Vencimiento, Búsqueda Avanzada, Devoluciones y Reportes

| Campo                    | Detalle                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Sprint                   | 4 (18 de octubre – 07 de noviembre)                                                                                         |
| Módulos asignados        | Alertas de vencimiento (Jose Carlos) · Búsqueda avanzada (Carolina) · Gestión de devoluciones (Armando) · Reporte de movimientos (Alessandro) |
| Requerimientos cubiertos | **RF-06** Alertas de vencimiento · **RF-07** Búsqueda avanzada · **RF-11** Devoluciones · **RF-08** Reporte de movimientos    |
| Responsable QA           | Manuel                                                                                                                       |
| Rama de trabajo          | `manuelBranch`                                                                                                               |
| Fecha de certificación   | 13/10/2026 (Certificación Ronda 1: RF-06 Alertas de vencimiento de Jose Carlos)                                             |

---

## 1. Alcance

Siguiendo la arquitectura en capas del sistema SGI:

```text
Frontend (Vue / Composables) → API (server/api) → DTO (Zod) → Service → Repository → Supabase (PostgreSQL)
```

### Componentes evaluados en esta entrega (RF-06)

| Módulo / RF | Capa | Archivo evaluado |
| --- | --- | --- |
| **RF-06** Alertas de vencimiento | Frontend | `app/components/alertas/CampanaAlertas.vue` (Campana interactiva, modal dropdown, badges dinámicos) |
| | Composable | `app/composables/useAlertasVencimiento.ts` (Estado reactivo, polling y filtros) |
| | Layout | `app/layouts/default.vue` (Incrustación en header del sistema) |
| | API Endpoint | `server/api/alertas/vencimientos.get.ts` |
| | DTO | `server/dtos/alerta.dto.ts` (`ConsultaAlertasSchema`) |
| | Service | `server/services/alerta.service.ts` (`calcularDiasDiferencia`, `obtenerAlertasVencimiento`) |
| | Repository | `server/repositories/alerta.repository.ts` (`obtenerDiasConfiguracion`, `obtenerLotesCandidatos`) |

---

## 2. Herramientas y comandos de ejecución

| Tipo de prueba | Archivo de prueba | Comando de ejecución | Conexión a Supabase | Estado |
| --- | --- | --- | --- | --- |
| Unitarias (DTO) | `tests/unit/alerta/alerta.dto.test.ts` | `npx vitest run tests/unit/alerta/alerta.dto.test.ts` | No (Mock / Zod) | ✅ 8/8 Pasan |
| Unitarias (Service) | `tests/unit/alerta/alerta.service.test.ts` | `npx vitest run tests/unit/alerta/alerta.service.test.ts` | No (Mock isolated) | ✅ 8/8 Pasan |
| Unitarias (Endpoint) | `tests/unit/alerta/alerta.endpoint.test.ts` | `npx vitest run tests/unit/alerta/alerta.endpoint.test.ts` | No (H3 Mock) | ✅ 5/5 Pasan |
| **Integración real** | `tests/integration/alerta-vencimiento.test.ts` | `npx vitest run tests/integration/alerta-vencimiento.test.ts --config vitest.integration.config.ts` | Sí (Base compartida Supabase) | ✅ 12/12 Pasan |

### Reglas de integridad sobre la base compartida (Supabase)
- **Marca identificadora:** Todo dato creado en pruebas lleva el prefijo `[QA-TEST]` y un timestamp (`corrida`) único.
- **Limpieza en orden estricto de dependencias foráneas (`afterAll`):**
  1. `lote` (eliminación de los lotes de prueba insertados).
  2. `producto` (eliminación de los productos auxiliares de prueba).
- **Verificación de residuales:** Se garantiza **0 registros residuales** tras finalizar la ejecución de las pruebas.

---

## 3. Matriz de Pruebas Unitarias (RF-06)

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

## 4. Matriz de Pruebas de Integración (RF-06 · `tests/integration/alerta-vencimiento.test.ts`)

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

---

## 5. Resumen de Defectos y Observaciones Detectadas en QA

| ID | Tipo | Descripción | Acción realizada | Estado |
| --- | --- | --- | --- | --- |
| **OBS-01** | Cobertura | Jose Carlos había eliminado los archivos de pruebas unitarias en el commit `eb4d4`. | Se restauraron y ampliaron con cobertura exhaustiva (DTO, Service y Endpoint). | ✅ Resuelto |
| **OBS-02** | Integración | El módulo de alertas no contaba con pruebas automatizadas contra la base de datos Supabase. | Se diseñó e implementó la suite completa `alerta-vencimiento.test.ts` con 12 casos certificados. | ✅ Resuelto |
| **OBS-03** | Mantenibilidad | En `pedido.service.test.ts` existía una fecha de prueba fija en el pasado que provocaba fallo tras el cambio de fecha. | Se actualizó a una fecha futura válida garantizando 100% de pruebas en verde. | ✅ Resuelto |

---

## 6. Dictamen de QA para el RF-06
El requerimiento **RF-06 (Alertas de vencimiento)** desarrollado por Jose Carlos cumple satisfactoriamente con los criterios de calidad, arquitectura en capas, lógica de negocio y pruebas de integración. 

**Certificación de QA: APROBADO (100% Verde).**
