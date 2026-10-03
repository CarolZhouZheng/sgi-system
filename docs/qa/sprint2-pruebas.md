# QA · Sprint 2 — Destinatarios y Pedidos

| Campo | Detalle |
| --- | --- |
| Sprint | 2 (19 de septiembre – 02 de octubre) |
| Módulo | Destinatarios y Pedidos |
| Requerimientos cubiertos | RF-12 Registro de Destinatario · RF-02 Selección de Destinatario y Registro de Pedidos · RF-05 Listado en Tiempo Real (de Productos) |
| Responsable QA | Alessandro Godinez |
| Rama | `Branch-Alessandro` |
| Fecha de ejecución | 03/10/2026 (ronda 1) · 03/10/2026 (ronda 2: re-prueba tras corrección de D-04 y D-07, commit `429945f`) · 03/10/2026 (ronda 3: re-prueba tras corrección de D-08, commit `1533256`) · 03/10/2026 (ronda 4: re-prueba tras corrección final de D-08, commit `33e5f1a`) |

---

## 1. Alcance

Se probó el módulo completo siguiendo la arquitectura del proyecto:

```text
Componente Vue → API (server/api) → DTO (Zod) → Service → Repository → Supabase
```

| Capa | Archivos probados |
| --- | --- |
| API | `server/api/destinatarios/index.get.ts`, `index.post.ts` · `server/api/pedidos/index.get.ts`, `index.post.ts` |
| DTO | `server/dtos/destinatario.dto.ts` · `server/dtos/pedido.dto.ts` |
| Service | `server/services/destinatario.service.ts` · `server/services/pedido.service.ts` |
| Repository | `server/repositories/destinatario.repository.ts` · `server/repositories/pedido.repository.ts` |
| Interfaz | `app/pages/destinatarios/index.vue` · `app/pages/pedidos/index.vue` y sus componentes |
| Tiempo real (RF-05) | `app/components/productos/ListadoProductos/ListadoProductos.ts` (suscripción de Supabase Realtime a la tabla `producto`) |

**Aclaración de alcance del RF-05:** según confirmó Carolina (responsable del RF-05), el listado en tiempo real aplica **solo al listado de Productos**. Los listados de Pedidos y Destinatarios se actualizan al registrar un elemento o con el botón de recarga, y eso es el comportamiento esperado.

**Fuera de alcance:** login (RF-15) y CRUD de productos (Sprint 1), salvo cuando se usan como datos de apoyo.

---

## 2. Herramientas y ejecución

| Tipo | Herramienta | Comando | ¿Usa la base de datos? | ¿Corre en CI? |
| --- | --- | --- | --- | --- |
| Unitarias | Vitest | `npm test` | No (repositorios simulados con mocks) | Sí |
| Integración | Vitest + `@nuxt/test-utils` | `npm run test:integration` | Sí (Supabase compartida) | No (requiere `.env`) |
| Manuales | Navegador | `npm run dev` | Sí | No |

### Reglas para no afectar la base compartida (pruebas de integración)

- Todo dato creado lleva la marca **`[QA-TEST]`** en el nombre (destinatarios y productos) o en `encargado_entrega` (pedidos), más un número de corrida.
- Al terminar (`afterAll`) se borran **solo los IDs creados por la prueba**, en orden: `detalle_pedido` → `pedido` → `destinatario` → `producto`.
- Los registros existentes **solo se leen**; se usa un usuario activo existente como autor del pedido, sin modificarlo.
- Si no existe `.env`, la suite se omite en lugar de fallar.
- Mientras corre la suite (~45 s), los productos `[QA-TEST]` pueden aparecer brevemente en la pantalla de Productos porque esa lista usa Realtime.

Verificación posterior a la ejecución del 03/10/2026: **0 destinatarios, 0 productos y 0 pedidos con la marca `[QA-TEST]` quedaron en la base.**

---

## 3. Resumen de resultados

| Tipo | Casos | Pasan | Fallan por defecto conocido | Pendientes |
| --- | --- | --- | --- | --- |
| Unitarias | 49 | 47 | 2 (D-05, D-06) | 0 |
| Integración | 23 | 23 | 0 | 0 |
| Manuales | 16 | — | — | 16 |

