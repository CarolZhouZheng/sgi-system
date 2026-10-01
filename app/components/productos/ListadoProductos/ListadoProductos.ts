import { ref, computed, onMounted, onUnmounted } from 'vue';
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

export interface ModalConfirmacionState {
  abierto: boolean;
  tipo: 'baja' | 'reactivar';
  producto: Producto | null;
}

export function useListadoProductos() {
  // Configuración de Supabase Realtime (RF-05)
  const config = useRuntimeConfig();
  const supabase = (config.public.supabaseUrl && config.public.supabaseKey)
    ? createClient(config.public.supabaseUrl as string, config.public.supabaseKey as string)
    : null;

  let realtimeChannel: RealtimeChannel | null = null;

  // Estados de la lista de productos
  const productos = ref<Producto[]>([]);
  const isLoadingList = ref(false);
  const listMessage = ref<string | null>(null);
  const listError = ref<string | null>(null);
  const isActionLoading = ref<number | null>(null);

  // Filtros y búsqueda
  const filtroSeleccionado = ref<FiltroEstado>('todos');
  const busqueda = ref('');

  // Estado del Modal de confirmación (Baja / Reactivar)
  const modal = ref<ModalConfirmacionState>({
    abierto: false,
    tipo: 'baja',
    producto: null,
  });

  // Conteos para los botones de pestañas
  const conteos = computed(() => {
    const todos = productos.value.length;
    const activos = productos.value.filter((p) => p.estado).length;
    const inactivos = productos.value.filter((p) => !p.estado).length;
    return { todos, activos, inactivos };
  });

  // Lista filtrada según pestaña activa y término de búsqueda
  const productosFiltrados = computed(() => {
    let lista = productos.value;

    if (filtroSeleccionado.value === 'activos') {
      lista = lista.filter((p) => p.estado);
    } else if (filtroSeleccionado.value === 'inactivos') {
      lista = lista.filter((p) => !p.estado);
    }

    if (busqueda.value.trim() !== '') {
      const q = busqueda.value.toLowerCase().trim();
      lista = lista.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          (p.categoria && p.categoria.toLowerCase().includes(q)) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(q))
      );
    }

    return lista;
  });

  const cambiarFiltro = (filtro: FiltroEstado) => {
    filtroSeleccionado.value = filtro;
  };

  // Cargar productos desde la API (RF-04 / RF-05)
  const fetchProductos = async () => {
    isLoadingList.value = true;
    listError.value = null;
    try {
      const res = await $fetch<{ success: boolean; data: Producto[] }>('/api/productos');
      if (res && res.success) {
        productos.value = res.data;
      }
    } catch (err: any) {
      listError.value = err.data?.message || err.message || 'Error al cargar productos';
    } finally {
      isLoadingList.value = false;
    }
  };

  // Manejo del Modal de Confirmación
  const abrirModalConfirmacion = (producto: Producto, tipo: 'baja' | 'reactivar') => {
    modal.value = {
      abierto: true,
      tipo,
      producto,
    };
  };

  const cerrarModal = (forzar: boolean = false) => {
    if (forzar || isActionLoading.value === null) {
      modal.value.abierto = false;
      modal.value.producto = null;
    }
  };

  // Ejecución de la acción confirmada (Baja o Reactivación)
  const ejecutarAccionModal = async () => {
    const target = modal.value.producto;
    if (!target) return;

    const id = target.id_producto;
    isActionLoading.value = id;
    listMessage.value = null;
    listError.value = null;

    try {
      if (modal.value.tipo === 'baja') {
        const res = await $fetch<{ success: boolean; mensaje: string; data: Producto }>(
          `/api/productos/${id}`,
          { method: 'DELETE' }
        );
        if (res && res.success) {
          listMessage.value = res.mensaje;
          const prod = productos.value.find((p) => p.id_producto === id);
          if (prod) {
            prod.estado = false;
          }
        }
      } else {
        const res = await $fetch<{ success: boolean; mensaje: string; data: Producto }>(
          `/api/productos/${id}/reactivar`,
          { method: 'PATCH' }
        );
        if (res && res.success) {
          listMessage.value = res.mensaje;
          const prod = productos.value.find((p) => p.id_producto === id);
          if (prod) {
            prod.estado = true;
          }
        }
      }
      cerrarModal(true);
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

  // Actualizar un producto en el estado local tras edición
  const actualizarProductoLocal = (productoActualizado: Producto) => {
    const index = productos.value.findIndex(
      (p) => p.id_producto === productoActualizado.id_producto
    );
    if (index !== -1) {
      productos.value[index] = productoActualizado;
    }
  };

  // Ciclo de vida y Supabase Realtime (RF-05)
  onMounted(() => {
    fetchProductos();

    // Suscripción en tiempo real a la tabla 'producto' (RF-05)
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
          }
        )
        .subscribe();
    }
  });

  onUnmounted(() => {
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
    modal,
    conteos,
    productosFiltrados,
    cambiarFiltro,
    fetchProductos,
    abrirModalConfirmacion,
    cerrarModal,
    ejecutarAccionModal,
    actualizarProductoLocal,
  };
}
