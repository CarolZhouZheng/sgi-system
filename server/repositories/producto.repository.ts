import { supabase } from '../utils/supabase';
import type { Producto } from '../models/producto.model';

export const ProductoRepository = {
  async crear(producto: {
    nombre: string;
    descripcion?: string;
    categoria?: string;
    unidad_medida: string;
    stock_actual?: number;
    stock_minimo?: number;
    estado?: boolean;
  }): Promise<Producto> {
    const { data, error } = await supabase
      .from('producto')
      .insert(producto)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear el producto: ${error.message}`);
    }

    return data as Producto;
  },

  async obtenerPorId(id: number): Promise<Producto | null> {
    const { data, error } = await supabase
      .from('producto')
      .select()
      .eq('id_producto', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al consultar el producto: ${error.message}`);
    }

    return (data as Producto) || null;
  },

  async listar(filtroEstado?: boolean): Promise<Producto[]> {
    let query = supabase
      .from('producto')
      .select()
      .order('id_producto', { ascending: false });

    if (filtroEstado !== undefined) {
      query = query.eq('estado', filtroEstado);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al listar los productos: ${error.message}`);
    }

    return (data as Producto[]) || [];
  },

  async actualizar(
    id: number,
    cambios: {
      nombre?: string;
      descripcion?: string | null;
      categoria?: string | null;
      unidad_medida?: string;
      stock_actual?: number;
      stock_minimo?: number;
    }
  ): Promise<Producto> {
    const { data, error } = await supabase
      .from('producto')
      .update(cambios)
      .eq('id_producto', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar el producto: ${error.message}`);
    }

    return data as Producto;
  },

  async darDeBaja(id: number): Promise<Producto> {
    const { data, error } = await supabase
      .from('producto')
      .update({ estado: false })
      .eq('id_producto', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al dar de baja el producto: ${error.message}`);
    }

    return data as Producto;
  },

  async reactivar(id: number): Promise<Producto> {
    const { data, error } = await supabase
      .from('producto')
      .update({ estado: true })
      .eq('id_producto', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al reactivar el producto: ${error.message}`);
    }

    return data as Producto;
  },
};