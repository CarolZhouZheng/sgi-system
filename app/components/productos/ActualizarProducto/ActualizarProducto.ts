import { ref, computed } from 'vue';
import type { Producto } from '../ListadoProductos/ListadoProductos';

export interface EdicionForm {
  nombre: string;
  descripcion: string;
  categoria: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
}

export interface ValidationError {
  campo: string;
  mensaje: string;
}

export function useActualizarProducto(onSuccess?: (producto: Producto) => void) {
  const edicion = ref<{
    abierto: boolean;
    id: number | null;
    original: EdicionForm | null;
    form: EdicionForm;
    guardando: boolean;
    error: string | null;
    validationErrors: ValidationError[];
  }>({
    abierto: false,
    id: null,
    original: null,
    form: {
      nombre: '',
      descripcion: '',
      categoria: '',
      unidad_medida: '',
      stock_actual: 0,
      stock_minimo: 0,
    },
    guardando: false,
    error: null,
    validationErrors: [],
  });

  const normalizarEdicion = (f: EdicionForm) => ({
    nombre: f.nombre.trim(),
    descripcion: f.descripcion.trim() || null,
    categoria: f.categoria.trim() || null,
    unidad_medida: f.unidad_medida.trim(),
    stock_actual: Number(f.stock_actual) || 0,
    stock_minimo: Number(f.stock_minimo) || 0,
  });

  // Solo se envían los campos que realmente cambiaron respecto al original
  const cambiosEdicion = computed(() => {
    if (!edicion.value.original) return {};
    const actual = normalizarEdicion(edicion.value.form);
    const original = normalizarEdicion(edicion.value.original);
    return Object.fromEntries(
      Object.entries(actual).filter(
        ([campo, valor]) => valor !== original[campo as keyof typeof original]
      )
    );
  });

  const hayCambios = computed(() => Object.keys(cambiosEdicion.value).length > 0);

  const abrirModalEdicion = (producto: Producto) => {
    const datos: EdicionForm = {
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? '',
      categoria: producto.categoria ?? '',
      unidad_medida: producto.unidad_medida,
      stock_actual: Number(producto.stock_actual),
      stock_minimo: Number(producto.stock_minimo),
    };
    edicion.value = {
      abierto: true,
      id: producto.id_producto,
      original: { ...datos },
      form: { ...datos },
      guardando: false,
      error: null,
      validationErrors: [],
    };
  };

  const cerrarModalEdicion = (forzar: boolean = false) => {
    if (!forzar && edicion.value.guardando) return;
    edicion.value.abierto = false;
    edicion.value.id = null;
    edicion.value.original = null;
    edicion.value.error = null;
    edicion.value.validationErrors = [];
  };

  const guardarEdicion = async () => {
    const id = edicion.value.id;
    if (id === null || !hayCambios.value) return;

    edicion.value.guardando = true;
    edicion.value.error = null;
    edicion.value.validationErrors = [];

    try {
      const res = await $fetch<{ success: boolean; mensaje: string; data: Producto }>(
        `/api/productos/${id}`,
        { method: 'PUT', body: cambiosEdicion.value }
      );
      if (res && res.success) {
        if (onSuccess) {
          onSuccess(res.data);
        }
        cerrarModalEdicion(true);
      }
    } catch (err: any) {
      if (err.data?.data && Array.isArray(err.data.data)) {
        edicion.value.validationErrors = err.data.data;
      } else {
        edicion.value.error =
          err.data?.statusMessage ||
          err.data?.message ||
          err.message ||
          'Error inesperado al actualizar el producto';
      }
    } finally {
      edicion.value.guardando = false;
    }
  };

  return {
    edicion,
    cambiosEdicion,
    hayCambios,
    abrirModalEdicion,
    cerrarModalEdicion,
    guardarEdicion,
  };
}
