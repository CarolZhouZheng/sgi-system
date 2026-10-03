import { PedidoService } from '../../services/pedido.service'

export default defineEventHandler(async () => {
  try {
    const pedidos = await PedidoService.listarPedidos()

    return {
      success: true,
      total: pedidos.length,
      data: pedidos,
    }
  } catch (error: unknown) {
    const mensaje =
      error instanceof Error ? error.message : 'Error al listar los pedidos.'

    throw createError({
      statusCode: 500,
      statusMessage: mensaje,
    })
  }
})