// server/dtos/devolucion.dto.ts
import { z } from 'zod';

export const ESTADOS_DEVOLUCION_VALIDOS = ['PENDIENTE', 'APROBADA', 'RECHAZADA'] as const;

export const CrearDevolucionSchema = z.object({
  id_pedido: z.coerce
    .number({ message: 'El ID de pedido debe ser numérico.' })
    .int('El ID de pedido debe ser entero.')
    .positive('El ID de pedido debe ser mayor a 0.'),
  id_producto: z.coerce
    .number({ message: 'El ID de producto debe ser numérico.' })
    .int('El ID de producto debe ser entero.')
    .positive('El ID de producto debe ser mayor a 0.'),
  id_lote: z.coerce
    .number()
    .int('El ID de lote debe ser entero.')
    .positive('El ID de lote debe ser mayor a 0.')
    .optional()
    .nullable(),
  id_usuario: z.coerce
    .number()
    .int('El ID de usuario debe ser entero.')
    .positive('El ID de usuario debe ser mayor a 0.')
    .optional(),
  cantidad_devuelta: z.coerce
    .number({ message: 'La cantidad devuelta debe ser numérica.' })
    .positive('La cantidad devuelta debe ser mayor a cero.'),
  motivo: z
    .string({ message: 'El motivo es obligatorio.' })
    .trim()
    .min(3, 'El motivo debe tener al menos 3 caracteres.')
    .max(150, 'El motivo no puede superar los 150 caracteres.'),
  fecha: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD.")
    .optional(),
  estado: z
    .enum(ESTADOS_DEVOLUCION_VALIDOS, {
      message: 'El estado debe ser PENDIENTE, APROBADA o RECHAZADA.',
    })
    .default('PENDIENTE'),
  observaciones: z
    .string()
    .trim()
    .max(500, 'Las observaciones no pueden superar los 500 caracteres.')
    .optional()
    .nullable(),
});

export const CambiarEstadoDevolucionSchema = z.object({
  estado: z.enum(ESTADOS_DEVOLUCION_VALIDOS, {
    message: 'El estado debe ser PENDIENTE, APROBADA o RECHAZADA.',
  }),
  observaciones: z
    .string()
    .trim()
    .max(500, 'Las observaciones no pueden superar los 500 caracteres.')
    .optional()
    .nullable(),
});

export const DevolucionIdParamSchema = z.object({
  id: z.coerce
    .number({ message: 'El ID de devolución debe ser un número entero positivo.' })
    .int('El ID de devolución debe ser entero.')
    .positive('El ID de devolución debe ser mayor a cero.'),
});

export const FiltrosDevolucionSchema = z
  .object({
    estado: z
      .string()
      .trim()
      .transform((val) => (val === '' ? undefined : val.toUpperCase()))
      .optional(),
    id_producto: z.coerce.number().int().positive().optional(),
    id_pedido: z.coerce.number().int().positive().optional(),
    id_destinatario: z.coerce.number().int().positive().optional(),
    desde: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "El parámetro 'desde' debe tener formato AAAA-MM-DD.")
      .optional(),
    hasta: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "El parámetro 'hasta' debe tener formato AAAA-MM-DD.")
      .optional(),
    limite: z.coerce
      .number()
      .int()
      .min(1, 'El límite mínimo es 1.')
      .max(1000, 'El límite no puede superar 1000.')
      .default(200),
  })
  .refine(
    (data) => {
      if (data.desde && data.hasta) {
        return data.desde <= data.hasta;
      }
      return true;
    },
    {
      message: "La fecha 'desde' no puede ser posterior a la fecha 'hasta'.",
      path: ['desde'],
    }
  );

export type CrearDevolucionDTO = z.infer<typeof CrearDevolucionSchema>;
export type CambiarEstadoDevolucionDTO = z.infer<typeof CambiarEstadoDevolucionSchema>;
export type FiltrosDevolucionDTO = z.infer<typeof FiltrosDevolucionSchema>;
