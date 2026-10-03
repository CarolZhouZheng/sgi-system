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
    const { data, error } = await supabase
      .from('producto')
      .select('id_producto')
      .in('id_producto', ids)
      .eq('estado', true)

    if (error) throw new Error(error.message)
    return (data?.length || 0) === new Set(ids).size
  },

  async crearPedido(datos: CrearPedidoInput): Promise<Pedido> {
    const { detalles, ...cabecera } = datos

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
      // Limpieza compensatoria. Una función RPC transaccional es más segura.
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