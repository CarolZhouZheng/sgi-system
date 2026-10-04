# QA · Sprint 2 — Destinatarios y Pedidos

| Campo | Detalle |
| --- | --- |
| Sprint | 2 (19 de septiembre – 02 de octubre) |
| Módulo | Destinatarios y Pedidos |
| Requerimientos cubiertos | RF-12 Registro de Destinatario · RF-02 Selección de Destinatario y Registro de Pedidos · RF-05 Listado en Tiempo Real (de Productos) |
| Responsable QA | Alessandro Godinez |
| Rama | `Branch-Alessandro` |
| Fecha de ejecución | 03/10/2026 (ronda 1) · 03/10/2026 (ronda 2: re-prueba tras corrección de D-04 y D-07, commit `429945f`) · 03/10/2026 (ronda 3: re-prueba tras corrección de D-08, commit `1533256`) · 03/10/2026 (ronda 4: re-prueba tras corrección final de D-08, commit `33e5f1a`) · 03/10/2026 (ronda 5: re-prueba de RF-02 tras correcciones de Armando para D-02, D-03, D-05 y D-06, commit `91fa466`) · 03/10/2026 (ronda 6: re-prueba tras correcciones de Armando para D-09 y D-10, commit `f06c14e`; revisión del commit `285dba9` de Jose Carlos, aún no integrado) · 04/10/2026 (ronda 7: re-prueba tras la reescritura del módulo de pedidos de Jose Carlos, commit `3b3a70a`) |

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
| Base de datos | `server/bd/funciones/crear_pedido_con_detalles.sql` (función transaccional, ronda 5) |
| Interfaz | `app/pages/destinatarios/index.vue` · `app/pages/pedidos/index.vue` y sus componentes |
| Tiempo real (RF-05) | `app/components/productos/ListadoProductos/ListadoProductos.ts` (suscripción de Supabase Realtime a la tabla `producto`) |

**Aclaración de alcance del RF-05:** según confirmó Carolina (responsable del RF-05), el listado en tiempo real aplica **solo al listado de Productos**. Los listados de Pedidos y Destinatarios se actualizan al registrar un elemento o con el botón de recarga, y eso es el comportamiento esperado.

**Fuera de este documento:** login (RF-15) y CRUD de productos (Sprint 1). Se re-probaron el 03/10/2026 junto con las pruebas automáticas del RF-05 en [sprint1-pruebas.md](sprint1-pruebas.md) (casos IP-19 e IP-20, defectos D-11 a D-14).

---

## 2. Herramientas y ejecución

| Tipo | Herramienta | Comando | ¿Usa la base de datos? | ¿Corre en CI? |
| --- | --- | --- | --- | --- |
| Unitarias | Vitest | `npm test` | No (repositorios simulados con mocks) | Sí |
| Integración | Vitest + `@nuxt/test-utils` | `npm run test:integration` | Sí (Supabase compartida) | No (requiere `.env`) |
| Manuales | Navegador | `npm run dev` | Sí | No |

### Reglas para no afectar la base compartida (pruebas de integración)

- Todo dato creado lleva la marca **`[QA-TEST]`** en el nombre (destinatarios y productos) o en `encargado_entrega` (pedidos), más un número de corrida.
- Los productos de prueba se crean con `stock_actual` suficiente (100), salvo uno con stock 1 para probar el rechazo por stock.
- Al terminar (`afterAll`) se borran **solo los IDs creados por la prueba**, en orden: `auditoria` (filas `REGISTRAR_PEDIDO` de los pedidos de prueba) → `detalle_pedido` → `pedido` → `destinatario` → `producto`.
- Los registros existentes **solo se leen**; se usa un usuario activo existente como autor del pedido, sin modificarlo.
- Si no existe `.env`, la suite se omite en lugar de fallar.
- Mientras corre la suite (~45 s), los productos `[QA-TEST]` pueden aparecer brevemente en la pantalla de Productos porque esa lista usa Realtime.

Verificación posterior a la ejecución del 03/10/2026: **0 destinatarios, 0 productos y 0 pedidos con la marca `[QA-TEST]` quedaron en la base, ni filas de auditoría de los pedidos de prueba.**

---

## 3. Resumen de resultados

