# Sistema de Gestión de Inventario

## Panadería La Nueva Victoria

Sistema web para la gestión de inventario y procesos de la Panadería La Nueva Victoria.

--- LUEGO DE COMPLETAR LO QUE LES TOCA DEL SPRINT ES NECESARIO QUE PONGAN "COMPLETADO" PARA LLEVAR EL ORDEN Y BUENAS PRÁCTICAS. GRACIAS.

# Reparto de Sprints por Persona

## Sprint 1 — 05 al 18 de septiembre (SE ENTREGA EL SÁBADO 26 DE SEPTIEMBRE)

### Autenticación y CRUD de Productos

| RF    | Tarea                                    | Responsable | Estado     |
| ----- | ---------------------------------------- | ----------- | ---------- |
| RF-15 | Autenticación de Administrador (login)  | Manuel      | Completado |
| RF-01 | Registro de Producto Consumible          | Carolina    | Completado |
| RF-03 | Actualización de Datos                  | Alessandro  | Completado |
| RF-04 | Eliminación (Baja) de Datos             | Armando     | Completado |
| —    | QA / Pruebas de integración del módulo | Jose Carlos | Completado |

---

## Sprint 2 — 19 de septiembre al 02 de octubre

### Destinatarios y Pedidos

| RF    | Tarea                                            | Responsable | Estado     |
| ----- | ------------------------------------------------ | ----------- | ---------- |
| RF-12 | Registro de Destinatario                         | Manuel      | Completado |
| RF-02 | Selección de Destinatario y Registro de Pedidos | Jose Carlos | Completado |
| RF-05 | Listado en Tiempo Real                           | Carolina    | Completado |
| —    | QA / Pruebas de integración del módulo         | Alessandro  | Completado |
| —    | Documentación técnica / Apoyo                  | Armando     | Completado |

---

## Sprint 3 — 03 de octubre al 17 de octubre


| RF    | Tarea                                    | Responsable | Estado     |
| ----- | ---------------------------------------- | ----------- | ---------- |
| RF-20 | Cola de producción en tiempo real       | Jose Carlos | Completado |
| RF-21 | Marcar pedido como completado            | Manuel      | Completado  |
| RF-09 | Registrar mermas                         | Carolina    | Completado |
| —    | QA / Pruebas de integración del módulo | Armando     | Pendiente  |
| —    | Documentación técnica / Apoyo          | Alessandro  | Pendiente  |

---

## Sprint 4 — 18 de octubre al 07 de noviembre


| RF    | Tarea                                    | Responsable | Estado    |
| ----- | ---------------------------------------- | ----------- | --------- |
| RF-06 | Alertas de vencimiento                   | Jose Carlos | Pendiente |
| RF-07 | Búsqueda avanzada                       | Carolina    | Pendiente |
| RF-11 | Gestión de devoluciones                 | Armando     | Pendiente |
| RF-08 | Reporte de movimientos                   | Alessandro  | Pendiente |
| —    | QA / Pruebas de integración del módulo | Manuel      | Pendiente |

---

# Tecnologías

- Nuxt
- Vue
- TypeScript
- Supabase
- PostgreSQL

---

# Arquitectura del proyecto

El proyecto utiliza una arquitectura organizada por capas.

```text
Frontend
   ↓
API
   ↓
DTO / Validación
   ↓
Service
   ↓
Repository
   ↓
Supabase / PostgreSQL
```

Cada requerimiento debe seguir esta estructura para mantener el proyecto organizado y facilitar el mantenimiento.

---

# Estructura del proyecto

La estructura general del proyecto debe mantenerse igual para todos los integrantes.

```text
sgy-system/
│
├── app/
│   ├── components/
│   ├── pages/
│   └── app.vue
│
├── server/
│   ├── api/
│   ├── dtos/
│   ├── models/
│   ├── repositories/
│   ├── services/
│   ├── bd/
│   └── utils/
│
├── public/
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Regla de estructura

Todos los integrantes deben seguir la misma estructura utilizada actualmente en el proyecto.

No crear arquitecturas diferentes para cada requerimiento.

TRABAJAR SIEMPRE EN SUS RAMAS.

Por ejemplo, si se desarrolla un nuevo módulo de productos:

```text
server/
│
├── api/
│   └── productos/
│
├── dtos/
│   └── producto.dto.ts
│
├── models/
│   └── producto.model.ts
│
├── repositories/
│   └── producto.repository.ts
│
└── services/
    └── producto.service.ts
