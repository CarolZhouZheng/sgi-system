import { PedidoService } from '../../../services/pedido.service'

export default defineEventHandler(async (event) => {
  // Verificación de sesión
  const sessionCookie = getCookie(event, 'usuario_session')
  if (!sessionCookie) {
    throw createError({ statusCode: 401, statusMessage: 'No hay sesión activa.' })
  }
  
  let sesion
  try {
    sesion = JSON.parse(sessionCookie)
  } catch (error) {
    throw createError({ statusCode: 401, statusMessage: 'La sesión está dañada o es inválida.' })
  }

  const id_pedido = parseInt(event.context.params?.id || '0', 10)
  if (isNaN(id_pedido) || id_pedido <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'ID de pedido inválido.' })
  }

  const body = await readBody(event)
  
  if (body.estado !== 'COMPLETADO') {
    throw createError({ statusCode: 400, statusMessage: 'Solo se permite marcar como COMPLETADO a través de este endpoint.' })
  }

  const pedidoActualizado = await PedidoService.completarPedido(id_pedido, sesion.id_usuario)

  return {
    success: true,
    data: pedidoActualizado,
    message: 'Pedido completado con éxito.'
  }
})