| Tipo | Casos | Pasan | Fallan por defecto conocido | Pendientes |
| --- | --- | --- | --- | --- |
| Unitarias | 69 | 68 | 1 (D-02) | 0 |
| Integración | 29 | 28 | 1 (D-03) | 0 |
| Manuales | 18 | — | — | 18 |

> Resultados de la **ronda 7** (después de `3b3a70a`). Ronda 6: 64 + 1 unitarias y 27 + 2 de integración. Ronda 5: 64 + 3 unitarias y 27 + 2 de integración. Ronda 1: 38 + 3 unitarias y 16 + 0 de integración. Ronda 2: 41 + 2 y 19 + 1. Ronda 3: 41 + 2 y 22 + 1. Ronda 4: 47 + 2 y 23 + 0.
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
| UP-05 | Sin productos | Rechaza: "El pedido debe contener al menos un producto." (mensaje cambiado en ronda 7) | ✅ Pasa |
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
| UP-19 | Prioridad `BAJA`, `NORMAL`, `ALTA`, `URGENTE` (4 casos) | Válido | ✅ Pasa (ronda 5) |
| UP-20 | Prioridad fuera del catálogo: `CUALQUIERA`, `''` (2 casos) | Rechaza | ✅ Pasa (ronda 5; en rondas 1–4 fallaba por **D-05**) |
| UP-25 | Prioridad en minúsculas o con espacios (`alta`, ` urgente `) | Se acepta y se guarda en mayúsculas (cambio de ronda 7) | ✅ Pasa (ronda 7) |
| UP-26 | Fecha de entrega vacía (`''`) | Se trata como sin fecha (`null`) | ✅ Pasa (ronda 7) |
| UP-21 | Mensaje de prioridad inválida | "La prioridad debe ser BAJA, NORMAL, ALTA o URGENTE." (texto actualizado en ronda 7) | ✅ Pasa (ronda 6; en ronda 5 fallaba por **D-09**) |
| UP-22 | Fecha de entrega en el pasado: `2020-01-01` y ayer (2 casos) | Rechaza: "La fecha de entrega no puede ser anterior a la fecha actual." | ✅ Pasa (ronda 5; en rondas 1–4 fallaba por **D-06**) |
| UP-23 | Fecha de entrega de hoy | Válido | ✅ Pasa (ronda 5) |
| UP-24 | Fecha de hoy en Costa Rica con el servidor en UTC (7:00 p. m.) | Válido | ✅ Pasa (ronda 6; en ronda 5 fallaba por **D-10**) |

> Las pruebas del DTO de pedidos fijan el reloj en el 03/10/2026 para que los casos de fecha no caduquen.

### 4.3 RF-02 · `PedidoService` (`pedido.service.test.ts`)

| ID | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| US-01 | Destinatario, usuario, productos y stock válidos | Llama a `crearPedido` y devuelve el pedido | ✅ Pasa |
| US-07 | Auditoría del pedido creado (CU02 paso 8) | Registra `REGISTRAR_PEDIDO` con usuario, ID y detalle | ✅ Pasa (ronda 5) |
| US-02 | Destinatario inexistente o inactivo | Error 400; no guarda | ✅ Pasa |
| US-03 | Usuario inexistente o inactivo | Error 400; no guarda | ✅ Pasa |
| US-04 | Algún producto inexistente o inactivo (2 casos) | Error 400; no guarda | ✅ Pasa |
| US-08 | Cantidad mayor al stock actual | Registra (la validación de stock se retiró en `f06c14e`; en ronda 5 se probaba el rechazo) | ✅ Pasa (ronda 6) |
| US-05 | Falla el guardado del pedido | Propaga el error y no audita | ✅ Pasa |
| US-06 | Listar pedidos | Devuelve lo que entrega el repositorio | ✅ Pasa |

### 4.3.1 RF-02 · `PedidoRepository.crearPedido` (`pedido.repository.test.ts`, reescrito en ronda 7)

Supabase simulado; no toca la base. En ronda 7 se quitó la función transaccional y se volvió a guardar en dos pasos con limpieza; los casos UR-01 a UR-03 de rondas 5–6 (función transaccional) se reemplazaron por estos.

