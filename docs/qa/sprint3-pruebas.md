# QA · Sprint 3 — Cola de Producción y Registro de Mermas

| Campo                    | Detalle                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| Sprint                   | 3 (03 de octubre – 17 de octubre)                                                           |
| Módulos                  | Cola de Producción (Jose Carlos) · Gestión de Mermas / Desperdicios (Carolina)               |
| Requerimientos cubiertos | **RF-20** Cola de producción en tiempo real · **RF-09** Registrar mermas                    |
| Responsable QA           | Armando Solis                                                                                |
| Rama                     | `ArmandoBranch`                                                                              |
| Fecha de ejecución       | 06/10/2026 – 07/10/2026 (ronda 1: verificación inicial · ronda 2: re-prueba y módulo mermas) |

---

## 1. Alcance

Se evaluaron los requerimientos asignados y desarrollados para el Sprint 3 siguiendo la arquitectura en capas del proyecto:

```text
Frontend (Vue / Composables) → API (server/api) → DTO (Zod) → Service → Repository (RPC / SQL) → Supabase
```

| Módulo / RF | Capa | Archivos cubiertos |
| --- | --- | --- |
| **RF-20** Cola de producción | API | `server/api/produccion/index.get.ts`, `index.post.ts`, `[id]/index.get.ts`, `[id]/index.put.ts`, `[id]/estado.patch.ts` |
| | DTO | `server/dtos/produccion.dto.ts` |
| | Service | `server/services/produccion.service.ts` |
| | Repository | `server/repositories/produccion.repository.ts` |
| | Frontend | `app/pages/produccion/index.vue`, `app/components/produccion/ColaProduccion.vue` |
| **RF-09** Registrar mermas | API | `server/api/perdida/index.post.ts` |
| | DTO | `server/dtos/perdida.dto.ts` |
| | Service | `server/services/perdida.service.ts` |
| | Repository | `server/repositories/perdida.repository.ts` · RPC `registrar_perdida_inventario` |
| | Frontend | `app/pages/perdidas/index.vue`, `app/components/perdida/RegistrarPerdida/` |

---

## 2. Herramientas y comandos de ejecución

| Tipo | Herramienta | Comando | ¿Toca Supabase? | ¿Corre en CI? |
| --- | --- | --- | --- | --- |
| Unitarias | Vitest | `npm test` | No (mocks aislados) | Sí |
| Integración RF-20 | Vitest + `@nuxt/test-utils` | `npx vitest run tests/integration/produccion.test.ts --config vitest.integration.config.ts` | Sí (base compartida) | No (`.env`) |
| Integración RF-09 | Vitest + `@nuxt/test-utils` | `npx vitest run tests/integration/perdida.test.ts --config vitest.integration.config.ts` | Sí (base compartida) | No (`.env`) |
| Todas las de integración | Vitest + `@nuxt/test-utils` | `npm run test:integration` | Sí (base compartida) | No (`.env`) |

### Reglas de integridad en la base compartida (Supabase)

- **Marca identificadora:** Todo dato creado lleva la marca `[QA-TEST]` y un timestamp (`corrida`) único.
- **Limpieza en orden estricto de dependencias foráneas (`afterAll`):**
  1. `auditoria` (registros con `tabla_afectada in ('produccion', 'perdida')`).
  2. `movimiento_inventario` (registros asociados a `id_perdida`).
  3. `perdida` (registros de mermas creados).
  4. `produccion` (órdenes de producción creadas).
  5. `detalle_pedido` y `pedido` (pedidos auxiliares).
  6. `lote` (lotes auxiliares creados).
  7. `destinatario` y `producto` (registros auxiliares creados).
- **Usuarios existentes:** Únicamente se consultan en modo lectura (`estado = true`).
- **Verificación posterior:** Confirmado **0 registros residuales** `[QA-TEST]` en Supabase tras la ejecución de las suites.

---

## 3. Resumen general de resultados