> Resultados de la **ronda 4** (todos los defectos de RF-12 corregidos). Ronda 1: 38 + 3 unitarias y 16 + 0 de integración. Ronda 2: 41 + 2 y 19 + 1. Ronda 3: 41 + 2 y 22 + 1.
>
> Los casos que "fallan por defecto conocido" están marcados con `it.fails`: describen el comportamiento **correcto** y hoy fallan porque el defecto existe. Vitest los cuenta como *expected fail* y `npm test` termina en verde. Cuando el responsable corrija el defecto, ese caso empezará a pasar, Vitest lo reportará como error y habrá que cambiar `it.fails` por `it`.

---

## 4. Matriz de casos — Pruebas unitarias

Archivos en `tests/unit/`.

### 4.1 RF-12 · `CrearDestinatarioDTO` (`destinatario.dto.test.ts`)

| ID | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UD-01 | Destinatario completo | Válido | ✅ Pasa |
| UD-02 | Solo `nombre_empresa` | Válido | ✅ Pasa |
| UD-03 | Correo vacío (`''`) | Válido | ✅ Pasa |
| UD-04 | Nombre vacío | Rechaza: "El nombre de la empresa es obligatorio" | ✅ Pasa |
| UD-05 | Sin campo `nombre_empresa` | Rechaza | ✅ Pasa |
| UD-06 | Correo con formato inválido | Rechaza: "Debe ser un correo válido" | ✅ Pasa |
| UD-07 | `nombre_empresa` de 151 caracteres | Rechaza | ✅ Pasa |
| UD-08 | `telefono` de 31 caracteres | Rechaza | ✅ Pasa |
| UD-09 | `direccion` de 256 caracteres | Rechaza | ✅ Pasa |
| UD-10 | `nombre_empresa` de exactamente 150 caracteres | Válido | ✅ Pasa |
| UD-11 | Nombre con solo espacios (`"   "`) | Rechaza: "El nombre de la empresa es obligatorio" | ✅ Pasa (ronda 2; en ronda 1 fallaba por **D-04**) |
| UD-12 | Nombre con espacios al inicio y al final | Se guarda sin esos espacios | ✅ Pasa (ronda 2) |

### 4.2 RF-02 · `CrearPedidoSchema` (`pedido.dto.test.ts`)

| ID | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UP-01 | Pedido completo | Válido | ✅ Pasa |
| UP-02 | Sin prioridad | Asigna `NORMAL` | ✅ Pasa |
| UP-03 | IDs y cantidades como texto (`'3'`, `'7.5'`) | Convierte a número | ✅ Pasa |
| UP-04 | `fecha_entrega` y `encargado_entrega` nulos u omitidos | Válido | ✅ Pasa |
| UP-05 | Sin productos | Rechaza: "Agrega al menos un producto." | ✅ Pasa |
| UP-06 | Cantidad `0` | Rechaza: "La cantidad debe ser mayor que cero." | ✅ Pasa |
| UP-07 | Cantidad negativa | Rechaza | ✅ Pasa |
| UP-08 | Producto repetido en el detalle | Rechaza: "No repitas productos…" | ✅ Pasa |
| UP-09 | `id_destinatario` = 0 | Rechaza | ✅ Pasa |
| UP-10 | `id_destinatario` negativo | Rechaza | ✅ Pasa |
| UP-11 | `id_destinatario` decimal (1.5) | Rechaza | ✅ Pasa |
| UP-12 | `id_destinatario` nulo (formulario sin selección) | Rechaza | ✅ Pasa |
| UP-13 | `id_usuario` = 0 | Rechaza: "Indica un usuario válido." | ✅ Pasa |
| UP-14 | Producto sin seleccionar (`id_producto` = 0) | Rechaza: "Selecciona un producto válido." | ✅ Pasa |
| UP-15 | Fecha `10/10/2026` | Rechaza | ✅ Pasa |
| UP-16 | Fecha `2026-13-01` (mes inexistente) | Rechaza | ✅ Pasa |
| UP-17 | Fecha `mañana` | Rechaza | ✅ Pasa |
| UP-18 | `encargado_entrega` de 151 caracteres | Rechaza | ✅ Pasa |
| UP-19 | Prioridad fuera del catálogo (`CUALQUIERA`) | Rechaza | ❌ Falla — **D-05** |
| UP-20 | Fecha de entrega en el pasado (`2020-01-01`) | Rechaza | ❌ Falla — **D-06** |