| ID | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UR-01 | Pedido válido | Guarda la cabecera (`estado: PENDIENTE`) y luego los detalles con `cantidad_entregada: 0` | ✅ Pasa |
| UR-02 | Pedido sin productos | Error; no inserta nada | ✅ Pasa |
| UR-03 | Falla la cabecera | Error "Error al registrar cabecera del pedido"; no guarda detalles | ✅ Pasa |
| UR-04 | Fallan los detalles | Borra detalles y cabecera; error "Operación revertida" | ✅ Pasa |
| UR-05 | Fallan los detalles **y** también la limpieza | Informa que no se pudo revertir | ❌ Falla — **D-02** (dice "Operación revertida") |

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
| IT-07 | RF-02 | Pedido sin productos | `detalles: []` | 400 "…al menos un producto" | ✅ Pasa |
| IT-08 | RF-02 | Productos repetidos | Mismo `id_producto` dos veces | 400 "No repitas productos" | ✅ Pasa |
| IT-09 | RF-02 | Cantidad cero | `cantidad: 0` | 400 "…mayor que cero" | ✅ Pasa |
| IT-10 | RF-02 | Destinatario inexistente | `id_destinatario: 999999999` | 400 "El destinatario no existe…" | ✅ Pasa |
| IT-11 | RF-02 | Destinatario inactivo | Destinatario `[QA-TEST]` con `estado: false` | 400 "El destinatario no existe…" | ✅ Pasa |
| IT-12 | RF-02 | Usuario inexistente | `id_usuario: 999999999` | 400 "El usuario no existe…" | ✅ Pasa |
| IT-13 | RF-02 | Producto inactivo | Producto `[QA-TEST]` con `estado: false` | 400 "Uno o más productos no existen…" | ✅ Pasa |
| IT-24 | RF-02 | Auditoría registrada | Consulta a `auditoria` del pedido de IT-05 | Una fila `REGISTRAR_PEDIDO` con el usuario del pedido | ✅ Pasa (ronda 5) |
| IT-25 | RF-02 | Prioridad fuera del catálogo | `prioridad: 'CUALQUIERA'` | 400 | ✅ Pasa (ronda 5, **D-05**) |
| IT-26 | RF-02 | Fecha de entrega pasada | `fecha_entrega: '2020-01-01'` | 400 "…no puede ser anterior a la fecha actual" | ✅ Pasa (ronda 5, **D-06**) |
| IT-27 | RF-02 | Pedido que supera el stock | 5 unidades de un producto con stock 1 | 201 (la validación de stock se retiró en `f06c14e`; en ronda 5 se esperaba 400) | ✅ Pasa (ronda 6) |
| IT-14 | RF-02 | Los rechazos no dejan registros | Pedidos del destinatario de prueba | Solo existe el pedido de IT-05 | ✅ Pasa |
| IT-15 | RF-02 | El pedido aparece en el listado | `GET /api/pedidos` | Incluye destinatario y 2 productos con nombre | ✅ Pasa |
| IT-16 | RF-02 | Orden del listado | `GET /api/pedidos` | Del más reciente al más antiguo | ✅ Pasa |
| ~~IT-28~~ | RF-02 | La función transaccional existe en Supabase | — | **Retirado en ronda 7:** el código ya no usa la función (commit `3b3a70a`). D-02 se cubre con UR-04 y UR-05 | — |
| IT-29 | RF-02 | Registrar pedido sin sesión | `POST /api/pedidos` sin cookie ni token | 401 | ❌ Falla — **D-03** (responde 201; el pedido `[QA-TEST]` se elimina al final) |
| IT-30 | RF-02 | Prioridad en minúsculas | `prioridad: 'urgente'` | 201 y se guarda `URGENTE` | ✅ Pasa (ronda 7) |

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
| M-07 | RF-02 | `/pedidos` (con sesión iniciada) | Registrar pedido con 2 productos; verificar que el bloque "Usuario que registra" muestra el usuario del login | Mensaje "Pedido registrado correctamente.", el formulario se reinicia y el pedido aparece en el listado | Pendiente |
| M-08 | RF-02 | `/pedidos` | Agregar 3 líneas de producto y quitar la del medio | Se elimina la línea correcta; no se puede quitar la última | Pendiente |
| M-09 | RF-02 | `/pedidos` | Seleccionar el mismo producto en dos líneas y registrar | Error "No repitas productos…" | Pendiente |
| M-10 | RF-02 | `/pedidos` | Cantidad `0` o vacía | Error "Completa cada producto con una cantidad mayor que cero." | Pendiente |
| M-11 | RF-02 | `/pedidos` **sin** iniciar sesión (borrar la cookie `usuario_sesion`) | Abrir la pantalla e intentar registrar | Mensaje "Se requiere una sesión activa…"; no se registra | Pendiente — se espera falla por **D-03** (muestra "Sesión activa · ID: 1" y registra como usuario 1) |
| M-12 | RF-02 | `/pedidos` | Pulsar "Actualizar" | El listado se recarga y muestra destinatario, fechas, prioridad, estado y productos | Pendiente |
| M-13 | RF-05 (automatizado también en IP-19, ver sprint1-pruebas.md) | `/productos` en dos pestañas | Registrar un producto `[QA-TEST]` en la pestaña A y observar la B **sin** recargar | El producto aparece solo en la pestaña B | Pendiente |
| M-14 | RF-12 / RF-02 | `/destinatarios` y `/pedidos` | Registrar un destinatario y abrir `/pedidos` | El nuevo destinatario aparece en el selector | Pendiente |
| M-15 | RF-05 | `/productos` en dos pestañas | Editar el producto `[QA-TEST]` (RF-03) en la pestaña A, luego darlo de baja (RF-04) | La pestaña B refleja cada cambio sin recargar | Pendiente |
| M-17 | RF-02 | `/pedidos` | Abrir el selector de fecha de entrega | No permite elegir días anteriores a hoy | Pendiente |
| M-18 | RF-02 | `/pedidos` | Pedir más unidades que el stock de un producto `[QA-TEST]` | Se registra (la validación de stock se retiró en `f06c14e`) | Pendiente |
| M-16 | RF-05 | `/productos` | Navegar a otra página y volver varias veces; luego hacer un cambio desde otra pestaña | La lista se actualiza una sola vez por cambio (la suscripción se cierra al salir de la página y no se duplica) | Pendiente |

