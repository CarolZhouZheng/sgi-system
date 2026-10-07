import { supabase } from '../utils/supabase'
import type {
  Produccion,
  ProduccionDetalle,
  CrearProduccionInput,
  ActualizarProduccionInput,
  CambiarEstadoProduccionInput,
  FiltrosColaProduccion,
} from '../models/produccion.model'

export const ProduccionRepository = {
  async listarCola(filtros?: FiltrosColaProduccion): Promise<ProduccionDetalle[]> {
    let query = supabase
      .from('produccion')
      .select(`
        *,
        producto:id_producto ( id_producto, nombre, unidad_medida, categoria ),
        pedido:id_pedido (
          id_pedido,
          prioridad,
          fecha_entrega,
          estado,
          destinatario:id_destinatario ( id_destinatario, nombre_empresa )
        ),
        usuario:id_usuario ( id_usuario, nombre, nombre_usuario ),
        lote:id_lote ( id_lote, numero_lote, fecha_vencimiento )
      `)
      .order('id_produccion', { ascending: false })

    if (filtros?.estado && filtros.estado !== 'TODOS') {
      query = query.eq('estado', filtros.estado)
    }

    if (filtros?.id_producto) {
      query = query.eq('id_producto', filtros.id_producto)
    }

    if (filtros?.id_pedido) {
      query = query.eq('id_pedido', filtros.id_pedido)
    }

    if (filtros?.fecha) {
      query = query.eq('fecha_produccion', filtros.fecha)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error al listar la cola de producción: ${error.message}`)
    }

    return (data || []) as unknown as ProduccionDetalle[]
  },

  async obtenerPorId(id: number): Promise<ProduccionDetalle | null> {
    const { data, error } = await supabase
      .from('produccion')
      .select(`
        *,
        producto:id_producto ( id_producto, nombre, unidad_medida, categoria ),
        pedido:id_pedido (
          id_pedido,
          prioridad,
          fecha_entrega,
          estado,
          destinatario:id_destinatario ( id_destinatario, nombre_empresa )
        ),
        usuario:id_usuario ( id_usuario, nombre, nombre_usuario ),
        lote:id_lote ( id_lote, numero_lote, fecha_vencimiento )
      `)
      .eq('id_produccion', id)
      .maybeSingle()

    if (error) {
      throw new Error(`Error al consultar la orden de producción #${id}: ${error.message}`)
    }

    return (data as unknown as ProduccionDetalle) || null
  },

  async crear(datos: CrearProduccionInput): Promise<Produccion> {
    const fecha =
      datos.fecha_produccion ||
      new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica' }).format(new Date())

    const { data, error } = await supabase
      .from('produccion')
      .insert({
        id_pedido: datos.id_pedido || null,
        id_producto: datos.id_producto,
        id_usuario: datos.id_usuario,
        id_lote: datos.id_lote || null,
        cantidad_planificada: datos.cantidad_planificada,
        cantidad_producida: datos.cantidad_producida ?? 0,
        estado: datos.estado || 'PENDIENTE',
        fecha_produccion: fecha,
        tiempo_real: datos.tiempo_real || null,
        observaciones: datos.observaciones || null,
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Error al registrar orden en cola de producción: ${error?.message || 'Error desconocido'}`)
    }

    return data as Produccion
  },

  async cambiarEstado(id: number, datos: CambiarEstadoProduccionInput): Promise<Produccion> {
    const payload: Record<string, any> = {
      estado: datos.estado,
    }

    if (datos.cantidad_producida !== undefined) {
      payload.cantidad_producida = datos.cantidad_producida
    }

    if (datos.tiempo_real !== undefined) {
      payload.tiempo_real = datos.tiempo_real
    }

    if (datos.observaciones !== undefined) {
      payload.observaciones = datos.observaciones
    }

    const { data, error } = await supabase
      .from('produccion')
      .update(payload)
      .eq('id_produccion', id)
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Error al actualizar estado de producción #${id}: ${error?.message || 'Error desconocido'}`)
    }

    return data as Produccion
  },

  async actualizar(id: number, cambios: ActualizarProduccionInput): Promise<Produccion> {
    const payload: Record<string, any> = {}

    if (cambios.cantidad_planificada !== undefined) payload.cantidad_planificada = cambios.cantidad_planificada
    if (cambios.cantidad_producida !== undefined) payload.cantidad_producida = cambios.cantidad_producida
    if (cambios.estado !== undefined) payload.estado = cambios.estado
    if (cambios.id_lote !== undefined) payload.id_lote = cambios.id_lote
    if (cambios.tiempo_real !== undefined) payload.tiempo_real = cambios.tiempo_real
    if (cambios.observaciones !== undefined) payload.observaciones = cambios.observaciones

    const { data, error } = await supabase
      .from('produccion')
      .update(payload)
      .eq('id_produccion', id)
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Error al modificar orden de producción #${id}: ${error?.message || 'Error desconocido'}`)
    }

    return data as Produccion
  },

  async productoActivoExiste(id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('producto')
      .select('id_producto, estado')
      .eq('id_producto', id)
      .eq('estado', true)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return Boolean(data)
  },

  async usuarioActivoExiste(id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('usuario')
      .select('id_usuario, estado')
      .eq('id_usuario', id)
      .eq('estado', true)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return Boolean(data)
  },

  async pedidoExiste(id: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('pedido')
      .select('id_pedido')
      .eq('id_pedido', id)
      .maybeSingle()

    if (error) throw new Error(error.message)
    return Boolean(data)
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
}
