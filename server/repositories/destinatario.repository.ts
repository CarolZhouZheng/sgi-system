import { supabase } from '../utils/supabase';
import type { Destinatario } from '../models/destinatario.model';

export class DestinatarioRepository {
  async crear(destinatario: Destinatario) {
    const { data, error } = await supabase
      .from('destinatario')
      .insert([destinatario])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async buscarPorNombre(nombre_empresa: string) {
    // D-08: Escapar caracteres especiales de ILIKE (%, _, \) para evitar comodines
    const nombreEscapado = nombre_empresa.replace(/[%_\\]/g, '\\$&');
    
    const { data, error } = await supabase
      .from('destinatario')
      .select('*')
      .ilike('nombre_empresa', nombreEscapado)
      .limit(1);
      
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  }

  async obtenerTodos() {
    const { data, error } = await supabase
      .from('destinatario')
      .select('*')
      .order('id_destinatario', { ascending: false });

    if (error) throw error;
    return data;
  }
}
