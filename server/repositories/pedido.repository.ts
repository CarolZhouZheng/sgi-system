import { supabase } from '../utils/supabase'
import type { CrearPedidoInput, Pedido, PedidoListado } from '../models/pedido.model'

export const PedidoRepository = {
  async destinatarioActivoExiste(id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('destinatario')
      .select('id_destinatario')
      .eq('id_destinatario', id)
      .eq('estado', true)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return Boolean(data)
  },

  async usuarioActivoExiste(id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('id_usuario', id)
      .eq('estado', true)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return Boolean(data)
  },

  async productosActivosExisten(ids: number[]): Promise<boolean> {
    const productos = await this.obtenerProductosPorIds(ids)
    const activos = productos.filter((p) => p.estado)
    return activos.length === new Set(ids).size
  },

  async obtenerProductosPorIds(ids: number[]) {
    const { data, error } = await supabase
      .from('producto')
      .select('id_producto, nombre, stock_actual, stock_minimo, estado')
      .in('id_producto', ids)

    if (error) throw new Error(error.message)
    return data || []
  },

  async registrarAuditoria(datos: {
    id_usuario: number
    accion: string
    tabla_afectada: string
    registro_id?: number
    detalle: string
  }) {
    try {
      await supabase.from('auditoria').insert({
        id_usuario: datos.id_usuario,
        accion: datos.accion,
        tabla_afectada: datos.tabla_afectada,
        registro_id: datos.registro_id || null,
        detalle: datos.detalle,
      })
    } catch {
      // No bloquea la operación principal si la tabla de auditoría falla
    }
  },

  async crearPedido(datos: CrearPedidoInput): Promise<Pedido> {
    const { detalles, ...cabecera } = datos

    // D-02: Validación previa: impedir terminantemente crear una cabecera de pedido sin detalles
    if (!detalles || detalles.length === 0) {
      throw new Error('El pedido debe contener al menos un producto.')
    }

    // 1. Inserción de la cabecera del pedido
    const { data: pedido, error: errorPedido } = await supabase
      .from('pedido')
      .insert({
        ...cabecera,
        prioridad: cabecera.prioridad || 'NORMAL',
        fecha_entrega: cabecera.fecha_entrega || null,
        encargado_entrega: cabecera.encargado_entrega || null,
        estado: 'PENDIENTE',
      })
      .select()
      .single()

    if (errorPedido || !pedido) {
      throw new Error(`Error al registrar cabecera del pedido: ${errorPedido?.message || 'No se pudo crear el pedido.'}`)
    }

    // 2. Inserción de los detalles con compensación estricta (D-02)
    try {
      const filasDetalle = detalles.map((detalle) => ({
        id_pedido: pedido.id_pedido,
        id_producto: detalle.id_producto,
        cantidad: detalle.cantidad,
        cantidad_entregada: 0,
      }))

      const { data: detallesInsertados, error: errorDetalles } = await supabase
        .from('detalle_pedido')
        .insert(filasDetalle)
        .select()

      if (errorDetalles || !detallesInsertados || detallesInsertados.length === 0) {
        throw new Error(errorDetalles?.message || 'No se pudieron registrar los detalles del pedido.')
      }

      return pedido as Pedido
    } catch (error: any) {
      // D-02: Si fallan los detalles, se realiza rollback compensatorio eliminando cualquier detalle
      // parcial y luego eliminando la cabecera para garantizar que nunca quede un pedido sin productos.
      await supabase
        .from('detalle_pedido')
        .delete()
        .eq('id_pedido', pedido.id_pedido)

      await supabase
        .from('pedido')
        .delete()
        .eq('id_pedido', pedido.id_pedido)

      throw new Error(
        `Operación revertida: no se pudieron guardar los detalles del pedido (${error?.message || 'error en detalles'}).`
      )
    }
  },

  async listarPedidos(): Promise<PedidoListado[]> {
    const { data, error } = await supabase
      .from('pedido')
      .select(`
        *,
        destinatario ( id_destinatario, nombre_empresa ),
        detalle_pedido (
          id_detalle_pedido,
          id_pedido,
          id_producto,
          cantidad,
          cantidad_entregada,
          producto ( id_producto, nombre, unidad_medida )
        )
      `)
      .order('fecha_registro', { ascending: false })

    if (error) throw new Error(error.message)
    return (data || []) as unknown as PedidoListado[]
  },
}