import { createError } from 'h3'
import type { CrearPedidoDTO } from '../dtos/pedido.dto'
import { PedidoRepository } from '../repositories/pedido.repository'

export const PedidoService = {
  async registrarPedido(datos: CrearPedidoDTO) {
    const destinatarioValido =
      await PedidoRepository.destinatarioActivoExiste(datos.id_destinatario)

    if (!destinatarioValido) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El destinatario no existe o está inactivo.',
      })
    }

    const usuarioValido =
      await PedidoRepository.usuarioActivoExiste(datos.id_usuario)

    if (!usuarioValido) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El usuario no existe o está inactivo.',
      })
    }

    const idsProductos = datos.detalles.map((detalle) => detalle.id_producto)
    const productosValidos =
      await PedidoRepository.productosActivosExisten(idsProductos)

    if (!productosValidos) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Uno o más productos no existen o están inactivos.',
      })
    }

    return PedidoRepository.crearPedido(datos)
  },

  async listarPedidos() {
    return PedidoRepository.listarPedidos()
  },
}