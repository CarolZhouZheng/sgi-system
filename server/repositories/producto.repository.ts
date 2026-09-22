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
};