---

## 7. Defectos encontrados

| ID | Severidad | RF | Descripción | Evidencia | Responsable sugerido |
| --- | --- | --- | --- | --- | --- |
| ~~D-01~~ | — | RF-05 | **Descartado.** Se reportó que Pedidos y Destinatarios no tienen listado en tiempo real. Carolina confirmó que el RF-05 aplica solo al listado de Productos, donde sí está implementado. No es un defecto. | `app/components/productos/ListadoProductos/ListadoProductos.ts:182` | — |
| D-02 | Baja | RF-02 | ⚠️ **Mejorado, pero sigue abierto (ronda 7, commit `3b3a70a`).** Jose Carlos quitó la función transaccional y reforzó la limpieza: si fallan los detalles, borra los detalles parciales y la cabecera, y verifica que los detalles se hayan insertado. Pendiente: los errores de esa limpieza **se ignoran**, así que si la limpieza falla el pedido queda sin productos y aun así se responde "Operación revertida" (caso UR-05). Basta con revisar el `error` de cada `delete` e informar si no se pudo revertir. El archivo `server/bd/funciones/crear_pedido_con_detalles.sql` quedó sin uso; conviene eliminarlo o dejar claro que no se aplica. Se baja la severidad a **Baja** porque requiere dos fallas seguidas. — Ronda 6: En `f06c14e` Armando agregó al SQL los permisos (`REVOKE` a `public` y `anon`, `GRANT` a `service_role` y `authenticated`), pero la función **sigue sin crearse** en Supabase (verificado de nuevo: `PGRST202`) y el respaldo del repository no cambió (UR-03). Nota: el `GRANT … TO authenticated` permite que cualquier usuario de Supabase Auth (por ejemplo, quien entra con Google) llame la función directamente y se salte las validaciones del servidor; basta con `service_role`. — Ronda 5: Armando agregó la función transaccional `crear_pedido_con_detalles` y el repository la usa con un respaldo, pero: **(1)** la función **no está creada en Supabase** (respuesta `PGRST202`, verificado sin insertar datos; caso IT-28), así que en la práctica se sigue usando la inserción no transaccional; **(2)** cualquier error de la función se ignora y se reintenta por la vía no transaccional, no solo cuando la función no existe (caso UR-03). Recomendaciones: ejecutar el SQL en Supabase coordinándolo con el equipo; usar el respaldo solo ante `PGRST202` (o eliminarlo); y al crear la función, como es `SECURITY DEFINER` y la clave `anon` es pública, agregar `SET search_path = public` y `REVOKE EXECUTE ON FUNCTION public.crear_pedido_con_detalles FROM anon, authenticated`, para que nadie la llame directamente saltándose las validaciones del servidor. — Descripción original: el registro no era transaccional; si fallaban los detalles se borraba el pedido manualmente, y si ese borrado fallaba quedaba un pedido sin detalles. | `server/repositories/pedido.repository.ts` (`crearPedido`); `server/bd/funciones/crear_pedido_con_detalles.sql`; casos UR-01 a UR-03, IT-28 | Jose Carlos (corrección hecha por Armando) |
| D-03 | Alta | RF-02 | ⚠️ **Corregido parcialmente (ronda 5; sin cambios en ronda 6).** El formulario ya no pide el ID a mano: toma el usuario de la cookie `usuario_sesion` que guarda el login. Pendiente: **(1)** si no hay sesión, `idUsuarioActual` usa `\|\| 1` y registra el pedido como el usuario 1, por lo que el mensaje "Se requiere una sesión activa" nunca aparece; **(2)** el servidor sigue sin exigir sesión (`server/middleware/auth.ts` comentado) y confía en el `id_usuario` que llega en el cuerpo, y la cookie la puede editar el navegador (caso IT-29). — Descripción original: el `id_usuario` se escribía a mano y cualquiera podía registrar un pedido a nombre de otro usuario. | `app/components/pedidos/RegistrarPedido.vue` (`idUsuarioActual`); `app/composables/useAuth.ts`; `server/middleware/auth.ts`; casos IT-29, M-11 | Jose Carlos / Manuel (RF-15) |
| D-04 | Baja | RF-12 | ✅ **Corregido y verificado en ronda 2** (commit `429945f`, se agregó `.trim()`). `nombre_empresa` aceptaba un texto de solo espacios porque el DTO no aplica `.trim()`. | `server/dtos/destinatario.dto.ts:4`; casos UD-11, UD-12, IT-17 | Manuel |
| D-05 | Baja | RF-02 | ✅ **Corregido y verificado en ronda 5** (commit `91fa466`, lista cerrada `BAJA`/`NORMAL`/`ALTA`/`URGENTE`). `prioridad` aceptaba cualquier texto. Ver D-09 sobre el mensaje. | `server/dtos/pedido.dto.ts`; casos UP-19, UP-20, IT-25 | Jose Carlos (corrección hecha por Armando) |
| D-06 | Media | RF-02 | ✅ **Corregido y verificado en ronda 5** (commit `91fa466`, validación en el DTO y `min` en el selector de fecha). Se permitía una fecha de entrega en el pasado. Ver D-10 sobre la zona horaria. | `server/dtos/pedido.dto.ts`; `RegistrarPedido.vue`; casos UP-22, UP-23, IT-26, M-17 | Jose Carlos (corrección hecha por Armando) |
| D-07 | Baja | RF-12 | ✅ **Corregido y verificado en ronda 2** (commit `429945f`, el service busca el nombre antes de registrar). No se validaba que el destinatario no exista ya: se puede registrar dos veces la misma empresa. | `server/repositories/destinatario.repository.ts`; casos UDS-05, IT-18, IT-19 | Manuel |
| D-08 | Baja | RF-12 | ✅ **Corregido y verificado en ronda 4** (commit `33e5f1a`): el service compara el nombre exacto en minúsculas y sin espacios externos, sin usar `ilike`, por lo que ya no hay comodines. Historial — ronda 3 (commit `1533256`), corregido parcialmente: Ya se escapan `%`, `_` y `\`, y se cambió `maybeSingle()` por `limit(1)`, por lo que no aparece el error técnico. **Pendiente:** PostgREST (Supabase) también trata `*` como comodín en `ilike`, y no se escapa: `Soda*…` se rechaza como duplicado de `Soda Prueba …` (caso IT-22). Como PostgREST convierte `*` en `%` antes de llegar a PostgreSQL, escaparlo con `\` podría no bastar. Opción más segura: traer los candidatos y comparar en el service con `nombre.trim().toLowerCase()` exacto, o crear una función RPC que compare con `lower(nombre_empresa) = lower($1)`. — Descripción original (ronda 2): La validación de duplicados de D-07 usa `ilike`, donde `_` y `%` son comodines. Un nombre distinto puede rechazarse como duplicado (`Soda_Prueba` coincide con `Soda Prueba`). Además, si el nombre coincide con varios registros (por ejemplo `%`), `maybeSingle()` lanza un error técnico en vez del mensaje de duplicado. Se recomienda escapar `\`, `%` y `_` antes de usar `ilike`, o comparar con `.eq()` sobre el nombre normalizado. | `server/repositories/destinatario.repository.ts` (`buscarPorNombre`); casos IT-20 a IT-23. Verificado en la base con solo lectura: buscar `R_ckstar Games` devuelve `Rockstar Games`. | Manuel |
| D-09 | Baja | RF-02 | ✅ **Corregido y verificado en ronda 6** (commit `f06c14e`, se cambió `errorMap` por `message`). Descripción original (ronda 5): El mensaje personalizado de prioridad usa la opción `errorMap`, que Zod 4 ya no reconoce y descarta sin avisar. El usuario ve `Invalid option: expected one of "BAJA"\|"NORMAL"\|"ALTA"\|"URGENTE"` en inglés. En Zod 4 se usa `{ error: '…' }` o `{ message: '…' }`. | `server/dtos/pedido.dto.ts` (`PrioridadPedidoEnum`); caso UP-21 | Jose Carlos (Armando) |
| D-10 | Baja | RF-02 | ✅ **Corregido y verificado en ronda 6** (commit `f06c14e`, se usa `Intl.DateTimeFormat` con `America/Costa_Rica` en el DTO y en el formulario). Descripción original (ronda 5): La fecha de "hoy" para validar la entrega se calcula con la zona horaria del **servidor**. En un servidor en UTC (lo habitual al publicar), después de las 6:00 p. m. de Costa Rica ya es el día siguiente, y un pedido para hoy se rechaza como "anterior a la fecha actual". Se sugiere calcular la fecha con `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica' }).format(new Date())`. | `server/dtos/pedido.dto.ts` (`superRefine`); caso UP-24 | Jose Carlos (Armando) |

