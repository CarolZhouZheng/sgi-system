import { supabase } from '../utils/supabase';
import type { Usuario } from '../models/usuario.model';

export const UsuarioRepository = {
  async obtenerPorNombreUsuario(nombre_usuario: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .eq('nombre_usuario', nombre_usuario)
      .eq('estado', true)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al buscar usuario: ${error.message}`);
    }

    return (data as Usuario) || null;
  }
};
