import { CrearProduccionSchema } from '../../dtos/produccion.dto'
import { ProduccionService } from '../../services/produccion.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // D-16 y D-17: Validar sesión obligatoriamente y sobrescribir id_usuario con el de la sesión activa
  const sessionCookie = getCookie(event, 'usuario_session')
  if (!sessionCookie) {
    throw createError({ statusCode: 401, statusMessage: 'No hay sesión activa.' })
  }

  let sesion: any
  try {
    sesion = JSON.parse(sessionCookie)
  } catch (error) {
    throw createError({ statusCode: 401, statusMessage: 'La sesión está dañada o es inválida.' })
  }

  if (!sesion?.id_usuario) {
    throw createError({ statusCode: 401, statusMessage: 'Sesión inválida.' })
  }

  body.id_usuario = sesion.id_usuario

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
