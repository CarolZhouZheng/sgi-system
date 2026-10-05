# QA · Sprint 1 — Autenticación y CRUD de Productos (re-prueba)

| Campo | Detalle |
| --- | --- |
| Sprint | 1 (05 – 18 de septiembre) |
| Módulo | Autenticación y Productos |
| Requerimientos cubiertos | RF-15 Autenticación · RF-01 Registro de Producto · RF-03 Actualización de Datos · RF-04 Baja (y reactivación) de Producto · RF-05 Tiempo Real de Productos (Sprint 2, se prueba aquí porque vive en el módulo de Productos) |
| Responsable QA original | Jose Carlos |
| Re-prueba | Alessandro Godinez, 03/10/2026, como parte de la prueba de todo el sistema · ronda 2 tras la corrección de D-11 (commit `c139fea`) · ronda 3 (04/10/2026) tras los cambios de Manuel para D-12, D-13 y D-14 (commits `77e8eee`, `683bd70`, `d21f88a`) |
| Rama | `Branch-Alessandro` |

> Los defectos continúan la numeración del documento del Sprint 2 ([sprint2-pruebas.md](sprint2-pruebas.md)): aquí empiezan en **D-11**.

---

## 1. Alcance

| Capa | Archivos probados |
| --- | --- |
| API | `server/api/auth/login.post.ts` · `server/api/productos/index.get.ts`, `index.post.ts`, `[id].put.ts`, `[id].delete.ts`, `[id]/reactivar.patch.ts` |
| DTO | `server/dtos/login.dto.ts` · `server/dtos/producto.dto.ts` |
| Service | `server/services/auth.service.ts` · `server/services/producto.service.ts` |
| Utilidades | `server/utils/password.ts` |
| Tiempo real | Canal de Supabase Realtime sobre `producto` (el que usa `ListadoProductos.ts`) |
| Páginas | Protección de rutas (`middleware/auth.ts`) |

---

## 2. Ejecución

| Tipo | Comando | Archivos |
| --- | --- | --- |
| Unitarias | `npm test` | `tests/unit/producto.dto.test.ts`, `producto.service.test.ts`, `auth.service.test.ts` |
| Integración | `npm run test:integration` | `tests/integration/productos.test.ts`, `auth.test.ts` (helper común: `helpers.ts`) |

### Datos de prueba en la base compartida

- **Productos:** se crean por la API con nombre `[QA-TEST] …` y se borran al terminar. Mientras corre la suite pueden aparecer unos segundos en la pantalla de Productos (tiempo real).
- **Usuarios:** se crean 3 usuarios temporales (`qa-test-activo-…`, `qa-test-inactivo-…`, `qa-test-sinclave-…`, nombre `[QA-TEST]`) con una contraseña aleatoria por corrida, y se borran al terminar. Los usuarios y roles existentes solo se leen.
- Verificación posterior (03/10/2026): **0** destinatarios, productos, pedidos, usuarios o registros de auditoría de prueba quedaron en la base.

---

## 3. Resumen de resultados (Sprint 1 + RF-05)

| Tipo | Casos | Pasan | Fallan por defecto conocido |
| --- | --- | --- | --- |
| Unitarias | 54 | 54 | 0 |
| Integración | 35 | 34 | 1 (D-03, cookie sin `HttpOnly`) |

Ronda 1: 50 + 3 unitarias y 23 + 4 de integración. Ronda 2: 53 + 1 y 24 + 3.

**Todo el sistema** (Sprint 1 + Sprint 2, ronda 8 del 04/10/2026): unitarias **123** (122 pasan, 1 por defecto conocido) e integración **67** (64 pasan, 3 por defecto conocido). `npm test` y `npm run test:integration` terminan en verde.

---

## 4. Pruebas unitarias

### 4.1 RF-01 · `CrearProductoSchema`

