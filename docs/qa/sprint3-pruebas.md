
# QA · Sprint 3 — Cola de Producción en Tiempo Real

| Campo                    | Detalle                                                                           |
| ------------------------ | --------------------------------------------------------------------------------- |
| Sprint                   | 3 (03 de octubre – 17 de octubre)                                                |
| Módulo                  | Destinatarios, Pedidos y Producción                                              |
| Requerimientos cubiertos | RF-20 Cola de producción en tiempo real                                          |
| Responsable QA           | Armando Solis                                                                     |
| Rama                     | `ArmandoBranch`                                                                 |
| Fecha de ejecución      | 06/10/2026 (ronda 1: verificación inicial tras commit`f5de75a` de Jose Carlos) |

---

## 1. Alcance

Se probó el requerimiento **RF-20** siguiendo la arquitectura en capas del proyecto:

```text
Componente Vue → API (server/api) → DTO (Zod) → Service → Repository → Supabase
```

| Capa                | Archivos probados                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| API                 | `server/api/produccion/index.get.ts`, `index.post.ts` · `server/api/produccion/[id]/index.get.ts`, `index.put.ts`, `estado.patch.ts` |
| DTO                 | `server/dtos/produccion.dto.ts`                                                                                                               |
| Service             | `server/services/produccion.service.ts`                                                                                                       |
| Repository          | `server/repositories/produccion.repository.ts`                                                                                                |
| Interfaz y Realtime | `app/pages/produccion/index.vue` · `app/components/produccion/ColaProduccion.vue` (Supabase Realtime)                                      |

---

## 2. Herramientas y ejecución

| Tipo         | Herramienta                  | Comando                                                                                       | ¿Usa la base de datos?               | ¿Corre en CI?        |
| ------------ | ---------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------- |
| Unitarias    | Vitest                       | `npm test`                                                                                  | No (repositorios simulados con mocks) | Sí                   |
| Integración | Vitest +`@nuxt/test-utils` | `npx vitest run tests/integration/produccion.test.ts --config vitest.integration.config.ts` | Sí (Supabase compartida)             | No (requiere`.env`) |
| Manuales     | Navegador                    | `npm run dev`                                                                               | Sí                                   | No                    |

### Reglas para no afectar la base compartida (pruebas de integración)

- Todo dato creado lleva la marca **`[QA-TEST]`** en el nombre o en las observaciones, más un número de corrida.
- Al terminar (`afterAll`) se borran **estrictamente los IDs creados por la prueba**, en orden de dependencias:
  1. `auditoria` (filas asociadas a las órdenes de producción probadas).
  2. `produccion` (órdenes de producción de prueba).
  3. `detalle_pedido` y `pedido` (pedidos auxiliares de prueba).
  4. `destinatario` y `producto` (auxiliares de prueba).
- Los registros existentes de la base **solo se leen**; se utilizó un usuario activo existente para las operaciones, sin alterarlo.
- Si no existe `.env`, la suite se omite limpiamente en lugar de fallar.

**Verificación posterior a la ejecución:** 0 registros con la marca `[QA-TEST]` quedaron en Supabase (0 producciones, 0 pedidos, 0 destinatarios, 0 productos).

---

## 3. Resumen de resultados

| Tipo                 | Casos | Pasan | Fallan por defecto conocido (`it.fails`)          | Pendientes |
| -------------------- | ----- | ----- | --------------------------------------------------- | ---------- |
| Unitarias (RF-20)    | 25    | 25    | 0                                                   | 0          |
| Integración (RF-20) | 20    | 18    | 2 (D-16, D-17: control estricto de sesión en POST) | 0          |

> **Nota sobre `it.fails`:** Los casos IPR-19 e IPR-20 describen el comportamiento seguro esperado (consistente con lo acordado en Sprint 2: D-03 / IT-29). Al estar marcados con `it.fails`, Vitest verifica que fallen mientras el defecto exista en el código de Jose Carlos, manteniendo la suite en verde. Cuando Jose Carlos aplique las correcciones de sesión, pasarán a `it`.

---

## 4. Matriz de casos — Pruebas unitarias

### 4.1 RF-20 · DTO (`tests/unit/produccion.dto.spec.ts`)