### 4.3 RF-02 · `PedidoService` (`pedido.service.test.ts`)

| ID | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| US-01 | Destinatario, usuario y productos válidos | Llama a `crearPedido` y devuelve el pedido | ✅ Pasa |
| US-02 | Destinatario inexistente o inactivo | Error 400; no guarda | ✅ Pasa |
| US-03 | Usuario inexistente o inactivo | Error 400; no guarda | ✅ Pasa |
| US-04 | Algún producto inexistente o inactivo | Error 400; no guarda | ✅ Pasa |
| US-05 | Falla el guardado de detalles | Propaga el error | ✅ Pasa |
| US-06 | Listar pedidos | Devuelve lo que entrega el repositorio | ✅ Pasa |

### 4.4 RF-12 · `DestinatarioService` (`destinatario.service.test.ts`)

| ID | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UDS-01 | Registro exitoso | Busca duplicados y devuelve `{ success: true, data }` | ✅ Pasa |
| UDS-05 | Duplicado con el mismo nombre | `{ success: false, error: "Ya existe un destinatario…" }`; no guarda | ✅ Pasa (**D-07**) |
| UDS-06 | Duplicado con otras mayúsculas | Rechaza; no guarda | ✅ Pasa (ronda 4, **D-07**) |
| UDS-07 | Duplicado con espacios alrededor | Rechaza; no guarda | ✅ Pasa (ronda 4, **D-07**) |
| UDS-08 | Nombre con `_` distinto a uno existente | Se registra | ✅ Pasa (ronda 4, **D-08**) |
| UDS-09 | Nombre con `%` distinto a uno existente | Se registra | ✅ Pasa (ronda 4, **D-08**) |
| UDS-10 | Nombre con `*` distinto a uno existente | Se registra | ✅ Pasa (ronda 4, **D-08**) |
| UDS-11 | Falla la consulta de duplicados | `{ success: false, error }`; no guarda | ✅ Pasa (ronda 4) |
| UDS-02 | Error del repositorio al registrar | `{ success: false, error }` | ✅ Pasa |
| UDS-03 | Listado exitoso | `{ success: true, data }` | ✅ Pasa |
| UDS-04 | Error del repositorio al listar | `{ success: false, error }` | ✅ Pasa |

---

## 5. Matriz de casos — Pruebas de integración

Archivo: `tests/integration/destinatarios-pedidos.test.ts`. Se levanta la app Nuxt y se llaman los endpoints reales contra Supabase.

