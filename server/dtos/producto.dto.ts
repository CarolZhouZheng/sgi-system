import { z } from 'zod';

export const CrearProductoSchema = z.object({
  nombre: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(150, 'El nombre no puede superar los 150 caracteres'),

  descripcion: z
    .string()
    .optional(),

  categoria: z
    .string()
    .max(100, 'La categoría no puede superar los 100 caracteres')
    .optional(),

  unidad_medida: z
    .string()
    .min(1, 'La unidad de medida es obligatoria')
    .max(30, 'La unidad de medida no puede superar los 30 caracteres'),

  stock_actual: z
    .number()
    .min(0, 'El stock actual no puede ser negativo')
    .default(0),

  stock_minimo: z
    .number()
    .min(0, 'El stock mínimo no puede ser negativo')
    .default(0),

  estado: z
    .boolean()
    .default(true),
});

export type CrearProductoDTO = z.infer<typeof CrearProductoSchema>;

export const ProductoIdParamSchema = z.object({
  id: z.coerce
    .number({ message: 'El ID debe ser numérico' })
    .int('El ID debe ser un número entero')
    .positive('El ID debe ser un número positivo'),
});

export type ProductoIdParamDTO = z.infer<typeof ProductoIdParamSchema>;

// RF-03: Actualización de datos. Todos los campos son opcionales, pero se exige al menos uno.
// El estado no se modifica aquí: se gestiona con la baja/reactivación (RF-04).  -Ale
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
  })
  .refine((datos) => Object.values(datos).some((valor) => valor !== undefined), {
    message: 'Debe enviar al menos un campo para actualizar',
  });

export type ActualizarProductoDTO = z.infer<typeof ActualizarProductoSchema>;
