import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
} from 'vue';
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';

export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  estado: boolean;
  fecha_creacion?: string;
}

export type FiltroEstado = 'todos' | 'activos' | 'inactivos';

export type FiltroStock = 'todos' | 'bajo' | 'disponible' | 'agotado';

export interface ModalConfirmacionState {
  abierto: boolean;
  tipo: 'baja' | 'reactivar';
  producto: Producto | null;
}

export function useListadoProductos() {
  // Configuración de Supabase Realtime (RF-05)
  const config = useRuntimeConfig();

  const supabase =
    config.public.supabaseUrl && config.public.supabaseKey
      ? createClient(
          config.public.supabaseUrl as string,
          config.public.supabaseKey as string
        )
      : null;

  let realtimeChannel: RealtimeChannel | null = null;
  let temporizadorBusqueda: ReturnType<typeof setTimeout> | null = null;

  // Estados de los productos
  const productos = ref<Producto[]>([]);
  const catalogoProductos = ref<Producto[]>([]);

  const isLoadingList = ref(false);
  const listMessage = ref<string | null>(null);
  const listError = ref<string | null>(null);
  const isActionLoading = ref<number | null>(null);

  // Filtros de búsqueda avanzada (RF-07)
  const filtroSeleccionado = ref<FiltroEstado>('todos');
  const busqueda = ref('');
  const categoriaSeleccionada = ref('');
  const filtroStock = ref<FiltroStock>('todos');

  // Categorías disponibles para el selector.
  // Se utiliza el catálogo completo para que las categorías
  // no desaparezcan al aplicar otros filtros.
  const categoriasDisponibles = computed(() => {
    const categorias = catalogoProductos.value
      .map((producto) => producto.categoria?.trim())
      .filter((categoria): categoria is string => Boolean(categoria));

    return [...new Set(categorias)].sort((a, b) =>
      a.localeCompare(b, 'es')
    );
  });

  // Estado del modal de confirmación
  const modal = ref<ModalConfirmacionState>({
    abierto: false,
    tipo: 'baja',
    producto: null,
  });

  // Conteos para las pestañas de estado
  const conteos = computed(() => {
    const todos = productos.value.length;
    const activos = productos.value.filter((p) => p.estado).length;
    const inactivos = productos.value.filter((p) => !p.estado).length;

    return { todos, activos, inactivos };
  });

  // Lista filtrada según la pestaña de estado seleccionada
  const productosFiltrados = computed(() => {
    let lista = productos.value;

    if (filtroSeleccionado.value === 'activos') {
      lista = lista.filter((p) => p.estado);
    } else if (filtroSeleccionado.value === 'inactivos') {
      lista = lista.filter((p) => !p.estado);
    }

    return lista;
  });

  // Cambiar filtro de estado
  const cambiarFiltro = (filtro: FiltroEstado) => {
    filtroSeleccionado.value = filtro;
  };

  // Cargar productos aplicando los filtros de RF-07
  const fetchProductos = async () => {
    isLoadingList.value = true;
    listError.value = null;

    try {
      const query: Record<string, string> = {};

      if (busqueda.value.trim()) {
        query.busqueda = busqueda.value.trim();
      }

      if (categoriaSeleccionada.value) {
        query.categoria = categoriaSeleccionada.value;
      }

      if (filtroStock.value !== 'todos') {
        query.stock = filtroStock.value;
      }

      const res = await $fetch<{
        success: boolean;
        total: number;
        data: Producto[];
      }>('/api/productos', { query });

      if (res?.success) {
        productos.value = res.data;
      }
    } catch (err: any) {
      listError.value =
        err.data?.statusMessage ||
        err.data?.message ||
        err.message ||
        'Error al cargar productos';
    } finally {
      isLoadingList.value = false;
    }
  };

  // Cargar el catálogo completo para obtener todas las categorías
  const fetchCatalogoCategorias = async () => {
    try {
      const res = await $fetch<{
        success: boolean;
        data: Producto[];
      }>('/api/productos');

      if (res?.success) {
        catalogoProductos.value = res.data;
      }
    } catch (error) {
      console.error(
        'Error al cargar las categorías de productos:',
        error
      );
    }
  };

  let pausarWatch = false;

  // Evitar consultar la API inmediatamente por cada tecla
  const programarBusqueda = () => {
    if (pausarWatch) {
      pausarWatch = false;
      return;
    }

    if (temporizadorBusqueda) {
      clearTimeout(temporizadorBusqueda);
    }

    temporizadorBusqueda = setTimeout(() => {
      temporizadorBusqueda = null;
      fetchProductos();
    }, 350);
  };

  // Aplicar los filtros al cambiar búsqueda, categoría o stock
  watch(
    [busqueda, categoriaSeleccionada, filtroStock],
    programarBusqueda
  );

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    pausarWatch = true;
    busqueda.value = '';
    categoriaSeleccionada.value = '';
    filtroStock.value = 'todos';
    filtroSeleccionado.value = 'todos';

    if (temporizadorBusqueda) {
      clearTimeout(temporizadorBusqueda);
      temporizadorBusqueda = null;
    }

    fetchProductos();
  };

  // Abrir modal de baja o reactivación
  const abrirModalConfirmacion = (
    producto: Producto,
    tipo: 'baja' | 'reactivar'
  ) => {
    modal.value = {
      abierto: true,
      tipo,
      producto,
    };
  };

  // Cerrar modal
  const cerrarModal = (forzar: boolean = false) => {
    if (forzar || isActionLoading.value === null) {
      modal.value.abierto = false;
      modal.value.producto = null;
    }
  };

  // Ejecutar acción confirmada: baja o reactivación
  const ejecutarAccionModal = async () => {
    const target = modal.value.producto;

    if (!target) return;

    const id = target.id_producto;

    isActionLoading.value = id;
    listMessage.value = null;
    listError.value = null;

    try {
      if (modal.value.tipo === 'baja') {
        const res = await $fetch<{
          success: boolean;
          mensaje: string;
          data: Producto;
        }>(`/api/productos/${id}`, {
          method: 'DELETE',
        });

        if (res?.success) {
          listMessage.value = res.mensaje;

          const producto = productos.value.find(
            (p) => p.id_producto === id
          );

          if (producto) {
            producto.estado = false;
          }
        }
      } else {
        const res = await $fetch<{
          success: boolean;
          mensaje: string;
          data: Producto;
        }>(`/api/productos/${id}/reactivar`, {
          method: 'PATCH',
        });

        if (res?.success) {
          listMessage.value = res.mensaje;

          const producto = productos.value.find(
            (p) => p.id_producto === id
          );

          if (producto) {
            producto.estado = true;
          }
        }
      }

      cerrarModal(true);

      // Actualizar la lista y los conteos después de la acción
      await fetchProductos();
      await fetchCatalogoCategorias();
    } catch (err: any) {
      listError.value =
        err.data?.statusMessage ||
        err.data?.message ||
        err.message ||
        'Error al procesar la solicitud';
    } finally {
      isActionLoading.value = null;
    }
  };

  // Actualizar un producto local tras su edición
  const actualizarProductoLocal = (productoActualizado: Producto) => {
    const index = productos.value.findIndex(
      (p) => p.id_producto === productoActualizado.id_producto
    );

    if (index !== -1) {
      productos.value[index] = productoActualizado;
    }

    const indexCatalogo = catalogoProductos.value.findIndex(
      (p) => p.id_producto === productoActualizado.id_producto
    );

    if (indexCatalogo !== -1) {
      catalogoProductos.value[indexCatalogo] = productoActualizado;
    } else {
      catalogoProductos.value.push(productoActualizado);
    }
  };

  // Ciclo de vida y Supabase Realtime (RF-05)
  onMounted(() => {
    fetchProductos();
    fetchCatalogoCategorias();

    if (supabase) {
      realtimeChannel = supabase
        .channel('realtime-productos')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'producto',
          },
          () => {
            fetchProductos();
            fetchCatalogoCategorias();
          }
        )
        .subscribe();
    }
  });

  // Limpiar temporizadores y suscripción
  onUnmounted(() => {
    if (temporizadorBusqueda) {
      clearTimeout(temporizadorBusqueda);
      temporizadorBusqueda = null;
    }

    if (realtimeChannel && supabase) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  });

  return {
    productos,
    isLoadingList,
    listMessage,
    listError,
    isActionLoading,
    filtroSeleccionado,
    busqueda,
    categoriaSeleccionada,
    filtroStock,
    categoriasDisponibles,
    modal,
    conteos,
    productosFiltrados,
    cambiarFiltro,
    fetchProductos,
    limpiarFiltros,
    abrirModalConfirmacion,
    cerrarModal,
    ejecutarAccionModal,
    actualizarProductoLocal,
  };
}