// server/services/devolucion.service.ts
import { createError } from 'h3';
import {
  CrearDevolucionSchema,
  CambiarEstadoDevolucionSchema,
  FiltrosDevolucionSchema,
  type CrearDevolucionDTO,
  type CambiarEstadoDevolucionDTO,
  type FiltrosDevolucionDTO,
} from '../dtos/devolucion.dto';
import { DevolucionRepository } from '../repositories/devolucion.repository';
import { ProductoRepository } from '../repositories/producto.repository';
import { MovimientoRepository } from '../repositories/movimiento.repository';
import type { Devolucion, DevolucionDetalle } from '../models/devolucion.model';

export const DevolucionService = {
  /**
   * Registra una devolución aplicando reglas de negocio y actualizando
   * el stock y movimiento_inventario cuando sea APROBADA (reingreso de pan).
   */
  async registrarDevolucion(
    datos: CrearDevolucionDTO,
    idUsuarioSesion?: number
  ): Promise<Devolucion> {
    const idUsuario = idUsuarioSesion || datos.id_usuario;
    if (!idUsuario) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El ID de usuario es obligatorio para registrar la devolución.',
      });
    }

    const datosCompletos = {
      ...datos,
      id_usuario: idUsuario,
    };

    const validacion = CrearDevolucionSchema.safeParse(datosCompletos);
    if (!validacion.success) {
      throw createError({
        statusCode: 400,
        statusMessage: validacion.error.issues.map((i) => i.message).join('; '),
      });
    }

    const payload = validacion.data;

    // 1. Validar que el producto corresponda al pedido indicado
    const detallePedido = await DevolucionRepository.obtenerDetallePedido(
      payload.id_pedido,
      payload.id_producto
    );

    if (!detallePedido) {
      throw createError({
        statusCode: 400,
        statusMessage: `El producto #${payload.id_producto} no forma parte del pedido #${payload.id_pedido}.`,
      });
    }

    // 2. Validar que la cantidad devuelta no supere lo despachado / entregado (CU11 paso alterno 3)
    const cantidadDespachada = Number(detallePedido.cantidad_entregada || detallePedido.cantidad || 0);
    const devueltoPrevio = await DevolucionRepository.obtenerTotalDevueltoPreviamente(
      payload.id_pedido,
      payload.id_producto
    );

    const cantidadDisponible = Math.max(0, cantidadDespachada - devueltoPrevio);
    if (payload.cantidad_devuelta > cantidadDisponible) {
      throw createError({
        statusCode: 400,
        statusMessage: `La cantidad a devolver (${payload.cantidad_devuelta}) supera la cantidad disponible del pedido (${cantidadDisponible}). Despachado: ${cantidadDespachada}, devuelto previo: ${devueltoPrevio}.`,
      });
    }

    // 3. Crear el registro en tabla devolucion
    const devolucion = await DevolucionRepository.crear({
      id_pedido: payload.id_pedido,
      id_producto: payload.id_producto,
      id_lote: payload.id_lote || null,
      id_usuario: idUsuario,
      cantidad_devuelta: payload.cantidad_devuelta,
      motivo: payload.motivo,
      fecha: payload.fecha,
      estado: payload.estado,
      observaciones: payload.observaciones || null,
    });

    // 4. Si la devolución es APROBADA: reingresar al inventario y registrar movimiento
    if (devolucion.estado === 'APROBADA') {
      const cantidadNum = Number(devolucion.cantidad_devuelta);
      const { stock_anterior, stock_nuevo } = await ProductoRepository.sumarStock(
        devolucion.id_producto,
        cantidadNum
      );

      await MovimientoRepository.crear({
        id_producto: devolucion.id_producto,
        id_lote: devolucion.id_lote || null,
        id_devolucion: devolucion.id_devolucion,
        id_usuario: idUsuario,
        tipo_movimiento: 'DEVOLUCION',
        cantidad: cantidadNum,
        stock_anterior,
        stock_nuevo,
        observaciones:
          devolucion.observaciones ||
          `Reingreso por devolución #${devolucion.id_devolucion} del pedido #${devolucion.id_pedido}`,
      });
    }

    // 5. Registrar en bitácora de auditoría
    await DevolucionRepository.registrarAuditoria({
      id_usuario: idUsuario,
      accion: 'REGISTRAR_DEVOLUCION',
      tabla_afectada: 'devolucion',
      registro_id: devolucion.id_devolucion,
      detalle: `Devolución #${devolucion.id_devolucion} registrada con estado ${devolucion.estado} para pedido #${payload.id_pedido}. Cantidad: ${payload.cantidad_devuelta}.`,
    });

    return devolucion;
  },

  /**
   * Cambia el estado de una devolución (ej. PENDIENTE -> APROBADA o RECHAZADA).
   * Al pasar a APROBADA, incrementa el stock y genera el movimiento de inventario.
   */
  async cambiarEstadoDevolucion(
    id: number,
    datos: CambiarEstadoDevolucionDTO,
    idUsuarioOperacion?: number
  ): Promise<Devolucion> {
    const validacion = CambiarEstadoDevolucionSchema.safeParse(datos);
    if (!validacion.success) {
      throw createError({
        statusCode: 400,
        statusMessage: validacion.error.issues.map((i) => i.message).join('; '),
      });
    }

    const devolucionActual = await DevolucionRepository.obtenerPorId(id);
    if (!devolucionActual) {
      throw createError({
        statusCode: 404,
        statusMessage: `La devolución #${id} no existe.`,
      });
    }

    if (devolucionActual.estado === validacion.data.estado) {
      return devolucionActual;
    }

    if (devolucionActual.estado === 'APROBADA') {
      throw createError({
        statusCode: 400,
        statusMessage: 'No se puede modificar una devolución que ya fue APROBADA y reingresada al inventario.',
      });
    }

    const devolucionActualizada = await DevolucionRepository.actualizarEstado(
      id,
      validacion.data
    );

    const idUsuario = idUsuarioOperacion || devolucionActual.id_usuario;

    // Si cambió a APROBADA: sumar stock y crear movimiento_inventario
    if (validacion.data.estado === 'APROBADA') {
      const cantidadNum = Number(devolucionActual.cantidad_devuelta);
      const { stock_anterior, stock_nuevo } = await ProductoRepository.sumarStock(
        devolucionActual.id_producto,
        cantidadNum
      );

      await MovimientoRepository.crear({
        id_producto: devolucionActual.id_producto,
        id_lote: devolucionActual.id_lote || null,
        id_devolucion: id,
        id_usuario: idUsuario,
        tipo_movimiento: 'DEVOLUCION',
        cantidad: cantidadNum,
        stock_anterior,
        stock_nuevo,
        observaciones:
          validacion.data.observaciones ||
          devolucionActual.observaciones ||
          `Reingreso por aprobación de devolución #${id}`,
      });
    }

    // Auditoría
    await DevolucionRepository.registrarAuditoria({
      id_usuario: idUsuario,
      accion: 'CAMBIAR_ESTADO_DEVOLUCION',
      tabla_afectada: 'devolucion',
      registro_id: id,
      detalle: `Devolución #${id} cambió de estado ${devolucionActual.estado} a ${validacion.data.estado}.`,
    });

    return devolucionActualizada;
  },

  /**
   * Consulta las devoluciones registradas con filtros.
   */
  async listarDevoluciones(filtrosRaw?: unknown): Promise<DevolucionDetalle[]> {
    const validacion = FiltrosDevolucionSchema.safeParse(filtrosRaw || {});
    if (!validacion.success) {
      throw createError({
        statusCode: 400,
        statusMessage: validacion.error.issues.map((i) => i.message).join('; '),
      });
    }

    const filtros = validacion.data;
    return await DevolucionRepository.listar({
      estado: filtros.estado,
      id_producto: filtros.id_producto,
      id_pedido: filtros.id_pedido,
      id_destinatario: filtros.id_destinatario,
      fechaDesde: filtros.desde,
      fechaHasta: filtros.hasta,
      limite: filtros.limite,
    });
  },

  /**
   * Obtiene el detalle completo de una devolución por ID.
   */
  async obtenerDevolucionPorId(id: number): Promise<DevolucionDetalle> {
    if (!id || id <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'El ID de la devolución no es válido.',
      });
    }

    const devolucion = await DevolucionRepository.obtenerPorId(id);
    if (!devolucion) {
      throw createError({
        statusCode: 404,
        statusMessage: `La devolución #${id} no fue encontrada.`,
      });
    }

    return devolucion;
  },

  /**
   * Retorna pedidos elegibles para selección rápida en formulario.
   */
  async obtenerPedidosElegibles() {
    return await DevolucionRepository.listarPedidosElegibles();
  },
};