| Módulo / Requerimiento | Tipo de prueba | Casos totales | Pasan | Defectos activos (`it.fails`) | Estado |
| --- | --- | --- | --- | --- | --- |
| **RF-20** Cola de producción | Unitarias (DTO + Service) | 25 | 25 | 0 | ✅ Completo |
| **RF-20** Cola de producción | Integración (API real) | 20 | 20 | 0 (D-16 y D-17 corregidos) | ✅ Completo |
| **RF-09** Registrar mermas | Unitarias (DTO + Service) | 17 | 17 | 0 | ✅ Completo |
| **RF-09** Registrar mermas | Integración (API real) | 20 | 18 | 2 (**D-18**, **D-19**) | ⚠️ Funcional OK / Defectos de sesión documentados |
| **Total Sprint 3** | **Todas** | **82** | **80** | **2** | **Suite en verde** |

---

## 4. Matriz de pruebas unitarias

### 4.1 RF-20 · DTO de Producción (`tests/unit/produccion.dto.spec.ts`)

| ID | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UPR-01 | Creación con datos válidos | Pasa validación Zod | ✅ Pasa |
| UPR-02 | Valores por defecto (`cantidad_producida: 0`, `estado: PENDIENTE`) | Asigna valores por defecto | ✅ Pasa |
| UPR-03 | Rechaza cantidad planificada cero o negativa | Error de validación Zod | ✅ Pasa |
| UPR-04 | Rechaza producto inválido (`id_producto <= 0`) | Error de validación Zod | ✅ Pasa |
| UPR-05 | Rechaza usuario inválido (`id_usuario <= 0`) | Error de validación Zod | ✅ Pasa |
| UPR-06 | Transforma estado a mayúsculas | Convierte string | ✅ Pasa |
| UPR-07 | Rechaza estado no permitido | Error de validación Zod | ✅ Pasa |
| UPR-08 | Rechaza cantidad producida negativa | Error de validación Zod | ✅ Pasa |
| UPR-09 | Valida ID de parámetro numérico positivo | Pasa validación | ✅ Pasa |
| UPR-10 | Rechaza ID no numérico o decimal | Error de validación Zod | ✅ Pasa |

### 4.2 RF-20 · Servicio de Producción (`tests/unit/produccion.service.spec.ts`)

| ID | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UPS-01 | Listar cola: orden por estado y prioridad | `EN_PROCESO` > `PENDIENTE`, `URGENTE` > `NORMAL` | ✅ Pasa |
| UPS-02 | Obtener por ID existente | Retorna orden con detalle | ✅ Pasa |
| UPS-03 | Obtener por ID inexistente | Arroja error 404 | ✅ Pasa |
| UPS-04 | Registrar orden con producto inexistente | Arroja error 400 | ✅ Pasa |
| UPS-05 | Registrar orden con usuario inactivo | Arroja error 400 | ✅ Pasa |
| UPS-06 | Registrar orden con pedido inexistente | Arroja error 400 | ✅ Pasa |
| UPS-07 | Registro exitoso y auditoría | Retorna orden creada | ✅ Pasa |
| UPS-08 | Cambiar estado de orden COMPLETADA | Rechaza con 400 | ✅ Pasa |
| UPS-09 | Cambiar estado de orden CANCELADA | Rechaza con 400 | ✅ Pasa |
| UPS-10 | Cambiar a COMPLETADA sin cantidad producida | Asigna cantidad planificada | ✅ Pasa |

### 4.3 RF-09 · DTO de Mermas (`tests/unit/perdida.dto.test.ts`)

| ID | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UDTO-01 | Acepta datos válidos y completos con lote | Pasa validación Zod | ✅ Pasa |
| UDTO-02 | Acepta payload mínimo sin lote, fecha ni observaciones | Pasa validación Zod | ✅ Pasa |
| UDTO-03 | Acepta `id_lote` explícitamente en `null` | Conserva `id_lote: null` | ✅ Pasa |
| UDTO-04 | Realiza `trim` de motivo y tipo de merma | Limpia espacios exteriores | ✅ Pasa |
| UDTO-05 | Rechaza cantidad igual a cero | Error de validación Zod | ✅ Pasa |
| UDTO-06 | Rechaza cantidad negativa | Error de validación Zod | ✅ Pasa |
| UDTO-07 | Rechaza `id_producto <= 0` | Error de validación Zod | ✅ Pasa |
| UDTO-08 | Rechaza `id_producto` decimal | Error de validación Zod | ✅ Pasa |
| UDTO-09 | Rechaza `id_usuario <= 0` | Error de validación Zod | ✅ Pasa |
| UDTO-10 | Rechaza `id_lote <= 0` si se envía número | Error de validación Zod | ✅ Pasa |
| UDTO-11 | Rechaza motivo vacío o solo espacios | Error de validación Zod | ✅ Pasa |
| UDTO-12 | Rechaza tipo_perdida vacío o solo espacios | Error de validación Zod | ✅ Pasa |
| UDTO-13 | Rechaza payload vacío o campos obligatorios faltantes | Error de validación Zod | ✅ Pasa |

