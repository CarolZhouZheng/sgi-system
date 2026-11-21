import { supabase } from '../utils/supabase';
import type { Producto } from '../models/producto.model';

export const ProductoRepository = {
  // ===== INICIO DE MI IMPLEMENTACIÓN - RF-01 =====
  // Este método recibe los datos del producto desde el servicio (server/services/producto.service.ts).
  // CONEXIÓN CON SUPABASE Y BASE DE DATOS: Usa el cliente de server/utils/supabase.ts para insertar el producto en la tabla "producto" (server/bd/schema.sql).
  // Después devuelve el producto recién creado (con su id_producto y fecha_creacion) cumpliendo el modelo de server/models/producto.model.ts.
  async crear(producto: {
    nombre: string;
    descripcion?: string;
    categoria?: string;
    unidad_medida: string;
    stock_actual?: number;
    stock_minimo?: number;
    estado?: boolean;
    fecha_vencimiento?: string;
  }): Promise<Producto> {
    const { fecha_vencimiento, ...datosProducto } = producto;

    // Inserta el producto en la tabla 'producto' y con .select().single() pide que devuelva el registro creado
    const { data, error } = await supabase
      .from('producto')
      .insert(datosProducto)
      .select()
      .single();

    // Si ocurre algún problema en la base de datos, lanza un error para avisar al servidor
    if (error) {
      throw new Error(`Error al crear el producto: ${error.message}`);
    }

    const nuevoProducto = data as Producto;

    if (fecha_vencimiento) {
      const hoy = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Costa_Rica',
      }).format(new Date());
      const fechaProduccion = fecha_vencimiento < hoy ? fecha_vencimiento : hoy;

      const { data: loteCreado, error: errorLote } = await supabase
        .from('lote')
        .insert({
          id_producto: nuevoProducto.id_producto,
          numero_lote: `LOTE-${nuevoProducto.id_producto}-${Date.now()}`,
          cantidad: nuevoProducto.stock_actual ?? 0,
          fecha_produccion: fechaProduccion,
          fecha_vencimiento,
          estado: nuevoProducto.estado ?? true,
        })
        .select('fecha_vencimiento')
        .single();

      if (errorLote) {
        throw new Error(`Error al registrar la fecha de vencimiento: ${errorLote.message}`);
      }

      nuevoProducto.fecha_vencimiento = loteCreado?.fecha_vencimiento ?? fecha_vencimiento;
    } else {
      nuevoProducto.fecha_vencimiento = null;
    }

    return nuevoProducto;
  },
  // ===== FIN DE MI IMPLEMENTACIÓN - RF-01 =====
  // NOTA: Los métodos de abajo pertenecen a otros tickets (RF-03, RF-04 y RF-07).

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

