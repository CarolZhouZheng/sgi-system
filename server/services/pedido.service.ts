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
    const productos = await PedidoRepository.obtenerProductosPorIds(idsProductos)

    const productosValidos =
      productos.length === new Set(idsProductos).size &&
      productos.every((p) => p.estado)

    if (!productosValidos) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Uno o más productos no existen o están inactivos.',
      })
    }

    // Regla de Negocio CU02 (Flujo Alterno 5.1): Verificar stock disponible
    for (const detalle of datos.detalles) {
      const producto = productos.find((p) => p.id_producto === detalle.id_producto)
      if (producto && Number(producto.stock_actual) < detalle.cantidad) {
        throw createError({
          statusCode: 400,
          statusMessage: `Stock insuficiente para "${producto.nombre}". Stock disponible: ${producto.stock_actual}, solicitado: ${detalle.cantidad}.`,
        })
      }
    }

    const pedido = await PedidoRepository.crearPedido(datos)

    // Regla de Negocio CU02 (Paso 8): Registro en bitácora de auditoría
    await PedidoRepository.registrarAuditoria({
      id_usuario: datos.id_usuario,
      accion: 'REGISTRAR_PEDIDO',
      tabla_afectada: 'pedido',
      registro_id: pedido.id_pedido,
      detalle: `Registro de pedido #${pedido.id_pedido} para destinatario ID ${datos.id_destinatario} con ${datos.detalles.length} producto(s).`,
    })

    return pedido
  },

  async listarPedidos() {
    return PedidoRepository.listarPedidos()
  },
}