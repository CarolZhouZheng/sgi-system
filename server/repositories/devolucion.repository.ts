// server/repositories/devolucion.repository.ts
import { supabase } from '../utils/supabase';
import type {
  Devolucion,
  DevolucionDetalle,
  CrearDevolucionInput,
  CambiarEstadoDevolucionInput,
  FiltrosDevolucion,
} from '../models/devolucion.model';

export const DevolucionRepository = {
  /**
   * Inserta un nuevo registro en la tabla devolucion.
   */
  async crear(datos: CrearDevolucionInput): Promise<Devolucion> {
    const payload: Record<string, any> = {
      id_pedido: datos.id_pedido,
      id_producto: datos.id_producto,
      id_lote: datos.id_lote || null,
      id_usuario: datos.id_usuario,
      cantidad_devuelta: datos.cantidad_devuelta,
      motivo: datos.motivo,
      estado: datos.estado || 'PENDIENTE',
      observaciones: datos.observaciones || null,
    };

    if (datos.fecha) {
      payload.fecha = datos.fecha;
    }

    const { data, error } = await supabase
      .from('devolucion')
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Error al registrar la devolución: ${error?.message || 'Error desconocido'}`);
    }

    return data as Devolucion;
  },

  /**
   * Consulta devoluciones con sus relaciones (producto, pedido, destinatario, usuario, lote).
   */
  async listar(filtros?: FiltrosDevolucion): Promise<DevolucionDetalle[]> {
    let query = supabase
      .from('devolucion')
      .select(`
        id_devolucion,
        id_pedido,
        id_producto,
        id_lote,
        id_usuario,
        cantidad_devuelta,
        motivo,
        fecha,
        estado,
        observaciones,
        producto:id_producto ( id_producto, nombre, unidad_medida, categoria, stock_actual ),
        pedido:id_pedido (
          id_pedido,
          fecha_registro,
          fecha_entrega,
          estado,
          prioridad,
          id_destinatario,
          destinatario:id_destinatario ( id_destinatario, nombre_empresa, telefono, correo )
        ),
        usuario:id_usuario ( id_usuario, nombre, apellido, nombre_usuario ),
        lote:id_lote ( id_lote, numero_lote, fecha_vencimiento )
      `)
      .order('fecha', { ascending: false })
      .order('id_devolucion', { ascending: false });

    if (filtros?.estado && filtros.estado !== 'TODOS') {
      query = query.eq('estado', filtros.estado);
    }

    if (filtros?.id_producto) {
      query = query.eq('id_producto', filtros.id_producto);
    }

    if (filtros?.id_pedido) {
      query = query.eq('id_pedido', filtros.id_pedido);
    }

    if (filtros?.fechaDesde) {
      query = query.gte('fecha', filtros.fechaDesde);
    }

    if (filtros?.fechaHasta) {
      query = query.lte('fecha', filtros.fechaHasta);
    }

    if (filtros?.limite) {
      query = query.limit(filtros.limite);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al consultar las devoluciones: ${error.message}`);
    }

    let resultado = (data || []) as unknown as DevolucionDetalle[];

    // Filtro adicional en memoria si se requiere por id_destinatario (anidado)
    if (filtros?.id_destinatario) {
      resultado = resultado.filter(
        (dev) => dev.pedido?.destinatario?.id_destinatario === filtros.id_destinatario
      );
    }

    return resultado;
  },

  /**
   * Obtiene una devolución por su ID con todo el detalle de relaciones.
   */
  async obtenerPorId(id: number): Promise<DevolucionDetalle | null> {
    const { data, error } = await supabase
      .from('devolucion')
      .select(`
        id_devolucion,
        id_pedido,
        id_producto,
        id_lote,
        id_usuario,
        cantidad_devuelta,
        motivo,
        fecha,
        estado,
        observaciones,
        producto:id_producto ( id_producto, nombre, unidad_medida, categoria, stock_actual ),
        pedido:id_pedido (
          id_pedido,
          fecha_registro,
          fecha_entrega,
          estado,
          prioridad,
          id_destinatario,
          destinatario:id_destinatario ( id_destinatario, nombre_empresa, telefono, correo )
        ),
        usuario:id_usuario ( id_usuario, nombre, apellido, nombre_usuario ),
        lote:id_lote ( id_lote, numero_lote, fecha_vencimiento )
      `)
      .eq('id_devolucion', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al obtener la devolución #${id}: ${error.message}`);
    }

    return (data as unknown as DevolucionDetalle) || null;
  },

  /**
   * Actualiza el estado y observaciones de una devolución.
   */
  async actualizarEstado(
    id: number,
    input: CambiarEstadoDevolucionInput
  ): Promise<Devolucion> {
    const updatePayload: Record<string, any> = {
      estado: input.estado,
    };

    if (input.observaciones !== undefined) {
      updatePayload.observaciones = input.observaciones;
    }

    const { data, error } = await supabase
      .from('devolucion')
      .update(updatePayload)
      .eq('id_devolucion', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Error al actualizar estado de devolución #${id}: ${error?.message || 'Error desconocido'}`);
    }

    return data as Devolucion;
  },

  /**
   * Obtiene la línea de detalle de un producto en un pedido.
   */
  async obtenerDetallePedido(id_pedido: number, id_producto: number) {
    const { data, error } = await supabase
      .from('detalle_pedido')
      .select('id_detalle_pedido, id_pedido, id_producto, cantidad, cantidad_entregada')
      .eq('id_pedido', id_pedido)
      .eq('id_producto', id_producto)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al consultar detalle del pedido #${id_pedido}: ${error.message}`);
    }

    return data;
  },

  /**
   * Suma las cantidades devueltas previamente para un producto de un pedido.
   */
  async obtenerTotalDevueltoPreviamente(
    id_pedido: number,
    id_producto: number,
    excluirIdDevolucion?: number
  ): Promise<number> {
    let query = supabase
      .from('devolucion')
      .select('cantidad_devuelta, estado')
      .eq('id_pedido', id_pedido)
      .eq('id_producto', id_producto)
      .neq('estado', 'RECHAZADA'); // Rechazada no descuenta cupo de devolución

    if (excluirIdDevolucion) {
      query = query.neq('id_devolucion', excluirIdDevolucion);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Error al consultar devoluciones previas: ${error.message}`);
    }

    return (data || []).reduce((acc, curr) => acc + Number(curr.cantidad_devuelta || 0), 0);
  },

  /**
   * Lista los pedidos con sus destinatarios y productos para alimentar el formulario.
   */
  async listarPedidosElegibles() {
    const { data, error } = await supabase
      .from('pedido')
      .select(`
        id_pedido,
        fecha_registro,
        fecha_entrega,
        estado,
        prioridad,
        destinatario:id_destinatario ( id_destinatario, nombre_empresa, telefono ),
        detalle_pedido (
          id_detalle_pedido,
          id_producto,
          cantidad,
          cantidad_entregada,
          producto:id_producto ( id_producto, nombre, unidad_medida, stock_actual )
        )
      `)
      .order('id_pedido', { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(`Error al listar pedidos elegibles: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Registra una acción en la tabla de auditoría.
   */
  async registrarAuditoria(datos: {
    id_usuario: number;
    accion: string;
    tabla_afectada: string;
    registro_id?: number;
    detalle: string;
  }) {
    try {
      await supabase.from('auditoria').insert({
        id_usuario: datos.id_usuario,
        accion: datos.accion,
        tabla_afectada: datos.tabla_afectada,
        registro_id: datos.registro_id || null,
        detalle: datos.detalle,
      });
    } catch {
      // No bloquea la operación principal si auditoría falla
    }
  },
};
