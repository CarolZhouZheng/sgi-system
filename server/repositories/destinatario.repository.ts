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
    const { data, error } = await supabase
      .from('destinatario')
      .select('*')
      .ilike('nombre_empresa', nombre_empresa)
      .maybeSingle();
      
    if (error) throw error;
    return data;
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