### 4.4 RF-09 · Servicio de Mermas (`tests/unit/perdida.service.test.ts`)

| ID | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| USERV-01 | Valida y delega creación al repositorio | Llama a `registrarPerdida` con datos validados | ✅ Pasa |
| USERV-02 | Faltan campos requeridos en payload | Lanza error de validación sin invocar repositorio | ✅ Pasa |
| USERV-03 | Cantidad cero o negativa | Lanza error de validación sin invocar repositorio | ✅ Pasa |
| USERV-04 | Propaga excepciones arrojadas por la base de datos | Re-lanza mensaje de error original (ej. stock insuficiente) | ✅ Pasa |

---

## 5. Matriz de pruebas de integración

### 5.1 RF-20 · Cola de Producción (`tests/integration/produccion.test.ts`)

| ID | Endpoint | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- | --- |
| **IPR-01** | `POST /api/produccion` | Registrar orden válida con valores por defecto | 201 Created (`estado: PENDIENTE`, `cantidad_producida: 0`) | ✅ Pasa |
| **IPR-02** | `POST /api/produccion` | Registro de auditoría en Supabase | Crea fila en tabla `auditoria` con acción `REGISTRAR_ORDEN_PRODUCCION` | ✅ Pasa |
| **IPR-03** | `POST /api/produccion` | Vinculación de orden a pedido existente | Guarda `id_pedido` asociado correctamente | ✅ Pasa |
| **IPR-04** | `POST /api/produccion` | Producto inexistente (`id_producto: 999999999`) | Rechaza con 400 | ✅ Pasa |
| **IPR-05** | `POST /api/produccion` | Producto inactivo (`estado: false`) | Rechaza con 400 | ✅ Pasa |
| **IPR-06** | `POST /api/produccion` | Pedido inexistente (`id_pedido: 999999999`) | Rechaza con 400 | ✅ Pasa |
| **IPR-07** | `POST /api/produccion` | Cantidad planificada `0` o negativa (`-10`) | Rechaza con 400 | ✅ Pasa |
| **IPR-08** | `GET /api/produccion` | Consulta de la cola con relaciones | 200 OK con joins de `producto`, `pedido` y `destinatario` | ✅ Pasa |
| **IPR-09** | `GET /api/produccion` | Ordenamiento inteligente | `EN_PROCESO` antes que `PENDIENTE`; pedidos `URGENTE` antes que `BAJA` | ✅ Pasa |
| **IPR-10** | `GET /api/produccion?estado=EN_PROCESO` | Filtro por estado | 200 OK devolviendo solo órdenes en proceso | ✅ Pasa |
| **IPR-11** | `GET /api/produccion?id_producto=X` | Filtro por producto | 200 OK devolviendo solo la orden de ese producto | ✅ Pasa |
| **IPR-12** | `PATCH /api/produccion/:id/estado` | Transición a `EN_PROCESO` y auditoría | 200 OK y auditoría `CAMBIAR_ESTADO_PRODUCCION` | ✅ Pasa |
| **IPR-13** | `PATCH /api/produccion/:id/estado` | Transición a `COMPLETADA` sin cantidad | 200 OK asignando cantidad planificada a cantidad producida | ✅ Pasa |
| **IPR-14** | `PATCH /api/produccion/:id/estado` | Intentar modificar orden `COMPLETADA` | Rechaza con 400 | ✅ Pasa |
| **IPR-15** | `PATCH /api/produccion/:id/estado` | Intentar modificar orden `CANCELADA` | Rechaza con 400 | ✅ Pasa |
| **IPR-16** | `GET /api/produccion/:id` | Consulta individual de orden existente | 200 OK con detalle completo del producto | ✅ Pasa |
| **IPR-17** | `GET /api/produccion/999999999` | Consulta individual de orden inexistente | Responde 404 Not Found | ✅ Pasa |
| **IPR-18** | `PUT /api/produccion/:id` | Actualización de datos planificados | 200 OK modificando planificada y observaciones | ✅ Pasa |
| **IPR-19** | `POST /api/produccion` | Petición sin cookie de sesión | Debe rechazar con 401 | ✅ Pasa (D-16 resuelto) |
| **IPR-20** | `POST /api/produccion` | Petición con sesión enviando `id_usuario` ajeno en body | Sobrescribe con el usuario autenticado de la sesión | ✅ Pasa (D-17 resuelto) |

