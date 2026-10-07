import { ProduccionIdParamSchema } from '../../../dtos/produccion.dto'
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

  try {
    const produccion = await ProduccionService.obtenerProduccionPorId(validacionId.data.id)

    return {
      success: true,
      data: produccion,
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage:
        error.statusMessage || error.message || 'Error al consultar la orden de producción.',
    })
  }
})