```

Los nuevos requerimientos deben adaptarse a la arquitectura existente.

---

# Base de datos

El proyecto utiliza **PostgreSQL mediante Supabase**.

La base de datos contiene las siguientes tablas:

```text
rol
usuario
auditoria
producto
lote
destinatario
pedido
detalle_pedido
produccion
perdida
devolucion
movimiento_inventario
configuracion
```

El script de la estructura de la base de datos se encuentra en:

```text
server/bd/schema.sql
```

## Importante

No modificar nombres de tablas, columnas, relaciones o tipos de datos sin comunicarlo previamente al equipo.

Cualquier cambio en la base de datos debe ser coordinado para evitar conflictos entre los integrantes y del proyecto.

---

# Variables de entorno

El proyecto utiliza variables de entorno para conectarse con Supabase.

Cada integrante debe crear su propio archivo:

```text
.env
```

en la raíz del proyecto.

La estructura debe ser:

```text
sgy-system/
│
├── .env
├── package.json
├── README.md
└── ...
```

El archivo `.env` debe contener:

```env
SUPABASE_URL=TU_SUPABASE_URL
SUPABASE_SERVICE_KEY=TU_SUPABASE_SERVICE_KEY
```

(Me escriben para pasarles el .env porque tiene que ser el mismo para todos, ok?)

### MUY IMPORTANTE

El archivo `.env` contiene información privada.

**Nunca subir el `.env` a GitHub.**

El archivo ya se encuentra incluido en `.gitignore`.

Cada integrante debe configurar su propio `.env` de manera local.

Las credenciales reales deben compartirse únicamente mediante un medio privado y seguro.

---

# Requisitos para trabajar en el proyecto

Antes de clonar y ejecutar el proyecto se debe tener instalado:

- Node.js
- npm
- Git

También se necesita acceso al proyecto de Supabase correspondiente, por lo tanto es necesario que se creen una cuenta en SupaBase y me manden el correo que utilizaron para yo poder añadirlos como colaboradores.

---

# Instalación del proyecto

HACERSE UNA CARPETA EN ARCHIVOS DONDE VA A CONTENER EL PROYECTO DE INGENIERÍA.

## 1. Clonar el repositorio

```bash
git clone https://github.com/CarolZhouZheng/sgy-system.git
```

## 2. Entrar a la carpeta

```bash
cd sgy-system
```

## 3. Instalar dependencias

```bash
npm install
```

## 4. Crear el archivo `.env`

Crear un archivo llamado:

```text
.env
```

en la raíz del proyecto.

Agregar las variables correspondientes(ME ESCRIBEN A MI (o sea a Caro jsjs)):

```env
SUPABASE_URL=TU_SUPABASE_URL
SUPABASE_SERVICE_KEY=TU_SUPABASE_SERVICE_KEY
```

## 5. Verificar la base de datos

Asegurarse de tener acceso al proyecto de Supabase y de que la estructura de la base de datos esté configurada correctamente.

---

# Ejecutar el proyecto

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

El proyecto estará disponible normalmente en:

```text
http://localhost:3000
```

Para detener el servidor:

```text
Ctrl + C
```

---

# Comandos principales

### Instalar dependencias

```bash
npm install
```

### Ejecutar en desarrollo

```bash
npm run dev
```

### Crear build de producción

```bash
npm run build
```

### Previsualizar build

```bash
npm run preview
```

---

# Flujo de trabajo con Git

Todos los integrantes deben trabajar utilizando ramas.

## 1. Actualizar `main`

Antes de comenzar un nuevo trabajo:

```bash
git switch main
git pull origin main
```

## 2. Crear una rama

Crear una rama específica para el requerimiento o tarea:

```bash
git switch -c NombreDeLaRama
```

Ejemplo:

```bash
git switch -c CaritoBranch
```

## 3. Verificar la rama

```bash
git branch
```

La rama actual aparecerá marcada con `*`.

## 4. Revisar cambios

Antes de hacer un commit:

```bash
git status
```

## 5. Agregar cambios

```bash
git add .
```

## 6. Crear commit

Utilizar mensajes claros y descriptivos:

```bash
git commit -m "Implementa RF-01 registro de producto"
```

## 7. Subir la rama

```bash
git push -u origin NombreDeLaRama
```

Ejemplo:

```bash
git push -u origin CaritoBranch
```

---

# Integración de cambios

Los cambios deben desarrollarse primero en la rama correspondiente.

Antes de integrar cambios a `main`:

1. Verificar que el código funcione.
2. Verificar que no existan cambios sin guardar.
3. Actualizar la rama con los cambios recientes de `main`.
4. Revisar posibles conflictos.
5. Integrar los cambios.
6. Verificar nuevamente el proyecto.

---

# Archivos que NO deben subirse

No subir al repositorio:

```text
.env
node_modules/
.nuxt/
```

Estos archivos ya se encuentran incluidos en `.gitignore`.

### Nunca hacer:

```bash
git add .env
```

### No eliminar ni modificar `.gitignore` sin consultar al equipo.

---

# Convención para desarrollar un requerimiento

Cada requerimiento funcional debe respetar la arquitectura del proyecto.

Ejemplo:

```text
RF-01
Registro de Producto Consumible
```

Su estructura:

```text
Frontend
   ↓
server/api
   ↓
server/dtos
   ↓
server/services
   ↓
server/repositories
   ↓
Supabase
```

## DTO

Se utiliza para definir y validar los datos recibidos.

```text
server/dtos/
```

## API

Contiene los endpoints utilizados por el frontend.

```text
server/api/
```

## Service

Contiene la lógica relacionada con el requerimiento.

```text
server/services/
```

## Repository

Se encarga de las operaciones relacionadas con la base de datos.

```text
server/repositories/
```

## Model

Representa la estructura de los datos.

```text
server/models/
```

---