| ID | RF | Caso | Entrada | Resultado esperado | Estado |
| --- | --- | --- | --- | --- | --- |
| IT-01 | RF-12 | Registrar destinatario válido | `POST /api/destinatarios` con todos los campos | 200, `success: true`, `estado: true` | ✅ Pasa |
| IT-02 | RF-12 | El destinatario aparece en el listado | `GET /api/destinatarios` | Contiene el ID creado | ✅ Pasa |
| IT-03 | RF-12 | Nombre vacío | `nombre_empresa: ''` | 400 "…nombre de la empresa es obligatorio" | ✅ Pasa |
| IT-04 | RF-12 | Correo inválido | `correo: 'no-es-correo'` | 400 "Debe ser un correo válido" | ✅ Pasa |
| IT-17 | RF-12 | Nombre con solo espacios | `nombre_empresa: '   '` | 400 "…nombre de la empresa es obligatorio" | ✅ Pasa (ronda 2, **D-04**) |
| IT-18 | RF-12 | Empresa duplicada | Mismo nombre de IT-01 | 400 "Ya existe un destinatario…" | ✅ Pasa (ronda 2, **D-07**) |
| IT-19 | RF-12 | Duplicado con otras mayúsculas y espacios externos | `'  [QA-TEST] SODA PRUEBA …  '` | 400 "Ya existe un destinatario…" | ✅ Pasa (ronda 2, **D-07**) |
| IT-20 | RF-12 | Nombre distinto que solo coincide por comodín `_` | `Soda_Prueba` cuando existe `Soda Prueba` | 200, se registra | ✅ Pasa (ronda 3; en ronda 2 fallaba por **D-08**) |
| IT-21 | RF-12 | Nombre distinto con comodín `%` | `Soda%…` cuando existe `Soda Prueba …` | 200, se registra (sin error técnico) | ✅ Pasa (ronda 3) |
| IT-22 | RF-12 | Nombre distinto con comodín `*` | `Soda*…` cuando existe `Soda Prueba …` | 200, se registra | ✅ Pasa (ronda 4; en ronda 3 fallaba por **D-08**) |
| IT-23 | RF-12 | Duplicado exacto de un nombre con comodines | `Soda_Prueba` registrado dos veces | 400 "Ya existe un destinatario…" | ✅ Pasa (ronda 3) |
| IT-05 | RF-02 | Registrar pedido con 2 productos | `POST /api/pedidos` | 201, `estado: PENDIENTE`, `prioridad: ALTA` | ✅ Pasa |
| IT-06 | RF-02 | Detalles guardados | Consulta a `detalle_pedido` | 2 filas con cantidades 12 y 2.5, `cantidad_entregada: 0` | ✅ Pasa |
| IT-07 | RF-02 | Pedido sin productos | `detalles: []` | 400 "Agrega al menos un producto" | ✅ Pasa |
| IT-08 | RF-02 | Productos repetidos | Mismo `id_producto` dos veces | 400 "No repitas productos" | ✅ Pasa |
| IT-09 | RF-02 | Cantidad cero | `cantidad: 0` | 400 "…mayor que cero" | ✅ Pasa |
| IT-10 | RF-02 | Destinatario inexistente | `id_destinatario: 999999999` | 400 "El destinatario no existe…" | ✅ Pasa |
| IT-11 | RF-02 | Destinatario inactivo | Destinatario `[QA-TEST]` con `estado: false` | 400 "El destinatario no existe…" | ✅ Pasa |
| IT-12 | RF-02 | Usuario inexistente | `id_usuario: 999999999` | 400 "El usuario no existe…" | ✅ Pasa |
| IT-13 | RF-02 | Producto inactivo | Producto `[QA-TEST]` con `estado: false` | 400 "Uno o más productos no existen…" | ✅ Pasa |
| IT-14 | RF-02 | Los rechazos no dejan registros | Pedidos del destinatario de prueba | Solo existe el pedido de IT-05 | ✅ Pasa |
| IT-15 | RF-02 | El pedido aparece en el listado | `GET /api/pedidos` | Incluye destinatario y 2 productos con nombre | ✅ Pasa |
| IT-16 | RF-02 | Orden del listado | `GET /api/pedidos` | Del más reciente al más antiguo | ✅ Pasa |

---

## 6. Casos manuales de la interfaz

Ejecutar con `npm run dev` en `http://localhost:3000`. **Usar siempre nombres con el prefijo `[QA-TEST]`** y avisar al equipo para eliminarlos al terminar, ya que la interfaz no tiene opción de borrar destinatarios ni pedidos.

