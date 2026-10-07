import { CrearProduccionSchema } from '../../dtos/produccion.dto'
import { ProduccionService } from '../../services/produccion.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Asignar ID de usuario de la sesión si existe la cookie y no se envió en el body
  const sessionCookie = getCookie(event, 'usuario_session')
  if (sessionCookie) {
    try {
      const sesion = JSON.parse(sessionCookie)
      if (sesion?.id_usuario && !body.id_usuario) {
        body.id_usuario = sesion.id_usuario
      }
    } catch {
      // Manejo seguro si la cookie no es JSON
    }
  }

  const validacion = CrearProduccionSchema.safeParse(body)

  if (!validacion.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validacion.error.issues.map((i) => i.message).join('; '),
    })
  }

  try {
    const orden = await ProduccionService.registrarOrdenProduccion(validacion.data)

    setResponseStatus(event, 201)
    return {
      success: true,
      mensaje: 'Orden registrada en la cola de producción exitosamente.',
      data: orden,
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage:
        error.statusMessage || error.message || 'No se pudo registrar la orden de producción.',
    })
  }
})
