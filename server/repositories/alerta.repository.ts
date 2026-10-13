import { supabase } from '../utils/supabase';

export interface LoteRawProducto {
  id_producto: number;
  nombre: string;
  categoria: string | null;
  unidad_medida: string;
}

export interface LoteRaw {
  id_lote: number;
  numero_lote: string;
  cantidad: number;
  fecha_produccion: string | null;
  fecha_vencimiento: string;
  estado: boolean;
  id_producto: number;
  producto?: LoteRawProducto | LoteRawProducto[] | null;
}

export const AlertaRepository = {
  /**
   * Obtiene la cantidad de días configurados para la alerta de vencimiento
   * desde la tabla `configuracion`. Si no hay registro o falla, devuelve 3 días por defecto.
   */
  async obtenerDiasConfiguracion(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('configuracion')
        .select('dias_alerta_vencimiento')
        .eq('estado', true)
        .order('id_configuracion', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data || !data.dias_alerta_vencimiento) {
        return 3;
      }

      return Number(data.dias_alerta_vencimiento) || 3;
    } catch {
      return 3;
    }
  },

  /**
   * Consulta los lotes activos con stock > 0 que posean fecha de vencimiento definida.
   * Trae la relación con la tabla producto.
   */
  async obtenerLotesCandidatos(): Promise<LoteRaw[]> {
    const { data, error } = await supabase
      .from('lote')
      .select(`
        id_lote,
        numero_lote,
        cantidad,
        fecha_produccion,
        fecha_vencimiento,
        estado,
        id_producto,
        producto:id_producto (
          id_producto,
          nombre,
          categoria,
          unidad_medida
        )
      `)
      .eq('estado', true)
      .gt('cantidad', 0)
      .not('fecha_vencimiento', 'is', null)
      .order('fecha_vencimiento', { ascending: true });

    if (error) {
      throw new Error(`Error al consultar lotes para alertas de vencimiento: ${error.message}`);
    }

    return (data as unknown as LoteRaw[]) || [];
  },
};
