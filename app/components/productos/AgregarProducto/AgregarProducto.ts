import { ref } from 'vue';

export interface FormState {
  nombre: string;
  descripcion: string;
  categoria: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  estado: boolean;
}

export interface ValidationError {
  campo: string;
  mensaje: string;
}

export const initialFormState: FormState = {
  nombre: '',
  descripcion: '',
  categoria: '',
  unidad_medida: '',
  stock_actual: 0,
  stock_minimo: 0,
  estado: true,
};

export function useAgregarProducto(onSuccess?: () => void) {
  // Estado reactivo del formulario
  const form = ref<FormState>({ ...initialFormState });

  // Estado de envío
  const isSubmitting = ref(false);

  // Mensajes informativos
  const successMessage = ref<string | null>(null);
  const errorMessage = ref<string | null>(null);

  // Errores de validación devueltos por el backend
  const validationErrors = ref<ValidationError[]>([]);

  // Limpiar campos y alertas
  const resetForm = () => {
    form.value = { ...initialFormState };
    errorMessage.value = null;
    validationErrors.value = [];
  };

  // Enviar formulario (RF-01)
  const submitForm = async () => {
    isSubmitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;
    validationErrors.value = [];

    try {
      const payload = {
        nombre: form.value.nombre.trim(),
        descripcion: form.value.descripcion.trim() || undefined,
        categoria: form.value.categoria.trim() || undefined,
        unidad_medida: form.value.unidad_medida.trim(),
        stock_actual: Number(form.value.stock_actual) || 0,
        stock_minimo: Number(form.value.stock_minimo) || 0,
        estado: Boolean(form.value.estado),
      };

      const response = await $fetch<{
        success: boolean;
        mensaje: string;
        data: unknown;
      }>('/api/productos', {
        method: 'POST',
        body: payload,
      });

      if (response && response.success) {
        successMessage.value = response.mensaje || 'Producto registrado exitosamente';
        form.value = { ...initialFormState };
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      if (err.data?.data && Array.isArray(err.data.data)) {
        validationErrors.value = err.data.data;
      } else {
        errorMessage.value =
          err.data?.message ||
          err.message ||
          'Error inesperado al registrar el producto';
      }
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    form,
    isSubmitting,
    successMessage,
    errorMessage,
    validationErrors,
    resetForm,
    submitForm,
  };
}
