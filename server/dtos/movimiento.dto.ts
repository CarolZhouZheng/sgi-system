import { z } from 'zod';

// Los parámetros llegan como texto en la URL; los valores vacíos se tratan como "sin filtro".
const vacioComoIndefinido = (val: unknown) =>
  val === undefined || val === null || (typeof val === 'string' && val.trim() === '') ? undefined : val;

// RF-08: Filtros del reporte de movimientos de inventario.
export const ConsultaMovimientosSchema = z
  .object({
    desde: z.preprocess(
      vacioComoIndefinido,
      z.iso.date({ message: 'La fecha "desde" debe tener el formato AAAA-MM-DD' }).optional()
    ),

    hasta: z.preprocess(
      vacioComoIndefinido,
      z.iso.date({ message: 'La fecha "hasta" debe tener el formato AAAA-MM-DD' }).optional()
    ),

    id_producto: z.preprocess(
      vacioComoIndefinido,
      z.coerce
        .number({ message: 'El producto debe ser numérico' })
        .int('El producto debe ser un número entero')
        .positive('Selecciona un producto válido')
        .optional()
    ),

    tipo: z.preprocess(
      (val) => {
        const limpio = vacioComoIndefinido(val);
        return typeof limpio === 'string' ? limpio.trim().toUpperCase() : limpio;
      },
      z.string().max(40, 'El tipo de movimiento no puede superar los 40 caracteres').optional()
    ),

    limite: z.preprocess(
      vacioComoIndefinido,
      z.coerce
        .number({ message: 'El límite debe ser numérico' })
        .int('El límite debe ser un número entero')
        .min(1, 'El límite debe ser al menos 1')
        .max(1000, 'El límite máximo es 1000')
        .default(500)
    ),
  })
  .refine((filtros) => !filtros.desde || !filtros.hasta || filtros.desde <= filtros.hasta, {
    message: 'La fecha "desde" no puede ser posterior a la fecha "hasta"',
    path: ['desde'],
  });

export type ConsultaMovimientosDto = z.infer<typeof ConsultaMovimientosSchema>;
