import { ProduccionService } from '../../services/produccion.service'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const filtros = {
    estado: query.estado ? String(query.estado) : undefined,
    id_producto: query.id_producto ? Number(query.id_producto) : undefined,
    id_pedido: query.id_pedido ? Number(query.id_pedido) : undefined,
    fecha: query.fecha ? String(query.fecha) : undefined,
  }

  try {
    const cola = await ProduccionService.listarColaProduccion(filtros)

    return {
      success: true,
      data: cola,
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Error al obtener la cola de producción.',
    })
  }
})