| ID | RF | Pantalla | Pasos | Resultado esperado | Resultado obtenido |
| --- | --- | --- | --- | --- | --- |
| M-01 | RF-12 | `/destinatarios` | Llenar solo el nombre y guardar | Mensaje "Destinatario registrado con éxito.", el formulario se limpia y aparece de primero en el listado | Pendiente |
| M-02 | RF-12 | `/destinatarios` | Intentar guardar sin nombre | El navegador no envía el formulario (campo `required`) | Pendiente |
| M-03 | RF-12 | `/destinatarios` | Correo `abc` y guardar | El navegador o la API muestran un error de correo; no se registra | Pendiente |
| M-04 | RF-12 | `/destinatarios` | Pulsar el botón de recargar del listado | La lista se vuelve a cargar sin errores | Pendiente |
| M-05 | RF-12 | `/destinatarios` | Doble clic rápido en "Guardar Destinatario" | El botón se deshabilita ("Guardando...") y se registra una sola vez | Pendiente |
| M-06 | RF-02 | `/pedidos` | Abrir la pantalla | El selector muestra solo destinatarios activos y productos activos; la fecha de entrega es la de hoy | Pendiente |
| M-07 | RF-02 | `/pedidos` | Registrar pedido con 2 productos y un ID de usuario válido | Mensaje "Pedido registrado correctamente.", el formulario se reinicia y el pedido aparece en el listado | Pendiente |
| M-08 | RF-02 | `/pedidos` | Agregar 3 líneas de producto y quitar la del medio | Se elimina la línea correcta; no se puede quitar la última | Pendiente |
| M-09 | RF-02 | `/pedidos` | Seleccionar el mismo producto en dos líneas y registrar | Error "No repitas productos…" | Pendiente |
| M-10 | RF-02 | `/pedidos` | Cantidad `0` o vacía | Error "Completa cada producto con una cantidad mayor que cero." | Pendiente |
| M-11 | RF-02 | `/pedidos` | ID de usuario inexistente (ej. `99999`) | Error "El usuario no existe o está inactivo." | Pendiente |
| M-12 | RF-02 | `/pedidos` | Pulsar "Actualizar" | El listado se recarga y muestra destinatario, fechas, prioridad, estado y productos | Pendiente |
| M-13 | RF-05 | `/productos` en dos pestañas | Registrar un producto `[QA-TEST]` en la pestaña A y observar la B **sin** recargar | El producto aparece solo en la pestaña B | Pendiente |
| M-14 | RF-12 / RF-02 | `/destinatarios` y `/pedidos` | Registrar un destinatario y abrir `/pedidos` | El nuevo destinatario aparece en el selector | Pendiente |
| M-15 | RF-05 | `/productos` en dos pestañas | Editar el producto `[QA-TEST]` (RF-03) en la pestaña A, luego darlo de baja (RF-04) | La pestaña B refleja cada cambio sin recargar | Pendiente |
| M-16 | RF-05 | `/productos` | Navegar a otra página y volver varias veces; luego hacer un cambio desde otra pestaña | La lista se actualiza una sola vez por cambio (la suscripción se cierra al salir de la página y no se duplica) | Pendiente |

---

## 7. Defectos encontrados

| ID | Severidad | RF | Descripción | Evidencia | Responsable sugerido |
| --- | --- | --- | --- | --- | --- |
| ~~D-01~~ | — | RF-05 | **Descartado.** Se reportó que Pedidos y Destinatarios no tienen listado en tiempo real. Carolina confirmó que el RF-05 aplica solo al listado de Productos, donde sí está implementado. No es un defecto. | `app/components/productos/ListadoProductos/ListadoProductos.ts:182` | — |
| D-02 | Media | RF-02 | El registro de un pedido no es transaccional: se inserta `pedido`, luego `detalle_pedido`, y si los detalles fallan se intenta borrar el pedido manualmente. Si ese borrado también falla, queda un pedido sin detalles. Se recomienda una función RPC transaccional en PostgreSQL. | `server/repositories/pedido.repository.ts:56-70` | Jose Carlos |
| D-03 | Alta | RF-02 | El `id_usuario` se escribe a mano en el formulario y el middleware de autenticación del servidor está comentado, por lo que cualquiera puede registrar un pedido a nombre de otro usuario. El propio código lo marca como temporal. | `app/components/pedidos/RegistrarPedido.vue` (campo "ID del usuario que registra"); `server/middleware/auth.ts`; `server/dtos/pedido.dto.ts:11` | Jose Carlos / Manuel (RF-15) |
| D-04 | Baja | RF-12 | ✅ **Corregido y verificado en ronda 2** (commit `429945f`, se agregó `.trim()`). `nombre_empresa` aceptaba un texto de solo espacios porque el DTO no aplica `.trim()`. | `server/dtos/destinatario.dto.ts:4`; casos UD-11, UD-12, IT-17 | Manuel |
| D-05 | Baja | RF-02 | `prioridad` acepta cualquier texto; el backend no la limita a `NORMAL`, `ALTA` o `URGENTE` (solo lo hace el `<select>` de la interfaz). | `server/dtos/pedido.dto.ts:13`; caso UP-19 | Jose Carlos |
| D-06 | Media | RF-02 | Se permite registrar un pedido con fecha de entrega en el pasado. | `server/dtos/pedido.dto.ts:12`; caso UP-20 | Jose Carlos |
| D-07 | Baja | RF-12 | ✅ **Corregido y verificado en ronda 2** (commit `429945f`, el service busca el nombre antes de registrar). No se validaba que el destinatario no exista ya: se puede registrar dos veces la misma empresa. | `server/repositories/destinatario.repository.ts`; casos UDS-05, IT-18, IT-19 | Manuel |

