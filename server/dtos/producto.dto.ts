import { z } from 'zod';

// Misma regla para crear (RF-01) y editar (RF-03): formato AAAA-MM-DD y fecha real.
const FechaVencimientoSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha de vencimiento debe tener el formato YYYY-MM-DD')
  .refine((val) => {
    const [year = 0, month = 0, day = 0] = val.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, 'La fecha de vencimiento no es una fecha válida');

// ===== INICIO DE MI IMPLEMENTACIÓN - RF-01 =====
// Este esquema de Zod define las reglas de validación para registrar un producto nuevo.
// Recibe los datos que vienen desde el endpoint (server/api/productos/index.post.ts).
// Revisa que nombre y unidad_medida sean obligatorios, borra espacios sobrantes (.trim()) y evita cantidades negativas.
export const CrearProductoSchema = z.object({
  // Nombre obligatorio, sin espacios vacíos y máximo 150 letras
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(150, 'El nombre no puede superar los 150 caracteres'),

  // Descripción opcional
  descripcion: z
    .string()
    .trim()
    .optional(),

  // Categoría opcional, máximo 100 letras
  categoria: z
    .string()
    .trim()
    .max(100, 'La categoría no puede superar los 100 caracteres')
    .optional(),

  // Unidad de medida obligatoria (ej. kg, unidad, litro), máximo 30 letras
  unidad_medida: z
    .string()
    .trim()
    .min(1, 'La unidad de medida es obligatoria')
    .max(30, 'La unidad de medida no puede superar los 30 caracteres'),

  // Stock actual: no puede ser menor a 0. Si no se envía, vale 0 por defecto
  stock_actual: z
    .number()
    .min(0, 'El stock actual no puede ser negativo')
    .default(0),

  // Stock mínimo: no puede ser menor a 0. Si no se envía, vale 0 por defecto
  stock_minimo: z
    .number()
    .min(0, 'El stock mínimo no puede ser negativo')
    .default(0),

  // Estado del producto: por defecto se registra como activo (true)
  estado: z
    .boolean()
    .default(true),

  // Fecha de vencimiento opcional (formato YYYY-MM-DD)
  fecha_vencimiento: FechaVencimientoSchema.optional(),
});

// Tipo de datos ya validados que se envía hacia el servicio (server/services/producto.service.ts)
export type CrearProductoDTO = z.infer<typeof CrearProductoSchema>;
// ===== FIN DE MI IMPLEMENTACIÓN - RF-01 =====
// NOTA: De aquí hacia abajo pertenecen a otros tickets (RF-03, RF-04 y RF-07).

export const ProductoIdParamSchema = z.object({
  id: z.coerce
    .number({ message: 'El ID debe ser numérico' })
    .int('El ID debe ser un número entero')
    .positive('El ID debe ser un número positivo'),
});

export type ProductoIdParamDTO = z.infer<typeof ProductoIdParamSchema>;

// RF-03: Actualización de datos. Todos los campos son opcionales, pero se exige al menos uno.
// El estado no se modifica aquí: se gestiona con la baja/reactivación (RF-04). -Ale
export const ActualizarProductoSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, 'El nombre no puede estar vacío')
      .max(150, 'El nombre no puede superar los 150 caracteres')
      .optional(),

    descripcion: z
      .string()
      .trim()
      .nullable()
      .optional(),

    categoria: z
      .string()
      .trim()
      .max(100, 'La categoría no puede superar los 100 caracteres')
      .nullable()
      .optional(),

    unidad_medida: z
      .string()
      .trim()
      .min(1, 'La unidad de medida no puede estar vacía')
      .max(30, 'La unidad de medida no puede superar los 30 caracteres')
      .optional(),

    stock_actual: z
      .number({ message: 'El stock actual debe ser numérico' })
      .min(0, 'El stock actual no puede ser negativo')
      .optional(),

    stock_minimo: z
      .number({ message: 'El stock mínimo debe ser numérico' })
      .min(0, 'El stock mínimo no puede ser negativo')
      .optional(),

    // Se puede poner o cambiar, pero no quitar (no acepta null). Se guarda en el lote del producto.
    fecha_vencimiento: FechaVencimientoSchema.optional(),
  })
  .refine((datos) => Object.values(datos).some((valor) => valor !== undefined), {
    message: 'Debe enviar al menos un campo para actualizar',
  });

export type ActualizarProductoDTO = z.infer<typeof ActualizarProductoSchema>;

// RF-07: Validación de filtros para la búsqueda avanzada de productos.
export const FiltroProductosSchema = z.object({
  busqueda: z.string().trim().optional(),

  categoria: z.string().trim().optional(),

  estado: z.preprocess(
    (valor) => {
      if (valor === 'true' || valor === true) return true;
      if (valor === 'false' || valor === false) return false;
      if (valor === '' || valor === undefined || valor === null) return undefined;
      return valor;
    },
    z.boolean().optional()
  ),

  stock: z.enum(['todos', 'bajo', 'disponible', 'agotado']).default('todos'),
});

export type FiltroProductosDTO = z.infer<typeof FiltroProductosSchema>;