| ID | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UPR-01 | Producto completo | Válido | ✅ Pasa |
| UPR-02 | Solo nombre y unidad | Stock 0, mínimo 0, estado activo | ✅ Pasa |
| UPR-03 | Stock con decimales (2.75) | Válido | ✅ Pasa |
| UPR-04 | Nombre vacío / de 151 caracteres | Rechaza con su mensaje | ✅ Pasa |
| UPR-05 | Unidad vacía / de 31 caracteres | Rechaza con su mensaje | ✅ Pasa |
| UPR-06 | Categoría de 101 caracteres | Rechaza | ✅ Pasa |
| UPR-07 | Stock actual o mínimo negativo | Rechaza | ✅ Pasa |
| UPR-08 | Stock enviado como texto (`'5'`) | Rechaza | ✅ Pasa |
| UPR-09 | Sin nombre ni unidad | Rechaza | ✅ Pasa |
| UPR-10 | Nombre de solo espacios | Rechaza: "El nombre es obligatorio" | ✅ Pasa (ronda 2; en ronda 1 fallaba por **D-11**) |
| UPR-11 | Unidad de medida de solo espacios | Rechaza: "La unidad de medida es obligatoria" | ✅ Pasa (ronda 2; en ronda 1 fallaba por **D-11**) |
| UPR-20 | Espacios externos en nombre, unidad, categoría y descripción | Se guardan sin ellos | ✅ Pasa (ronda 2) |

### 4.2 RF-03/RF-04 · `ProductoIdParamSchema` y RF-03 · `ActualizarProductoSchema`

| ID | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UPR-12 | ID `'15'` de la URL | Se convierte a 15 | ✅ Pasa |
| UPR-13 | ID `abc`, `1.5`, `0`, `-3` | Rechaza con el mensaje correspondiente | ✅ Pasa |
| UPR-14 | Actualizar un solo campo | Válido | ✅ Pasa |
| UPR-15 | Nombre con espacios externos | Se guarda sin ellos | ✅ Pasa |
| UPR-16 | Descripción y categoría `null` | Válido | ✅ Pasa |
| UPR-17 | Cuerpo vacío | "Debe enviar al menos un campo para actualizar" | ✅ Pasa |
| UPR-18 | Solo `estado: false` | Rechaza (el estado se cambia con RF-04) | ✅ Pasa |
| UPR-19 | Nombre o unidad de solo espacios, stock negativo, stock como texto | Rechaza con su mensaje | ✅ Pasa |

### 4.3 RF-01/03/04 · `ProductoService`

| ID | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UPS-01 | Registrar producto | Llama al repositorio con los datos | ✅ Pasa |
| UPS-02 | Listar con filtro de estado | Pasa el filtro al repositorio | ✅ Pasa |
| UPS-03 | Actualizar producto activo | Actualiza | ✅ Pasa |
| UPS-04 | Descripción y categoría vacías | Se guardan como `null` | ✅ Pasa |
| UPS-05 | Actualizar producto inexistente | 404 "No se encontró ningún producto con ID …" | ✅ Pasa |
| UPS-06 | Actualizar producto dado de baja | 400; no actualiza | ✅ Pasa |
| UPS-07 | Dar de baja producto activo | `estado: false` | ✅ Pasa |
| UPS-08 | Dar de baja producto ya inactivo | 400; no repite la baja | ✅ Pasa |
| UPS-09 | Reactivar producto inactivo | `estado: true` | ✅ Pasa |
| UPS-10 | Reactivar producto activo | 400; no repite | ✅ Pasa |
| UPS-11 | Baja o reactivación de producto inexistente | 404 | ✅ Pasa |

### 4.4 RF-15 · Login (`LoginDTO`, `AuthService`) y `server/utils/password.ts`

| ID | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| UA-01 | Usuario y contraseña presentes | Válido | ✅ Pasa |
| UA-02 | Usuario o contraseña vacíos | Rechaza con su mensaje | ✅ Pasa |
| UA-03 | Credenciales correctas | Devuelve el usuario **sin** `contrasena_hash` | ✅ Pasa |
| UA-04 | Contraseña incorrecta | "Credenciales inválidas" | ✅ Pasa |
| UA-05 | Usuario inexistente o inactivo | El mismo mensaje (no revela cuál falló) | ✅ Pasa |
| UA-06 | Usuario sin contraseña guardada (`NULL`) | "Credenciales inválidas" | ❌ Falla — **D-12** |
| UA-07 | `password.ts`: verificar contraseña correcta / incorrecta | `true` / `false` | ✅ Pasa |
| UA-08 | `password.ts`: hash con sal aleatoria | Dos hashes distintos para la misma clave | ✅ Pasa |
| UA-09 | `password.ts`: hash mal formado | `false`, sin lanzar error | ✅ Pasa |