| ID     | Caso                                                                   | Resultado esperado         | Estado  |
| ------ | ---------------------------------------------------------------------- | -------------------------- | ------- |
| UPR-01 | Creación con datos válidos                                           | Pasa validación           | ✅ Pasa |
| UPR-02 | Valores por defecto (`cantidad_producida: 0`, `estado: PENDIENTE`) | Asigna valores por defecto | ✅ Pasa |
| UPR-03 | Rechaza cantidad planificada cero o negativa                           | Error de validación Zod   | ✅ Pasa |
| UPR-04 | Rechaza producto inválido (`id_producto <= 0`)                      | Error de validación Zod   | ✅ Pasa |
| UPR-05 | Rechaza usuario inválido (`id_usuario <= 0`)                        | Error de validación Zod   | ✅ Pasa |
| UPR-06 | Transforma estado a mayúsculas                                        | Convierte string           | ✅ Pasa |
| UPR-07 | Rechaza estado no permitido                                            | Error de validación Zod   | ✅ Pasa |
| UPR-08 | Rechaza cantidad producida negativa                                    | Error de validación Zod   | ✅ Pasa |
| UPR-09 | Valida ID de parámetro numérico positivo                             | Pasa validación           | ✅ Pasa |
| UPR-10 | Rechaza ID no numérico o decimal                                      | Error de validación Zod   | ✅ Pasa |

### 4.2 RF-20 · Servicio (`tests/unit/produccion.service.spec.ts`)

| ID     | Caso                                      | Resultado esperado                                   | Estado  |
| ------ | ----------------------------------------- | ---------------------------------------------------- | ------- |
| UPS-01 | Listar cola: orden por estado y prioridad | `EN_PROCESO` primero, `URGENTE` sobre `NORMAL` | ✅ Pasa |
| UPS-02 | Obtener por ID existente                  | Retorna orden con detalle                            | ✅ Pasa |
| UPS-03 | Obtener por ID inexistente                | Arroja error 404                                     | ✅ Pasa |
| UPS-04 | Registrar orden con producto inexistente  | Arroja error 400                                     | ✅ Pasa |
| UPS-05 | Registrar orden con usuario inactivo      | Arroja error 400                                     | ✅ Pasa |
| UPS-06 | Registrar orden con pedido inexistente    | Arroja error 400                                     | ✅ Pasa |
| UPS-07 | Registro exitoso y auditoría             | Retorna orden creada                                 | ✅ Pasa |
| UPS-08 | Cambiar estado de orden COMPLETADA        | Rechaza con 400                                      | ✅ Pasa |
| UPS-09 | Cambiar estado de orden CANCELADA         | Rechaza con 400                                      | ✅ Pasa |
| UPS-10 | Cambiar a COMPLETADA sin cantidad         | Asigna cantidad planificada                          | ✅ Pasa |

---

## 5. Matriz de casos — Pruebas de integración (`tests/integration/produccion.test.ts`)

| ID               | Endpoint                                  | Caso                                                               | Resultado esperado                                                             | Estado                                     |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------ |
| **IPR-01** | `POST /api/produccion`                  | Registrar orden válida con valores por defecto                    | 201 Created (`estado: PENDIENTE`, `cantidad_producida: 0`)                 | ✅ Pasa                                    |
| **IPR-02** | `POST /api/produccion`                  | Registro de auditoría en Supabase                                 | Crea fila en tabla`auditoria` con acción `REGISTRAR_ORDEN_PRODUCCION`     | ✅ Pasa                                    |
| **IPR-03** | `POST /api/produccion`                  | Vinculación de orden a pedido existente                           | Guarda`id_pedido` asociado correctamente                                     | ✅ Pasa                                    |
| **IPR-04** | `POST /api/produccion`                  | Producto inexistente (`id_producto: 999999999`)                  | Rechaza con 400                                                                | ✅ Pasa                                    |
| **IPR-05** | `POST /api/produccion`                  | Producto inactivo (`estado: false`)                              | Rechaza con 400                                                                | ✅ Pasa                                    |
| **IPR-06** | `POST /api/produccion`                  | Pedido inexistente (`id_pedido: 999999999`)                      | Rechaza con 400                                                                | ✅ Pasa                                    |
| **IPR-07** | `POST /api/produccion`                  | Cantidad planificada`0` o negativa (`-10`)                     | Rechaza con 400                                                                | ✅ Pasa                                    |
| **IPR-08** | `GET /api/produccion`                   | Consulta de la cola con relaciones                                 | 200 OK con joins de`producto`, `pedido` y `destinatario`                 | ✅ Pasa                                    |
| **IPR-09** | `GET /api/produccion`                   | Ordenamiento inteligente                                           | `EN_PROCESO` antes que `PENDIENTE`; pedidos `URGENTE` antes que `BAJA` | ✅ Pasa                                    |
| **IPR-10** | `GET /api/produccion?estado=EN_PROCESO` | Filtro por estado                                                  | 200 OK devolviendo solo órdenes en proceso                                    | ✅ Pasa                                    |
| **IPR-11** | `GET /api/produccion?id_producto=X`     | Filtro por producto                                                | 200 OK devolviendo solo la orden de ese producto                               | ✅ Pasa                                    |
| **IPR-12** | `PATCH /api/produccion/:id/estado`      | Transición a`EN_PROCESO` y auditoría                           | 200 OK y auditoría`CAMBIAR_ESTADO_PRODUCCION`                               | ✅ Pasa                                    |
| **IPR-13** | `PATCH /api/produccion/:id/estado`      | Transición a`COMPLETADA` sin cantidad                           | 200 OK asignando cantidad planificada a cantidad producida                     | ✅ Pasa                                    |
| **IPR-14** | `PATCH /api/produccion/:id/estado`      | Intentar modificar orden`COMPLETADA`                             | Rechaza con 400                                                                | ✅ Pasa                                    |
| **IPR-15** | `PATCH /api/produccion/:id/estado`      | Intentar modificar orden`CANCELADA`                              | Rechaza con 400                                                                | ✅ Pasa                                    |
| **IPR-16** | `GET /api/produccion/:id`               | Consulta individual de orden existente                             | 200 OK con detalle completo del producto                                       | ✅ Pasa                                    |
| **IPR-17** | `GET /api/produccion/999999999`         | Consulta individual de orden inexistente                           | Responde 404 Not Found                                                         | ✅ Pasa                                    |
| **IPR-18** | `PUT /api/produccion/:id`               | Actualización de datos planificados                               | 200 OK modificando planificada y observaciones                                 | ✅ Pasa                                    |
| **IPR-19** | `POST /api/produccion`                  | Petición sin cookie de sesión                                    | Debe rechazar con 401                                                          | ⚠️ Falla (**D-16**) (`it.fails`) |
| **IPR-20** | `POST /api/produccion`                  | Petición con sesión pero enviando`id_usuario` foráneo en body | Debe forzar el usuario de la sesión y no el del body                          | ⚠️ Falla (**D-17**) (`it.fails`) |