**Nota sobre D-07:** la validación se hace en la aplicación. Como la tabla no tiene restricción `UNIQUE`, dos registros enviados al mismo tiempo con el mismo nombre podrían pasar ambos. Es poco probable en el uso real; la solución completa sería un índice único sobre `lower(nombre_empresa)`, lo cual requiere coordinarlo con el equipo porque modifica la base.

### Observaciones adicionales (no bloqueantes)

- **Validaciones repetidas (ronda 7):** las reglas de prioridad, fecha de entrega, productos repetidos y cantidad ahora están en tres lugares: el formulario, el DTO y el service. Funcionan, pero si alguien cambia una regla en un lugar y no en los otros, los mensajes y el comportamiento pueden quedar distintos.
- **Registros de auditoría de pedidos reales:** en la base hay dos filas `REGISTRAR_PEDIDO` (pedidos #16 y #17, del 03/10/2026) creadas por el equipo al usar la app. No son de las pruebas y no se tocaron.
- **Regla de stock:** en ronda 5 Armando agregó el rechazo por stock insuficiente (CU02 flujo 5.1) y en ronda 6 (`f06c14e`) lo retiró. Hoy un pedido se acepta aunque supere el stock. Conviene dejar por escrito cuál es la regla acordada.
- **Prioridad `BAJA`:** el backend la acepta, pero el selector de la interfaz no la ofrece (solo Normal, Alta y Urgente).
- **Código sin uso en pedidos:** `PedidoRepository.productosActivosExisten` ya no la usa el service.

- **Validación de duplicados (D-07/D-08):** el service trae **todos** los destinatarios en cada registro para comparar el nombre. Funciona bien con el volumen actual, pero Supabase devuelve como máximo 1000 filas por consulta por defecto; con más de 1000 destinatarios, los más antiguos no se revisarían. Además, `buscarPorNombre` en `destinatario.repository.ts` quedó sin uso y podría eliminarse.

- **Errores silenciosos en el listado de destinatarios:** si `GET /api/destinatarios` falla, `ListadoDestinatarios.vue` solo escribe en consola y muestra "No hay destinatarios registrados aún.", lo que puede confundir al usuario.
- **`.gitignore` dañado (corregido):** la última línea estaba guardada con otra codificación y decía `doc/.output/`, por lo que la carpeta de build `.output/` no se ignoraba. Se reemplazó por `.output/`; tras el merge con `main` el archivo quedó con `.output/` y `doc/` en líneas separadas.
- **Credenciales por defecto en el código:** `server/utils/supabase.ts` incluye una URL y una clave pública de Supabase como respaldo si falta el `.env`. Conviene eliminar ese respaldo y fallar con un mensaje claro.

### Commit `285dba9` de Jose Carlos (revisado en ronda 6; reemplazado en ronda 7)

> **Actualización ronda 7:** este commit nunca se integró; la rama `NewJoseBranch` se eliminó y Jose Carlos subió en su lugar el commit `3b3a70a`, que ya no usa la inserción anidada, calcula la fecha con la zona horaria de Costa Rica e incluye `BAJA`. Lo de abajo queda como registro.

Está solo en la rama `NewJoseBranch`; **no está en `main`** ni en esta rama, por lo que no forma parte de los resultados de arriba. Se revisó el código y se verificó en la base sin crear datos:

| Hallazgo | Impacto |
| --- | --- |
| Parte de un `main` anterior a los cambios de Armando y modifica los mismos archivos (`pedido.dto.ts`, `pedido.repository.ts`, `RegistrarPedido.vue`) | Habrá conflictos al integrarlo y podría deshacer las correcciones de D-02, D-05, D-06, D-09 y D-10 |
| `crearPedido` inserta `detalle_pedido` dentro del `insert` de `pedido` (inserción anidada) | **Supabase no lo admite**: responde `PGRST204 Could not find the 'detalle_pedido' column of 'pedido'` (verificado, no se creó ningún registro). Con este cambio **no se podría registrar ningún pedido** |
| La fecha de "hoy" se calcula con `new Date().toISOString()` (UTC) | Vuelve a introducir D-10, y de forma más visible: en Costa Rica, después de las 6:00 p. m. ya rechaza pedidos para hoy |
| La prioridad no incluye `BAJA` y acepta minúsculas | Inconsistente con el DTO actual de `main` |

**Recomendación:** no integrar `285dba9` tal como está. Lo que busca corregir ya quedó resuelto en `main` con los commits de Armando, salvo D-02 y D-03.

---

## 8. Cambios realizados por QA

| Archivo | Cambio |
| --- | --- |
| `package.json` / `package-lock.json` | Dependencias de desarrollo `vitest` y `@nuxt/test-utils`; scripts `test`, `test:watch` y `test:integration` |
| `vitest.config.ts` | Configuración de pruebas unitarias |
| `vitest.integration.config.ts` | Configuración de pruebas de integración |
| `tests/unit/*.test.ts` | 5 archivos de pruebas unitarias (ronda 2: D-04 pasa a prueba normal; ronda 4: casos de D-07/D-08; ronda 5: casos de D-05, D-06, stock, auditoría y el nuevo `pedido.repository.test.ts`) |
| `tests/integration/destinatarios-pedidos.test.ts` | Pruebas de integración de la API (ronda 2: IT-17 a IT-20; ronda 3: IT-21 a IT-23; ronda 5: IT-24 a IT-29 y limpieza de `auditoria`) |
| `.github/workflows/ci.yml` | Nuevo paso "5. Ejecutar pruebas unitarias" (`npm test`) |
| `.gitignore` | Línea dañada reemplazada por `.output/` |

No se modificó código de los requerimientos de los compañeros. Los defectos quedan reportados para que cada responsable los corrija.