//listar productos, para la barra de busqueda y filtros
 async listar(filtros?: {
    busqueda?: string;
    categoria?: string;
    estado?: boolean;
    stock?: 'todos' | 'bajo' | 'disponible' | 'agotado';
  }): Promise<Producto[]> {
    let query = supabase
      .from('producto')
      .select()
      .order('id_producto', { ascending: false });

    if (filtros?.estado !== undefined) {
      query = query.eq('estado', filtros.estado);
    }

    if (filtros?.categoria) {
      query = query.eq('categoria', filtros.categoria);
    }

    if (filtros?.busqueda) {
      const termino = filtros.busqueda.trim();
      if (termino.length > 0) {
        // En PostgREST, los valores con caracteres especiales (como comas o paréntesis)
        // se delimitan con comillas dobles dentro del árbol lógico or()
        const terminoSeguro = termino.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        query = query.or(
          `nombre.ilike."%${terminoSeguro}%",descripcion.ilike."%${terminoSeguro}%",categoria.ilike."%${terminoSeguro}%"`
        );
      }
    }

    if (filtros?.stock === 'disponible') {
      query = query.gt('stock_actual', 0);
    } else if (filtros?.stock === 'agotado') {
      query = query.lte('stock_actual', 0);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al listar los productos: ${error.message}`);
    }

    const productos = ((data as Producto[]) || []).map((p) => ({
      ...p,
      fecha_vencimiento: p.fecha_vencimiento ?? null,
    }));

    if (productos.length > 0) {
      const ids = productos.map((p) => p.id_producto);
      const { data: lotesData } = await supabase
        .from('lote')
        .select('id_producto, fecha_vencimiento')
        .in('id_producto', ids)
        .eq('estado', true)
        .not('fecha_vencimiento', 'is', null)
        .order('fecha_vencimiento', { ascending: true });

      if (lotesData && lotesData.length > 0) {
        const vencimientoPorProducto = new Map<number, string>();
        for (const lote of lotesData) {
          if (lote.fecha_vencimiento && !vencimientoPorProducto.has(lote.id_producto)) {
            vencimientoPorProducto.set(lote.id_producto, lote.fecha_vencimiento);
          }
        }

        for (const prod of productos) {
          if (vencimientoPorProducto.has(prod.id_producto)) {
            prod.fecha_vencimiento = vencimientoPorProducto.get(prod.id_producto) || null;
          }
        }
      }
    }

    return productos;
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

  /**
   * RF-03: fecha de vencimiento vigente del producto, la misma que muestra el listado
   * (lote activo con fecha que vence primero). Null si no tiene.
   */
  async obtenerFechaVencimiento(id: number): Promise<string | null> {
    const { data, error } = await supabase
      .from('lote')
      .select('fecha_vencimiento')
      .eq('id_producto', id)
      .eq('estado', true)
      .not('fecha_vencimiento', 'is', null)
      .order('fecha_vencimiento', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Error al consultar la fecha de vencimiento: ${error.message}`);
    }

    return data?.fecha_vencimiento ?? null;
  },

  /**
   * RF-03: cambia la fecha de vencimiento del producto. Se actualiza el lote que muestra
   * el listado; si el producto no tiene lote con fecha, se crea uno igual que al registrarlo.
   */
  async actualizarFechaVencimiento(producto: Producto, fecha_vencimiento: string): Promise<string> {
    const { data: lote, error: errorLote } = await supabase
      .from('lote')
      .select('id_lote')
      .eq('id_producto', producto.id_producto)
      .eq('estado', true)
      .not('fecha_vencimiento', 'is', null)
      .order('fecha_vencimiento', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (errorLote) {
      throw new Error(`Error al consultar el lote del producto: ${errorLote.message}`);
    }

    if (lote) {
      const { data, error } = await supabase
        .from('lote')
        .update({ fecha_vencimiento })
        .eq('id_lote', lote.id_lote)
        .select('fecha_vencimiento')
        .single();

      if (error) {
        throw new Error(`Error al actualizar la fecha de vencimiento: ${error.message}`);
      }

      return data.fecha_vencimiento;
    }

    const hoy = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Costa_Rica',
    }).format(new Date());

    const { data, error } = await supabase
      .from('lote')
      .insert({
        id_producto: producto.id_producto,
        numero_lote: `LOTE-${producto.id_producto}-${Date.now()}`,
        cantidad: producto.stock_actual ?? 0,
        fecha_produccion: fecha_vencimiento < hoy ? fecha_vencimiento : hoy,
        fecha_vencimiento,
        estado: true,
      })
      .select('fecha_vencimiento')
      .single();

    if (error) {
      throw new Error(`Error al registrar la fecha de vencimiento: ${error.message}`);
    }

    return data.fecha_vencimiento;
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

  /**
   * Suma una cantidad al stock actual del producto y retorna el stock anterior y nuevo.
   */
  async sumarStock(
    id: number,
    cantidad: number
  ): Promise<{ producto: Producto; stock_anterior: number; stock_nuevo: number }> {
    const productoActual = await this.obtenerPorId(id);
    if (!productoActual) {
      throw new Error(`El producto #${id} no existe.`);
    }

    const stock_anterior = Number(productoActual.stock_actual) || 0;
    const stock_nuevo = stock_anterior + Number(cantidad);

    const productoActualizado = await this.actualizar(id, { stock_actual: stock_nuevo });

    return {
      producto: productoActualizado,
      stock_anterior,
      stock_nuevo,
    };
  },
};
