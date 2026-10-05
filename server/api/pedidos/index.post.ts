import { CrearPedidoSchema } from '../../dtos/pedido.dto'
import { PedidoService } from '../../services/pedido.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // D-03: Obtener usuario de la sesión en lugar del body (seguridad)
  const sessionCookie = getCookie(event, 'usuario_session')
  if (!sessionCookie) {
    throw createError({ statusCode: 401, statusMessage: 'No hay sesión activa.' })
  }
  
  let sesion;
  try {
    sesion = JSON.parse(sessionCookie)
  } catch (error) {
    // D-15: Responder 401 y no 500 cuando la cookie está dañada
    throw createError({ statusCode: 401, statusMessage: 'La sesión está dañada o es inválida.' })
  }
  
  body.id_usuario = sesion.id_usuario

  const validacion = CrearPedidoSchema.safeParse(body)

  if (!validacion.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validacion.error.issues
        .map((issue) => issue.message)
        .join('; '),
    })
  }

  try {
    const pedido = await PedidoService.registrarPedido(validacion.data)

    setResponseStatus(event, 201)
    return {
      success: true,
      mensaje: 'Pedido registrado correctamente.',
      data: pedido,
    }
  } catch (error: unknown) {
    const detalle = error as {
      statusCode?: number
      statusMessage?: string
      message?: string
    }

    throw createError({
      statusCode: detalle.statusCode || 500,
      statusMessage:
        detalle.statusMessage ||
        detalle.message ||
        'No se pudo registrar el pedido.',
    })
  }
})