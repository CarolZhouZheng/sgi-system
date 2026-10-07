import { CambiarEstadoProduccionSchema, ProduccionIdParamSchema } from '../../../dtos/produccion.dto'
import { ProduccionService } from '../../../services/produccion.service'

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event)
  const validacionId = ProduccionIdParamSchema.safeParse({ id: params.id })

  if (!validacionId.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El ID de la orden de producción no es válido.',
    })
  }

  const body = await readBody(event)
  const validacion = CambiarEstadoProduccionSchema.safeParse(body)

  if (!validacion.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validacion.error.issues.map((i) => i.message).join('; '),
    })
  }

  // ID de usuario opcional de la sesión
  let idUsuarioSesion: number | undefined
  const sessionCookie = getCookie(event, 'usuario_session')
  if (sessionCookie) {
    try {
      const sesion = JSON.parse(sessionCookie)
      idUsuarioSesion = sesion?.id_usuario
    } catch {
      // Ignorar si no parsea
    }
  }

  try {
    const actualizada = await ProduccionService.cambiarEstadoProduccion(
      validacionId.data.id,
      validacion.data,
      idUsuarioSesion
    )

    return {
      success: true,
      mensaje: `Estado de la orden de producción actualizado a ${validacion.data.estado}.`,
      data: actualizada,
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage:
        error.statusMessage || error.message || 'Error al actualizar el estado de producción.',
    })
  }
})