| D-08 | Baja | RF-12 | ✅ **Corregido y verificado en ronda 4** (commit `33e5f1a`): el service compara el nombre exacto en minúsculas y sin espacios externos, sin usar `ilike`, por lo que ya no hay comodines. Historial — ronda 3 (commit `1533256`), corregido parcialmente: Ya se escapan `%`, `_` y `\`, y se cambió `maybeSingle()` por `limit(1)`, por lo que no aparece el error técnico. **Pendiente:** PostgREST (Supabase) también trata `*` como comodín en `ilike`, y no se escapa: `Soda*…` se rechaza como duplicado de `Soda Prueba …` (caso IT-22). Como PostgREST convierte `*` en `%` antes de llegar a PostgreSQL, escaparlo con `\` podría no bastar. Opción más segura: traer los candidatos y comparar en el service con `nombre.trim().toLowerCase()` exacto, o crear una función RPC que compare con `lower(nombre_empresa) = lower($1)`. — Descripción original (ronda 2): La validación de duplicados de D-07 usa `ilike`, donde `_` y `%` son comodines. Un nombre distinto puede rechazarse como duplicado (`Soda_Prueba` coincide con `Soda Prueba`). Además, si el nombre coincide con varios registros (por ejemplo `%`), `maybeSingle()` lanza un error técnico en vez del mensaje de duplicado. Se recomienda escapar `\`, `%` y `_` antes de usar `ilike`, o comparar con `.eq()` sobre el nombre normalizado. | `server/repositories/destinatario.repository.ts` (`buscarPorNombre`); casos IT-20 a IT-23. Verificado en la base con solo lectura: buscar `R_ckstar Games` devuelve `Rockstar Games`. | Manuel |

**Nota sobre D-07:** la validación se hace en la aplicación. Como la tabla no tiene restricción `UNIQUE`, dos registros enviados al mismo tiempo con el mismo nombre podrían pasar ambos. Es poco probable en el uso real; la solución completa sería un índice único sobre `lower(nombre_empresa)`, lo cual requiere coordinarlo con el equipo porque modifica la base.

### Observaciones adicionales (no bloqueantes)

- **Validación de duplicados (D-07/D-08):** el service trae **todos** los destinatarios en cada registro para comparar el nombre. Funciona bien con el volumen actual, pero Supabase devuelve como máximo 1000 filas por consulta por defecto; con más de 1000 destinatarios, los más antiguos no se revisarían. Además, `buscarPorNombre` en `destinatario.repository.ts` quedó sin uso y podría eliminarse.

- **Errores silenciosos en el listado de destinatarios:** si `GET /api/destinatarios` falla, `ListadoDestinatarios.vue` solo escribe en consola y muestra "No hay destinatarios registrados aún.", lo que puede confundir al usuario.
- **`.gitignore` dañado (corregido en esta rama):** la última línea estaba guardada con otra codificación y decía `doc/.output/`, por lo que la carpeta de build `.output/` no se ignoraba. Se reemplazó por `.output/`.
- **Credenciales por defecto en el código:** `server/utils/supabase.ts` incluye una URL y una clave pública de Supabase como respaldo si falta el `.env`. Conviene eliminar ese respaldo y fallar con un mensaje claro.

---

## 8. Cambios realizados por QA

| Archivo | Cambio |
| --- | --- |
| `package.json` / `package-lock.json` | Dependencias de desarrollo `vitest` y `@nuxt/test-utils`; scripts `test`, `test:watch` y `test:integration` |
| `vitest.config.ts` | Configuración de pruebas unitarias |
| `vitest.integration.config.ts` | Configuración de pruebas de integración |
| `tests/unit/*.test.ts` | 4 archivos de pruebas unitarias (ronda 2: D-04 pasa a prueba normal; mock y casos nuevos para D-07) |
| `tests/integration/destinatarios-pedidos.test.ts` | Pruebas de integración de la API (ronda 2: IT-17 a IT-20; ronda 3: IT-21 a IT-23) |
| `.github/workflows/ci.yml` | Nuevo paso "5. Ejecutar pruebas unitarias" (`npm test`) |
| `.gitignore` | Línea dañada reemplazada por `.output/` |

No se modificó código de los requerimientos de los compañeros. Los defectos quedan reportados para que cada responsable los corrija.
