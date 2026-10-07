import { createError } from 'h3'
import type { CrearPedidoDTO } from '../dtos/pedido.dto'
import { PRIORIDADES_VALIDAS } from '../dtos/pedido.dto'
import { PedidoRepository } from '../repositories/pedido.repository'

export const PedidoService = {
  async registrarPedido(datos: CrearPedidoDTO) {
    // Validación de detalles mínimos (D-02)
    if (!datos.detalles || datos.detalles.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El pedido debe contener al menos un producto.',
      })
    }

    if (datos.detalles.some((d) => !d.cantidad || d.cantidad <= 0)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'La cantidad de cada producto debe ser mayor que cero.',
      })
    }

    const idsProductos = datos.detalles.map((detalle) => detalle.id_producto)
    if (new Set(idsProductos).size !== idsProductos.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No repitas productos; combina sus cantidades en una sola línea.',
      })
    }

    // Validación de prioridad (D-05)
    const prioridadUpper = (datos.prioridad || 'NORMAL').trim().toUpperCase()
    if (!PRIORIDADES_VALIDAS.includes(prioridadUpper as any)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'La prioridad debe ser BAJA, NORMAL, ALTA o URGENTE.',
      })
    }

    // Validación de fecha de entrega (D-06)
    if (datos.fecha_entrega) {
      const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica' }).format(new Date())
      if (datos.fecha_entrega < hoy) {
        throw createError({
          statusCode: 400,
          statusMessage: 'La fecha de entrega no puede ser anterior a la fecha actual.',
        })
      }
    }

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

    const pedido = await PedidoRepository.crearPedido({
      ...datos,
      prioridad: prioridadUpper,
    })

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

  async completarPedido(id_pedido: number, id_usuario: number) {
    const pedido = await PedidoRepository.obtenerPedidoPorId(id_pedido)

    if (!pedido) {
      throw createError({
        statusCode: 404,
        statusMessage: 'El pedido especificado no existe.',
      })
    }

    if (pedido.estado === 'COMPLETADO') {
      throw createError({
        statusCode: 400,
        statusMessage: 'El pedido ya se encuentra completado.',
      })
    }
    
    if (pedido.estado === 'CANCELADO') {
      throw createError({
        statusCode: 400,
        statusMessage: 'No se puede completar un pedido que está cancelado.',
      })
    }

    const pedidoActualizado = await PedidoRepository.actualizarEstadoPedido(id_pedido, 'COMPLETADO')

    await PedidoRepository.registrarAuditoria({
      id_usuario,
      accion: 'COMPLETAR_PEDIDO',
      tabla_afectada: 'pedido',
      registro_id: id_pedido,
      detalle: `El pedido #${id_pedido} fue marcado como completado manualmente.`,
    })

    return pedidoActualizado
  },
}