---

## 5. Pruebas de integración

### 5.1 Productos (`productos.test.ts`)

| ID | RF | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- | --- |
| IP-01 | RF-01 | `POST /api/productos` | 201, stock 0, estado activo | ✅ Pasa |
| IP-02 | RF-01 | Listado general, `?estado=true` y `?estado=false` | Aparece en los dos primeros, no en inactivos | ✅ Pasa |
| IP-03 | RF-01 | `total` del listado | Igual a la cantidad devuelta | ✅ Pasa |
| IP-04 | RF-01 | Nombre vacío y stock negativo | 400 con la lista de campos inválidos | ✅ Pasa |
| IP-05 | RF-01 | Nombre de solo espacios | 400 | ✅ Pasa (ronda 2; en ronda 1 fallaba por **D-11**) |
| IP-06 | RF-03 | `PUT` nombre con espacios externos y stock | 200, nombre sin espacios, stock actualizado | ✅ Pasa |
| IP-07 | RF-03 | Categoría vacía | Se guarda `null` | ✅ Pasa |
| IP-08 | RF-03 | Cuerpo vacío | 400 | ✅ Pasa |
| IP-09 | RF-03 | ID no numérico (`/abc`) | 400 | ✅ Pasa |
| IP-10 | RF-03 | Producto inexistente | 404 | ✅ Pasa |
| IP-11 | RF-04 | `DELETE` (baja lógica) | 200, `estado: false`, aparece en inactivos | ✅ Pasa |
| IP-12 | RF-04 | Baja por segunda vez | 400 "…ya se encuentra dado de baja" | ✅ Pasa |
| IP-13 | RF-03/04 | Modificar producto dado de baja | 400 | ✅ Pasa |
| IP-14 | RF-04 | `PATCH …/reactivar` | 200, `estado: true` | ✅ Pasa |
| IP-15 | RF-04 | Reactivar producto activo | 400 "…ya se encuentra activo" | ✅ Pasa |
| IP-16 | RF-04 | Baja de producto inexistente | 404 | ✅ Pasa |
| IP-17 | RF-04 | Baja con ID 0 | 400 | ✅ Pasa |
| IP-18 | RF-04 | Reactivar producto inexistente | 404 | ✅ Pasa |
| IP-19 | RF-05 | Suscripción Realtime con la clave pública y creación de un producto | Llega el aviso `INSERT` | ✅ Pasa |
| IP-20 | RF-05 / seguridad | Leer `producto` directamente con la clave pública | Denegado (`42501`) | ✅ Pasa |

**Nota sobre RF-05:** como la clave pública no tiene permiso de lectura sobre `producto` (IP-20, correcto por seguridad), el aviso de tiempo real llega **sin datos** (`new: {}`). No afecta a la pantalla: `ListadoProductos.ts` solo usa el aviso para volver a pedir la lista al servidor. Si en el futuro alguien quisiera usar los datos del aviso, tendría que revisar ese permiso.

### 5.2 Autenticación y páginas (`auth.test.ts`)

