import { supabase } from '../utils/supabase';
import type { Usuario } from '../models/usuario.model';

export class UsuarioRepository {
  /**
   * Crea un nuevo registro de usuario en la base de datos Supabase
   */
  static async create(data: Omit<Usuario, 'id'>): Promise<Usuario> {
    const { data: usuario, error } = await supabase
      .from('Usuario')
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear usuario en BD: ${error.message}`);
    }

    return usuario as Usuario;
  }

  /**
   * Busca un usuario por su nombre de usuario
   */
  static async findByNombreUsuario(nombreUsuario: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('Usuario')
      .select('*')
      .eq('nombreUsuario', nombreUsuario)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al buscar usuario por nombreUsuario: ${error.message}`);
    }

    return (data as Usuario) || null;
  }

  /**
   * Busca un usuario por su identificador primario
   */
  static async findById(id: number): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('Usuario')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al buscar usuario por ID: ${error.message}`);
    }

    return (data as Usuario) || null;
  }

  /**
   * Obtiene la lista completa de usuarios
   */
  static async findAll(): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('Usuario')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      throw new Error(`Error al listar usuarios: ${error.message}`);
    }

    return (data as Usuario[]) || [];
  }
}
