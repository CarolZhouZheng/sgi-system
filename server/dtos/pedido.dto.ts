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
  prioridad: z.string().trim().min(1).max(20).default('NORMAL'),
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
})

export type CrearPedidoDTO = z.infer<typeof CrearPedidoSchema>