| ID | RF | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- | --- |
| IA-01 | RF-15 | Login con credenciales correctas | 200 y usuario **sin** `contrasena_hash` | ✅ Pasa |
| IA-02 | RF-15 | Contraseña incorrecta | 401 "Credenciales inválidas" | ✅ Pasa |
| IA-03 | RF-15 | Usuario inexistente | 401 "Credenciales inválidas" | ✅ Pasa |
| IA-04 | RF-15 | Usuario inactivo | 401 "Credenciales inválidas" | ✅ Pasa |
| IA-05 | RF-15 | Usuario sin contraseña guardada | 401 "Credenciales inválidas" | ✅ Pasa (ronda 3; antes fallaba por **D-12**) |
| IA-06 | RF-15 | Usuario y contraseña vacíos | 400 "Por favor, completa correctamente el usuario y la contraseña." | ✅ Pasa (ronda 3; antes fallaba por **D-13**) |
| IA-07 | RF-15 | Abrir `/pedidos`, `/productos` y `/destinatarios` sin sesión (3 casos) | Redirige a `/login` | ✅ Pasa (ronda 3; antes fallaba por **D-14**) |
| IA-08 | RF-15 | Login correcto | Crea la cookie `usuario_session` con el id del usuario y `Path=/` | ✅ Pasa (ronda 3) |
| IA-09 | RF-15 | La cookie de sesión es `HttpOnly` | Sí | ❌ Falla — **D-03** (no es `HttpOnly` ni va firmada) |
| IA-10 | RF-15 | Login fallido | No crea cookie de sesión | ✅ Pasa (ronda 3) |
| IA-11 | RF-15 | Abrir `/login` sin sesión | 200 | ✅ Pasa (ronda 3) |
| IA-12 | RF-15 | Abrir `/pedidos` con sesión | 200 | ✅ Pasa (ronda 3) |
| IA-13 | RF-15 | Abrir `/login` con sesión | Redirige a `/productos` | ✅ Pasa (ronda 3) |

---

## 6. Casos manuales

| ID | RF | Pasos | Resultado esperado | Resultado obtenido |
| --- | --- | --- | --- | --- |
| MS1-01 | RF-15 | Iniciar sesión con un usuario válido | Entra a `/productos`; el encabezado muestra el nombre del usuario | Pendiente |
| MS1-02 | RF-15 | Contraseña incorrecta | Mensaje "Credenciales inválidas" | Pendiente |
| MS1-03 | RF-15 | Pulsar "Cerrar sesión" y luego abrir `/productos` desde la barra de direcciones | Pide iniciar sesión | Pendiente — se espera falla por **D-16** |
| MS1-04 | RF-15 | Iniciar sesión con Google | Entra al sistema | Pendiente — se espera falla: Google no crea `usuario_session`, así que el middleware lo devuelve a `/login` (ver D-16) |
| MS1-05 | RF-01 | Registrar producto `[QA-TEST]` con stock decimal | Aparece en la lista | Pendiente |
| MS1-06 | RF-03 | Editar nombre, categoría y stock de un producto `[QA-TEST]` | Se guardan los cambios | Pendiente |
| MS1-07 | RF-04 | Dar de baja y reactivar un producto `[QA-TEST]` | Cambia el estado y se refleja en los filtros | Pendiente |
| MS1-08 | RF-01 | Buscar un producto por nombre en el listado | Filtra correctamente | Pendiente |

---

## 7. Defectos encontrados

