import { z } from 'zod'

export const ESTADOS_PRODUCCION = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'] as const
export type EstadoProduccionTipo = (typeof ESTADOS_PRODUCCION)[number]

export const EstadoProduccionEnum = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
  z.enum(ESTADOS_PRODUCCION, {
    message: 'El estado debe ser PENDIENTE, EN_PROCESO, COMPLETADA o CANCELADA.',
  })
)

export const CrearProduccionSchema = z.object({
  id_producto: z.coerce
    .number({ message: 'Selecciona un producto válido.' })
    .int('El ID del producto debe ser un entero.')
    .positive('Selecciona un producto válido.'),
  id_usuario: z.coerce
    .number({ message: 'Indica un usuario válido.' })
    .int('El ID del usuario debe ser un entero.')
    .positive('Indica un usuario válido.'),
  id_pedido: z.coerce
    .number()
    .int('El ID del pedido debe ser entero.')
    .positive('El ID del pedido debe ser válido.')
    .nullable()
    .optional(),
  id_lote: z.coerce
    .number()
    .int('El ID del lote debe ser entero.')
    .positive('El ID del lote debe ser válido.')
    .nullable()
    .optional(),
  cantidad_planificada: z.coerce
    .number({ message: 'La cantidad planificada debe ser numérica.' })
    .finite('La cantidad planificada debe ser un número válido.')
    .positive('La cantidad planificada debe ser mayor que cero.'),
  cantidad_producida: z.coerce
    .number({ message: 'La cantidad producida debe ser numérica.' })
    .finite()
    .min(0, 'La cantidad producida no puede ser negativa.')
    .default(0),
  estado: EstadoProduccionEnum.default('PENDIENTE'),
  fecha_produccion: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.iso.date('Formato de fecha inválido (debe ser AAAA-MM-DD).').nullable().optional()
  ),
  tiempo_real: z.string().trim().max(50, 'El tiempo real no puede superar 50 caracteres.').nullable().optional(),
  observaciones: z.string().trim().max(500, 'Las observaciones no pueden superar 500 caracteres.').nullable().optional(),
})

export type CrearProduccionDTO = z.infer<typeof CrearProduccionSchema>

export const CambiarEstadoProduccionSchema = z.object({
  estado: EstadoProduccionEnum,
  cantidad_producida: z.coerce
    .number({ message: 'La cantidad producida debe ser numérica.' })
    .finite()
    .min(0, 'La cantidad producida no puede ser negativa.')
    .optional(),
  tiempo_real: z.string().trim().max(50, 'El tiempo real no puede superar 50 caracteres.').nullable().optional(),
  observaciones: z.string().trim().max(500, 'Las observaciones no pueden superar 500 caracteres.').nullable().optional(),
})

export type CambiarEstadoProduccionDTO = z.infer<typeof CambiarEstadoProduccionSchema>

export const ActualizarProduccionSchema = z.object({
  cantidad_planificada: z.coerce
    .number({ message: 'La cantidad planificada debe ser numérica.' })
    .finite()
    .positive('La cantidad planificada debe ser mayor que cero.')
    .optional(),
  cantidad_producida: z.coerce
    .number({ message: 'La cantidad producida debe ser numérica.' })
    .finite()
    .min(0, 'La cantidad producida no puede ser negativa.')
    .optional(),
  estado: EstadoProduccionEnum.optional(),
  id_lote: z.coerce
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  tiempo_real: z.string().trim().max(50).nullable().optional(),
  observaciones: z.string().trim().max(500).nullable().optional(),
})

export type ActualizarProduccionDTO = z.infer<typeof ActualizarProduccionSchema>

export const ProduccionIdParamSchema = z.object({
  id: z.coerce
    .number({ message: 'El ID debe ser numérico.' })
    .int('El ID debe ser entero.')
    .positive('El ID debe ser positivo.'),
})

export type ProduccionIdParamDTO = z.infer<typeof ProduccionIdParamSchema>
