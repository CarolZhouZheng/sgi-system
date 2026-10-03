import { z } from 'zod'

const DetallePedidoSchema = z.object({
  id_producto: z.coerce.number().int().positive('Selecciona un producto válido.'),
  cantidad: z.coerce.number().finite().positive('La cantidad debe ser mayor que cero.'),
})

export const PrioridadPedidoEnum = z.enum(['BAJA', 'NORMAL', 'ALTA', 'URGENTE'], {
  errorMap: () => ({ message: 'La prioridad debe ser NORMAL, ALTA, URGENTE o BAJA.' }),
})

export const CrearPedidoSchema = z.object({
  id_destinatario: z.coerce.number().int().positive('Selecciona un destinatario válido.'),
  id_usuario: z.coerce.number().int().positive('Indica un usuario válido.'),
  fecha_entrega: z.iso.date().nullable().optional(),
  prioridad: PrioridadPedidoEnum.default('NORMAL'),
  encargado_entrega: z.string().trim().max(150).nullable().optional(),
  detalles: z.array(DetallePedidoSchema).min(1, 'Agrega al menos un producto.'),
}).superRefine((pedido, contexto) => {
  if (pedido.fecha_entrega) {
    const ahora = new Date()
    const zonaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000)
    const hoy = zonaLocal.toISOString().slice(0, 10)

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