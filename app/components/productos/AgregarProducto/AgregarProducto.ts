// ===== INICIO DE MI IMPLEMENTACIÓN - RF-01 =====
// Este archivo es el composable (la lógica del formulario) para registrar un producto nuevo.
// CONEXIÓN: Se conecta con AgregarProducto.vue para manejar los campos y con el endpoint POST /api/productos mediante $fetch.
import { ref } from 'vue';

// Estructura de los datos que el usuario escribe en las cajas del formulario
export interface FormState {
  nombre: string;
  descripcion: string;
  categoria: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  fecha_vencimiento: string;
  estado: boolean;
}

// Estructura para mostrar errores específicos de cada campo
export interface ValidationError {
  campo: string;
  mensaje: string;
}

// Valores iniciales limpios con los que empieza el formulario
export const initialFormState: FormState = {
  nombre: '',
  descripcion: '',
  categoria: '',
  unidad_medida: '',
  stock_actual: 0,
  stock_minimo: 0,
  fecha_vencimiento: '',
  estado: true,
};

// Función principal que usa AgregarProducto.vue. Recibe "onSuccess" para avisar cuando el producto se guarde.
export function useAgregarProducto(onSuccess?: () => void) {
  // Estado reactivo del formulario
  const form = ref<FormState>({ ...initialFormState });

  // Estado de envío (sirve para bloquear el botón mientras se guarda y evitar doble clic)
  const isSubmitting = ref(false);

  // Mensajes informativos de éxito o error general
  const successMessage = ref<string | null>(null);
  const errorMessage = ref<string | null>(null);

  // Lista de errores de validación por campo
  const validationErrors = ref<ValidationError[]>([]);

  // Limpiar campos y alertas cuando el usuario presiona el botón "Limpiar"
  const resetForm = () => {
    form.value = { ...initialFormState };
    errorMessage.value = null;
    validationErrors.value = [];
  };

  // Este método recibe los datos del formulario y los envía al backend (RF-01).
  // Primero verifica que los campos obligatorios tengan información real y no solo espacios.
  // Después realiza una petición con $fetch para registrar el producto.
  const submitForm = async () => {
    isSubmitting.value = true;
    errorMessage.value = null;
    successMessage.value = null;
    validationErrors.value = [];

    const errores: ValidationError[] = [];

    // Revisa en el navegador que el nombre no esté vacío ni tenga solo espacios en blanco
    if (!form.value.nombre.trim()) {
      errores.push({
        campo: 'nombre',
        mensaje: 'El nombre es obligatorio y no puede estar compuesto solo por espacios en blanco',
      });
    }

    // Revisa en el navegador que la unidad de medida no esté vacía ni tenga solo espacios en blanco
    if (!form.value.unidad_medida.trim()) {
      errores.push({
        campo: 'unidad_medida',
        mensaje: 'La unidad de medida es obligatoria y no puede estar compuesta solo por espacios en blanco',
      });
    }

    const fechaVenc = form.value.fecha_vencimiento.trim();
    if (fechaVenc) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaVenc)) {
        errores.push({
          campo: 'fecha_vencimiento',
          mensaje: 'La fecha de vencimiento debe tener el formato YYYY-MM-DD',
        });
      } else {
        const partes = fechaVenc.split('-').map(Number);
        const year = partes[0] ?? 0;
        const month = partes[1] ?? 0;
        const day = partes[2] ?? 0;
        const date = new Date(Date.UTC(year, month - 1, day));
        const esValida =
          date.getUTCFullYear() === year &&
          date.getUTCMonth() === month - 1 &&
          date.getUTCDate() === day;

        if (!esValida) {
          errores.push({
            campo: 'fecha_vencimiento',
            mensaje: 'La fecha de vencimiento no es una fecha válida',
          });
        }
      }
    }

    // Si faltan datos obligatorios, muestra los errores en pantalla y detiene el envío
    if (errores.length > 0) {
      validationErrors.value = errores;
      isSubmitting.value = false;
      return;
    }

    try {
      // Prepara el paquete de datos limpios que se enviará al servidor
      const payload = {
        nombre: form.value.nombre.trim(),
        descripcion: form.value.descripcion.trim() || undefined,
        categoria: form.value.categoria.trim() || undefined,
        unidad_medida: form.value.unidad_medida.trim(),
        stock_actual: Number(form.value.stock_actual) || 0,
        stock_minimo: Number(form.value.stock_minimo) || 0,
        fecha_vencimiento: fechaVenc || undefined,
        estado: Boolean(form.value.estado),
      };

      // CONEXIÓN CON EL BACKEND: Envía los datos mediante $fetch al endpoint server/api/productos/index.post.ts
      const response = await $fetch<{
        success: boolean;
        mensaje: string;
        data: unknown;
      }>('/api/productos', {
        method: 'POST',
        body: payload,
      });

      // RESPUESTA DEL BACKEND: Si el servidor creó el producto, muestra mensaje de éxito, limpia el formulario y avisa a la vista
      if (response && response.success) {
        successMessage.value = response.mensaje || 'Producto registrado exitosamente';
        form.value = { ...initialFormState };
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      // Si el backend devolvió errores de validación (Error 400), los guarda en validationErrors para mostrarlos en lista
      if (err.data?.data && Array.isArray(err.data.data)) {
        validationErrors.value = err.data.data;
      } else {
        errorMessage.value =
          err.data?.message ||
          err.message ||
          'Error inesperado al registrar el producto';
      }
    } finally {
      // Vuelve a activar el botón al terminar el proceso
      isSubmitting.value = false;
    }
  };

  // Devuelve las variables y funciones para que AgregarProducto.vue las pueda usar
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
// ===== FIN DE MI IMPLEMENTACIÓN - RF-01 =====
