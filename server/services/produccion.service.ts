import { createError } from 'h3'
import type {
  CrearProduccionDTO,
  CambiarEstadoProduccionDTO,
  ActualizarProduccionDTO,
} from '../dtos/produccion.dto'
import type {
  FiltrosColaProduccion,
  ProduccionDetalle,
  EstadoProduccion,
} from '../models/produccion.model'
import { ProduccionRepository } from '../repositories/produccion.repository'

// Mapa de peso para ordenar la cola en tiempo real
const PRIORIDAD_ORDEN: Record<string, number> = {
  URGENTE: 4,
  ALTA: 3,
  NORMAL: 2,
  BAJA: 1,
}

const ESTADO_ORDEN: Record<string, number> = {
  EN_PROCESO: 1,
  PENDIENTE: 2,
  COMPLETADA: 3,
  CANCELADA: 4,
}

export const ProduccionService = {
  async listarColaProduccion(filtros?: FiltrosColaProduccion): Promise<ProduccionDetalle[]> {
    const lista = await ProduccionRepository.listarCola(filtros)

    // Ordenamiento inteligente de cola de producción:
    // 1. Estados activos (EN_PROCESO primero, luego PENDIENTE)
    // 2. Prioridad del pedido asociado (URGENTE > ALTA > NORMAL > BAJA)
    // 3. ID secuencial
    return lista.sort((a, b) => {
      const ordenEstadoA = ESTADO_ORDEN[a.estado] || 99
      const ordenEstadoB = ESTADO_ORDEN[b.estado] || 99

      if (ordenEstadoA !== ordenEstadoB) {
        return ordenEstadoA - ordenEstadoB
      }

      // Si ambos están en el mismo estado, ordenar por prioridad del pedido
      const prioridadA = PRIORIDAD_ORDEN[a.pedido?.prioridad?.toUpperCase() || 'NORMAL'] || 0
      const prioridadB = PRIORIDAD_ORDEN[b.pedido?.prioridad?.toUpperCase() || 'NORMAL'] || 0

      if (prioridadA !== prioridadB) {
        return prioridadB - prioridadA // Mayor prioridad primero
      }

      return b.id_produccion - a.id_produccion
    })
  },

  async obtenerProduccionPorId(id: number): Promise<ProduccionDetalle> {
    const produccion = await ProduccionRepository.obtenerPorId(id)

    if (!produccion) {
      throw createError({
        statusCode: 404,
        statusMessage: `No se encontró la orden de producción con ID #${id}.`,
      })
    }

    return produccion
  },

  async registrarOrdenProduccion(datos: CrearProduccionDTO) {
    // 1. Validar producto
    const productoExiste = await ProduccionRepository.productoActivoExiste(datos.id_producto)
    if (!productoExiste) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El producto seleccionado no existe o se encuentra inactivo.',
      })
    }

    // 2. Validar usuario
    const usuarioExiste = await ProduccionRepository.usuarioActivoExiste(datos.id_usuario)
    if (!usuarioExiste) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El usuario especificado no existe o se encuentra inactivo.',
      })
    }

    // 3. Validar pedido si fue proporcionado
    if (datos.id_pedido) {
      const pedidoExiste = await ProduccionRepository.pedidoExiste(datos.id_pedido)
      if (!pedidoExiste) {
        throw createError({
          statusCode: 400,
          statusMessage: `El pedido con ID #${datos.id_pedido} no existe.`,
        })
      }
    }

    // 4. Crear registro en cola
    const nuevaProduccion = await ProduccionRepository.crear({
      id_producto: datos.id_producto,
      id_usuario: datos.id_usuario,
      id_pedido: datos.id_pedido ?? null,
      id_lote: datos.id_lote ?? null,
      cantidad_planificada: datos.cantidad_planificada,
      cantidad_producida: datos.cantidad_producida ?? 0,
      estado: (datos.estado || 'PENDIENTE') as EstadoProduccion,
      fecha_produccion: datos.fecha_produccion ?? undefined,
      tiempo_real: datos.tiempo_real ?? null,
      observaciones: datos.observaciones ?? null,
    })

    // 5. Registrar auditoría
    await ProduccionRepository.registrarAuditoria({
      id_usuario: datos.id_usuario,
      accion: 'REGISTRAR_ORDEN_PRODUCCION',
      tabla_afectada: 'produccion',
      registro_id: nuevaProduccion.id_produccion,
      detalle: `Orden de producción #${nuevaProduccion.id_produccion} creada para producto ID ${datos.id_producto} (${datos.cantidad_planificada} unidades planificadas).`,
    })

    return nuevaProduccion
  },

  async cambiarEstadoProduccion(
    id: number,
    datos: CambiarEstadoProduccionDTO,
    idUsuarioOperacion?: number
  ) {
    const produccionActual = await this.obtenerProduccionPorId(id)

    // Validar transiciones de estado
    if (produccionActual.estado === 'COMPLETADA' && datos.estado !== 'COMPLETADA') {
      throw createError({
        statusCode: 400,
        statusMessage: 'No se puede modificar una orden de producción que ya ha sido completada.',
      })
    }

    if (produccionActual.estado === 'CANCELADA') {
      throw createError({
        statusCode: 400,
        statusMessage: 'No se puede modificar una orden de producción cancelada.',
      })
    }

    // Si pasa a COMPLETADA y no se especificó cantidad producida, asumir la planificada
    let cantidadProducida = datos.cantidad_producida
    if (datos.estado === 'COMPLETADA' && cantidadProducida === undefined) {
      cantidadProducida = produccionActual.cantidad_planificada
    }

    const produccionActualizada = await ProduccionRepository.cambiarEstado(id, {
      ...datos,
      cantidad_producida: cantidadProducida,
    })

    // Registrar auditoría
    const idUsuario = idUsuarioOperacion || produccionActual.id_usuario
    await ProduccionRepository.registrarAuditoria({
      id_usuario: idUsuario,
      accion: 'CAMBIAR_ESTADO_PRODUCCION',
      tabla_afectada: 'produccion',
      registro_id: id,
      detalle: `Orden #${id} cambió de estado ${produccionActual.estado} a ${datos.estado}. Cantidad producida: ${cantidadProducida ?? produccionActualizada.cantidad_producida}.`,
    })

    return produccionActualizada
  },

  async actualizarOrdenProduccion(
    id: number,
    cambios: ActualizarProduccionDTO,
    idUsuarioOperacion?: number
  ) {
    const produccionActual = await this.obtenerProduccionPorId(id)

    if (produccionActual.estado === 'COMPLETADA' || produccionActual.estado === 'CANCELADA') {
      throw createError({
        statusCode: 400,
        statusMessage: `No se pueden editar datos de una orden con estado ${produccionActual.estado}.`,
      })
    }

    const actualizada = await ProduccionRepository.actualizar(id, cambios)

    const idUsuario = idUsuarioOperacion || produccionActual.id_usuario
    await ProduccionRepository.registrarAuditoria({
      id_usuario: idUsuario,
      accion: 'ACTUALIZAR_ORDEN_PRODUCCION',
      tabla_afectada: 'produccion',
      registro_id: id,
      detalle: `Orden de producción #${id} actualizada.`,
    })

    return actualizada
  },
}