### 5.2 RF-09 · Registro de Mermas / Desperdicios (`tests/integration/perdida.test.ts`)

| ID | Endpoint | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- | --- |
| **IPER-01** | `POST /api/perdida` | Registrar merma válida sin lote | 200 OK retornando objeto `ResultadoPerdida` con stocks | ✅ Pasa |
| **IPER-02** | `POST /api/perdida` | Actualización de stock en tabla `producto` | `stock_actual` disminuye exactamente por la cantidad indicada | ✅ Pasa |
| **IPER-03** | `POST /api/perdida` | Inserción en tabla `perdida` | Crea registro exacto (`id_producto`, `cantidad`, `motivo`, etc.) | ✅ Pasa |
| **IPER-04** | `POST /api/perdida` | Movimiento de inventario | Fila en `movimiento_inventario` con `tipo_movimiento = 'PERDIDA'` | ✅ Pasa |
| **IPER-05** | `POST /api/perdida` | Bitácora de auditoría | Crea fila en `auditoria` con `accion = 'REGISTRAR_PERDIDA'` | ✅ Pasa |
| **IPER-06** | `POST /api/perdida` | Merma vinculada a lote específico | Descuenta stock general y disminuye `cantidad` del lote | ✅ Pasa |
| **IPER-07** | `POST /api/perdida` | Inactivación automática de lote agotado | Al consumir 100% de la cantidad del lote, cambia a `estado = false` | ✅ Pasa |
| **IPER-08** | `POST /api/perdida` | Cantidad supera stock de producto (CU09 Flujo Alt. 5.1) | Rechaza con 400 (`Stock insuficiente`) | ✅ Pasa |
| **IPER-09** | `POST /api/perdida` | Cantidad supera disponibilidad del lote | Rechaza con 400 (`Cantidad insuficiente en el lote`) | ✅ Pasa |
| **IPER-10** | `POST /api/perdida` | Lote no pertenece al producto seleccionado | Rechaza con 400 (`El lote indicado no pertenece al producto`) | ✅ Pasa |
| **IPER-11** | `POST /api/perdida` | Lote inexistente o inactivo (`id_lote: 999999999`) | Rechaza con 400 (`El lote no existe o está inactivo`) | ✅ Pasa |
| **IPER-12** | `POST /api/perdida` | Producto inexistente (`id_producto: 999999999`) | Rechaza con 400 (`El producto no existe o está inactivo`) | ✅ Pasa |
| **IPER-13** | `POST /api/perdida` | Producto inactivo (`estado = false`) | Rechaza con 400 (`El producto no existe o está inactivo`) | ✅ Pasa |
| **IPER-14** | `POST /api/perdida` | Usuario inexistente o inactivo | Rechaza con 400 (`El usuario no existe o está inactivo`) | ✅ Pasa |
| **IPER-15** | `POST /api/perdida` | Cantidad cero o negativa (`0`, `-10`) | Rechaza con 400 (Error validación Zod) | ✅ Pasa |
| **IPER-16** | `POST /api/perdida` | Motivo vacío o solo espacios | Rechaza con 400 (Error validación Zod) | ✅ Pasa |
| **IPER-17** | `POST /api/perdida` | Tipo de pérdida vacío | Rechaza con 400 (Error validación Zod) | ✅ Pasa |
| **IPER-18** | `POST /api/perdida` | Fecha explícita y observaciones opcionales | 200 OK persistiendo fecha y observaciones provistas | ✅ Pasa |
| **IPER-19** | `POST /api/perdida` | Petición anónima sin cookie de sesión | Debe rechazar con 401 | ⚠️ Falla (**D-18**) (`it.fails`) |
| **IPER-20** | `POST /api/perdida` | Intento de suplantar `id_usuario` en body | Debe forzar el usuario de la sesión autenticada | ⚠️ Falla (**D-19**) (`it.fails`) |