---

## 6. Defectos encontrados (Pendientes para Jose Carlos)

### Defecto D-16 · `POST /api/produccion` no exige autenticación ni cookie de sesión

- **Severidad:** Media-Alta (Seguridad)
- **Responsable:** Jose Carlos
- **Descripción:** En `server/api/produccion/index.post.ts`, si no se envía la cookie `usuario_session`, el servidor no rechaza la petición con 401. Si el cliente envía `id_usuario` en el JSON, la orden se crea sin verificar que quien la envía esté autenticado.
- **Caso de prueba:** `IPR-19` en [produccion.test.ts](file:///tests/integration/produccion.test.ts).
- **Corrección requerida:** Agregar la validación estricta de cookie similar a `server/api/pedidos/index.post.ts`:
  ```ts
  const sessionCookie = getCookie(event, 'usuario_session')
  if (!sessionCookie) {
    throw createError({ statusCode: 401, statusMessage: 'No hay sesión activa.' })
  }
  ```

---

### Defecto D-17 · `POST /api/produccion` permite suplantar el `id_usuario` en presencia de sesión

- **Severidad:** Media (Integridad)
- **Responsable:** Jose Carlos
- **Descripción:** En `server/api/produccion/index.post.ts`, el código tiene:
  ```ts
  if (sesion?.id_usuario && !body.id_usuario) {
    body.id_usuario = sesion.id_usuario
  }
  ```

  La condición `!body.id_usuario` provoca que si un usuario autenticado envía deliberadamente un `id_usuario` ajeno en el cuerpo de la petición, el servidor respeta el del cuerpo en vez del autenticado en la sesión.
- **Caso de prueba:** `IPR-20` en [produccion.test.ts](file:///tests/integration/produccion.test.ts).
- **Corrección requerida:** Sobrescribir siempre `body.id_usuario = sesion.id_usuario` independientemente de lo que venga en el cuerpo.

---

## 7. Conclusión preliminar de QA (Sprint 3 · RF-20)

1. La funcionalidad principal del **RF-20** (ordenamiento inteligente de cola, filtros por query params, transiciones de estado, bloqueos para órdenes completadas/canceladas y registro en tabla `auditoria`) **funciona correctamente** contra la base de datos real.
2. La suite de pruebas de integración fue creada en [produccion.test.ts](file:///tests/integration/produccion.test.ts), pasando 18 pruebas y documentando 2 defectos conocidos de seguridad bajo `it.fails`.
3. Ningún registro residual `[QA-TEST]` quedó en la base de datos tras las ejecuciones.
