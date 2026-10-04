import { z } from 'zod'

export const PRIORIDADES_VALIDAS = ['BAJA', 'NORMAL', 'ALTA', 'URGENTE'] as const
export type PrioridadPedido = (typeof PRIORIDADES_VALIDAS)[number]

const DetallePedidoSchema = z.object({
  id_producto: z.coerce.number().int().positive('Selecciona un producto válido.'),
  cantidad: z.coerce.number().finite().positive('La cantidad debe ser mayor que cero.'),
})

export const PrioridadPedidoEnum = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
  z.enum(PRIORIDADES_VALIDAS, {
    message: 'La prioridad debe ser BAJA, NORMAL, ALTA o URGENTE.',
  })
)

export const CrearPedidoSchema = z
  .object({
    id_destinatario: z.coerce.number().int().positive('Selecciona un destinatario válido.'),
    id_usuario: z.coerce.number().int().positive('Indica un usuario válido.'),
    fecha_entrega: z.preprocess(
      (val) => (val === '' || val === undefined ? null : val),
      z.iso.date('Formato de fecha de entrega inválido (debe ser AAAA-MM-DD).').nullable().optional()
    ),
    prioridad: PrioridadPedidoEnum.default('NORMAL'),
    encargado_entrega: z.string().trim().max(150).nullable().optional(),
    detalles: z.array(DetallePedidoSchema).min(1, 'El pedido debe contener al menos un producto.'),
  })
  .superRefine((pedido, contexto) => {
    if (pedido.fecha_entrega) {
      // Zona horaria de Costa Rica (D-10): evita desfasajes cuando el servidor opera en UTC
      const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica' }).format(new Date())

      if (pedido.fecha_entrega < hoy) {
        contexto.addIssue({
          code: 'custom',
          path: ['fecha_entrega'],
          message: 'La fecha de entrega no puede ser anterior a la fecha actual.',
        })
      }
    }

    const ids = pedido.detalles.map((detalle) => detalle.id_producto)

    if (new Set(ids).size !== ids.length) {
      contexto.addIssue({
        code: 'custom',
        path: ['detalles'],
        message: 'No repitas productos; combina sus cantidades en una sola línea.',
      })
    }
  })

export type CrearPedidoDTO = z.infer<typeof CrearPedidoSchema>