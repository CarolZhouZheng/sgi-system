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

    // 1. Intentar creación atómica vía RPC (Función transaccional PostgreSQL)
    try {
      const { data: pedidoRpc, error: errorRpc } = await supabase.rpc('crear_pedido_con_detalles', {
        p_id_destinatario: cabecera.id_destinatario,
        p_id_usuario: cabecera.id_usuario,
        p_fecha_entrega: cabecera.fecha_entrega || null,
        p_prioridad: cabecera.prioridad,
        p_encargado_entrega: cabecera.encargado_entrega || null,
        p_detalles: detalles,
      })

      if (!errorRpc && pedidoRpc) {
        return pedidoRpc as Pedido
      }
    } catch {
      // Si la RPC aún no ha sido migrada en la base de datos remota, recurrimos a inserción directa controlada
    }

    // 2. Inserción directa con compensación
    const { data: pedido, error: errorPedido } = await supabase
      .from('pedido')
      .insert({
        ...cabecera,
        fecha_entrega: cabecera.fecha_entrega || null,
        encargado_entrega: cabecera.encargado_entrega || null,
      })
      .select()
      .single()

    if (errorPedido) throw new Error(errorPedido.message)

    const filasDetalle = detalles.map((detalle) => ({
      id_pedido: pedido.id_pedido,
      id_producto: detalle.id_producto,
      cantidad: detalle.cantidad,
    }))

    const { error: errorDetalles } = await supabase
      .from('detalle_pedido')
      .insert(filasDetalle)

    if (errorDetalles) {
      // Limpieza compensatoria si fallan los detalles
      const { error: errorLimpieza } = await supabase
        .from('pedido')
        .delete()
        .eq('id_pedido', pedido.id_pedido)

      if (errorLimpieza) {
        throw new Error(`Falló el detalle y no se pudo limpiar el pedido ${pedido.id_pedido}.`)
      }

      throw new Error(`No se guardaron los detalles: ${errorDetalles.message}`)
    }

    return pedido as Pedido
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