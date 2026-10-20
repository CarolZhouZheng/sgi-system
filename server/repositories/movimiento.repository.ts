import { supabase } from '../utils/supabase';

export interface MovimientoRawProducto {
  nombre: string;
  unidad_medida: string;
}

export interface MovimientoRawUsuario {
  nombre: string;
  apellido: string | null;
  nombre_usuario: string;
}

export interface MovimientoRaw {
  id_movimiento: number;
  id_producto: number;
  id_lote: number | null;
  id_produccion: number | null;
  id_perdida: number | null;
  id_devolucion: number | null;
  id_usuario: number;
  tipo_movimiento: string;
  cantidad: number | string;
  stock_anterior: number | string;
  stock_nuevo: number | string;
  fecha: string;
  observaciones: string | null;
  producto?: MovimientoRawProducto | MovimientoRawProducto[] | null;
  usuario?: MovimientoRawUsuario | MovimientoRawUsuario[] | null;
}

export interface FiltrosMovimientoRepositorio {
  fechaInicio?: string; // ISO inclusivo
  fechaFin?: string; // ISO exclusivo
  id_producto?: number;
  tipo?: string;
  limite: number;
}

export const MovimientoRepository = {
  /**
   * Consulta los movimientos de inventario con su producto y usuario,
   * del más reciente al más antiguo. Devuelve también el total que cumple los filtros.
   */
  async listar(filtros: FiltrosMovimientoRepositorio): Promise<{ filas: MovimientoRaw[]; total: number }> {
    let consulta = supabase
      .from('movimiento_inventario')
      .select(
        `
        id_movimiento,
        id_producto,
        id_lote,
        id_produccion,
        id_perdida,
        id_devolucion,
        id_usuario,
        tipo_movimiento,
        cantidad,
        stock_anterior,
        stock_nuevo,
        fecha,
        observaciones,
        producto:id_producto ( nombre, unidad_medida ),
        usuario:id_usuario ( nombre, apellido, nombre_usuario )
      `,
        { count: 'exact' }
      )
      .order('fecha', { ascending: false })
      .order('id_movimiento', { ascending: false })
      .limit(filtros.limite);

    if (filtros.fechaInicio) consulta = consulta.gte('fecha', filtros.fechaInicio);
    if (filtros.fechaFin) consulta = consulta.lt('fecha', filtros.fechaFin);
    if (filtros.id_producto) consulta = consulta.eq('id_producto', filtros.id_producto);
    if (filtros.tipo) consulta = consulta.eq('tipo_movimiento', filtros.tipo);

    const { data, error, count } = await consulta;

    if (error) {
      throw new Error(`Error al consultar los movimientos: ${error.message}`);
    }

    const filas = (data as unknown as MovimientoRaw[]) || [];
    return { filas, total: count ?? filas.length };
  },

  /**
   * Devuelve los tipos de movimiento registrados, para el filtro del reporte.
   */
  async obtenerTipos(): Promise<string[]> {
    const { data, error } = await supabase
      .from('movimiento_inventario')
      .select('tipo_movimiento');

    if (error) {
      throw new Error(`Error al consultar los tipos de movimiento: ${error.message}`);
    }

    return [...new Set((data || []).map((fila) => fila.tipo_movimiento as string))].sort();
  },
};
