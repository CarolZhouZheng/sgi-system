import { supabase } from '../utils/supabase'
import type { RegistrarPerdida, ResultadoPerdida } from '../models/perdida.model'

export async function registrarPerdida(
  perdida: RegistrarPerdida
): Promise<ResultadoPerdida> {
  const { data, error } = await supabase.rpc('registrar_perdida_inventario', {
    p_id_producto: perdida.id_producto,
    p_id_lote: perdida.id_lote ?? null,
    p_id_usuario: perdida.id_usuario,
    p_cantidad: perdida.cantidad,
    p_motivo: perdida.motivo,
    p_tipo_perdida: perdida.tipo_perdida,
    p_fecha: perdida.fecha || null,
    p_observaciones: perdida.observaciones || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data as ResultadoPerdida
}
