import { z } from 'zod'

const DetallePedidoSchema = z.object({
  id_producto: z.coerce.number().int().positive('Selecciona un producto válido.'),
  cantidad: z.coerce.number().finite().positive('La cantidad debe ser mayor que cero.'),
})

export const CrearPedidoSchema = z.object({
  id_destinatario: z.coerce.number().int().positive('Selecciona un destinatario válido.'),
  // Temporal: sustituir por el usuario obtenido de una sesión validada en el servidor.
  id_usuario: z.coerce.number().int().positive('Indica un usuario válido.'),
  fecha_entrega: z.iso.date().nullable().optional(),
  prioridad: z.string().trim().toUpperCase()
    .pipe(z.enum(['NORMAL', 'ALTA', 'URGENTE']))
    .default('NORMAL'),
  encargado_entrega: z.string().trim().max(150).nullable().optional(),
  detalles: z.array(DetallePedidoSchema).min(1, 'Agrega al menos un producto.'),
}).superRefine((pedido, contexto) => {
  const ids = pedido.detalles.map((detalle) => detalle.id_producto)

  if (new Set(ids).size !== ids.length) {
    contexto.addIssue({
      code: 'custom',
      path: ['detalles'],
      message: 'No repitas productos; combina sus cantidades en una sola línea.',
    })
  }

  const fechaHoy = new Date().toISOString().slice(0, 10)

  if (pedido.fecha_entrega && pedido.fecha_entrega < fechaHoy) {
    contexto.addIssue({
      code: 'custom',
      path: ['fecha_entrega'],
      message: 'La fecha de entrega no puede estar en una fecha anterior al dia de hoy.',
    })
  }
})

export type CrearPedidoDTO = z.infer<typeof CrearPedidoSchema>