---

## 6. Registro de Defectos

### Defectos Resueltos (RF-20 · Jose Carlos)

- **D-16 · `POST /api/produccion` no exigía autenticación:** Corregido en commit `5e081af`. Ahora valida obligatoriamente la cookie `usuario_session` y responde con `401 Unauthorized` si no existe o es inválida.
- **D-17 · `POST /api/produccion` permitía suplantar `id_usuario`:** Corregido en commit `5e081af`. Ahora sobrescribe incondicionalmente `body.id_usuario = sesion.id_usuario`.

---

### Defectos Detectados y Pendientes (RF-09 · Carolina)

#### Defecto D-18 · `POST /api/perdida` no exige autenticación ni cookie de sesión

- **Severidad:** Media-Alta (Seguridad)
- **Responsable:** Carolina
- **Ubicación:** `server/api/perdida/index.post.ts`
- **Descripción:** El endpoint recibe el cuerpo de la petición y llama directamente a `crearPerdida(body)` sin inspeccionar cookies de sesión ni exigir que el usuario esté autenticado. Cualquier cliente que envíe un `id_usuario` válido en el cuerpo puede registrar una merma.
- **Caso de prueba asociado:** `IPER-19` en [perdida.test.ts](file:///tests/integration/perdida.test.ts) (marcado con `it.fails`).
- **Corrección requerida:** Implementar el control de sesión estándar del proyecto:
  ```ts
  const sessionCookie = getCookie(event, 'usuario_session')
  if (!sessionCookie) {
    throw createError({ statusCode: 401, statusMessage: 'No hay sesión activa.' })
  }
  ```

---

#### Defecto D-19 · `POST /api/perdida` confía en el `id_usuario` provisto en el JSON

- **Severidad:** Media (Integridad y Auditoría)
- **Responsable:** Carolina
- **Ubicación:** `server/api/perdida/index.post.ts`
- **Descripción:** Dado que el endpoint no extrae el `id_usuario` de la sesión activa, permite que un usuario registre pérdidas a nombre de otro usuario enviando un `id_usuario` arbitrario en el payload, afectando la trazabilidad de la auditoría.
- **Caso de prueba asociado:** `IPER-20` en [perdida.test.ts](file:///tests/integration/perdida.test.ts) (marcado con `it.fails`).
- **Corrección requerida:** Deserializar la sesión y asignar el usuario autenticado:
  ```ts
  const sesion = JSON.parse(decodeURIComponent(sessionCookie))
  if (sesion?.id_usuario) {
    body.id_usuario = sesion.id_usuario
  }
  ```

---

## 7. Conclusiones de QA (Sprint 3)

1. **RF-20 (Cola de Producción):**
   - 100% de los casos unitarios (25) y de integración (20) se encuentran en **verde**.
   - Los defectos D-16 y D-17 fueron subsanados satisfactoriamente por Jose Carlos.
2. **RF-09 (Registro de Mermas):**
   - La lógica de negocio central definida en el diagrama de proceso (descuento de stock en producto, descuento y cierre de lotes agotados, validación de stock insuficiente según CU09 flujo 5.1, movimientos de inventario y auditoría) **opera de manera excelente**.
   - Se crearon 17 pruebas unitarias y 20 pruebas de integración automáticas.
   - Se identificaron y documentaron 2 defectos de seguridad de sesión (D-18 y D-19), aislados bajo `it.fails` para mantener la suite en verde y facilitar su resolución por parte de Carolina.
3. **Limpieza de base de datos compartida:**
   - Ambas suites de integración ejecutan rutinas `afterAll` que limpian el 100% de los registros de prueba creados (`[QA-TEST]`), garantizando integridad referencial y cero contaminación en Supabase.
