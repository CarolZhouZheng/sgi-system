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