| ID | Severidad | RF | Descripción | Evidencia | Responsable sugerido |
| --- | --- | --- | --- | --- | --- |
| D-11 | Baja | RF-01 | ✅ **Corregido y verificado en ronda 2** (commit `c139fea`: `.trim()` en el DTO y validación en el formulario). `CrearProductoSchema` no aplicaba `.trim()` a `nombre` ni a `unidad_medida` (el esquema de actualización sí lo hace), así que se puede crear un producto con nombre o unidad de solo espacios. Mismo problema que D-04 en destinatarios. | `server/dtos/producto.dto.ts`; casos UPR-10, UPR-11, IP-05 | Carolina |
| D-12 | Media | RF-15 | ✅ **Corregido y verificado en ronda 3** (commit `77e8eee`, valida `contrasena_hash` antes de comparar). Si un usuario tiene `contrasena_hash` en `NULL` (el esquema lo permite, por ejemplo si se creó para entrar con Google), `bcrypt.compare` lanza `Illegal arguments: string, object` y ese texto técnico llega a la pantalla de login. Se sugiere validar `if (!usuario?.contrasena_hash) throw new Error('Credenciales inválidas')` antes de comparar. | `server/services/auth.service.ts`; casos UA-06, IA-05 | Manuel |
| D-13 | Baja | RF-15 | ✅ **Corregido y verificado en ronda 3** (commit `77e8eee`, `safeParse` y 400 con mensaje legible). Los errores de validación del login (campos vacíos) responden **401** y el mensaje es el JSON completo de Zod (`[{"origin":"string","code":"too_small",…}]`), que la pantalla muestra tal cual. Debería responder 400 con el primer mensaje (`error.issues[0].message`), como hace `destinatarios/index.post.ts`. | `server/api/auth/login.post.ts`; caso IA-06 | Manuel |
| D-14 | Alta | RF-15 | ✅ **Corregido y verificado en ronda 3** (commit `683bd70`, middleware global `app/middleware/auth.global.ts`; casos IA-07, IA-11 a IA-13). Ver D-16 sobre el cierre de sesión. — Original: **Ninguna página exigía iniciar sesión.** `middleware/auth.ts` tiene `isAuthenticated = true` fijo y además está en la raíz del proyecto; en Nuxt 4 los middlewares deben estar en `app/middleware/`, así que ni siquiera se carga. Cualquiera puede abrir `/productos`, `/pedidos` o `/destinatarios` sin login. Relacionado con D-03. | `middleware/auth.ts`; caso IA-07 | Manuel |

| D-16 | Alta | RF-15 | **Nuevo (ronda 3).** **Cerrar sesión no cierra la sesión.** Hay dos cookies con nombres casi iguales: el servidor y el middleware usan `usuario_session` (dura una semana), y `useAuth` usa `usuario_sesion`. `logout()` borra solo `usuario_sesion` y redirige a `/login/login`, ruta que ya no existe tras el cambio a `/login`. Como `usuario_session` sigue viva, el usuario sigue dentro del sistema. Además, el login con Google nunca crea `usuario_session`, así que el middleware lo devuelve siempre a `/login` y **ya no se puede entrar con Google**. Se sugiere usar un solo nombre de cookie, borrarla en el servidor con un endpoint de logout (`deleteCookie`) y redirigir a `/login`. | `app/composables/useAuth.ts` (`logout`); `app/middleware/auth.global.ts`; `server/api/auth/login.post.ts`; casos MS1-03, MS1-04 (revisión de código; se confirma en las pruebas manuales) | Manuel |

### Observaciones (no bloqueantes)

- **Login con Google sin sesión de la app:** `handleGoogleLogin` inicia sesión en Supabase Auth, pero nunca guarda la cookie `usuario_sesion`, así que al registrar un pedido se usa el usuario 1 (D-03). Además, `redirectTo` está fijo en `http://localhost:3000/productos` y fallará al publicar el sistema.
- **Dos mecanismos de contraseña:** el login usa `bcryptjs`, pero `server/utils/password.ts` (scrypt) no lo usa nadie. Conviene dejar solo uno.
- **`ultimo_acceso` no se actualiza** al iniciar sesión, aunque la tabla `usuario` tiene la columna.
- **Sin límite de intentos de login:** se puede probar contraseñas sin restricción.
- **Productos con nombre duplicado:** se permite registrar dos productos con el mismo nombre. Puede ser intencional, pero no es consistente con lo que se hizo en destinatarios (D-07).

---

## 8. Archivos de pruebas agregados

| Archivo | Contenido |
| --- | --- |
| `tests/unit/producto.dto.test.ts` | Esquemas de crear, actualizar e ID de producto |
| `tests/unit/producto.service.test.ts` | Reglas de registro, actualización, baja y reactivación (repositorio simulado) |
| `tests/unit/auth.service.test.ts` | `LoginDTO`, `AuthService.login` y `server/utils/password.ts` |
| `tests/integration/helpers.ts` | Marca `[QA-TEST]`, clientes de Supabase y función `pedir` compartidos |
| `tests/integration/productos.test.ts` | API de productos y tiempo real (RF-05) |
| `tests/integration/auth.test.ts` | Login y protección de páginas |
| `vitest.integration.config.ts` | Se excluye `helpers.ts` de la búsqueda de pruebas |
