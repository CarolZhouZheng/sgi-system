<template>
  <!-- ===== INICIO DE MI IMPLEMENTACIÓN - RF-01 ===== -->
  <!-- Este componente muestra el formulario visual para registrar un producto consumible. -->
  <!-- CONEXIÓN: Se conecta con AgregarProducto.ts para manejar los datos y con app/pages/productos/index.vue para avisar cuando se crea un producto. -->
  <section class="bg-white border border-[#E8D5BC] rounded-[10px] p-6 shadow-xs">
    <!-- Encabezado con estilo del prototipo -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-6 border-b border-[#E8D5BC] gap-2">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#FAEEDA] text-[#854F0B] border border-[#E8D5BC]">
            RF-01
          </span>
          <h2 class="text-xl font-bold font-serif text-[#1A0A00]">
            Registro de Producto
          </h2>
        </div>
        <p class="text-xs text-[#7A5A3A]">
          Registra un nuevo producto consumible en el inventario del sistema.
        </p>
      </div>
    </div>

    <!-- Mensaje de éxito (aparece cuando el backend confirma que el producto fue creado) -->
    <div
      v-if="successMessage"
      class="mb-5 rounded-[8px] border border-[#C0DD97] bg-[#EAF3DE] px-4 py-3 text-sm text-[#3B6D11] flex items-center gap-2"
    >
      <span class="font-bold">✓</span>
      <span>{{ successMessage }}</span>
    </div>

    <!-- Mensaje de error general -->
    <div
      v-if="errorMessage"
      class="mb-5 rounded-[8px] border border-[#F7C1C1] bg-[#FCEBEB] px-4 py-3 text-sm text-[#A32D2D] flex items-center gap-2"
    >
      <span class="font-bold">✕</span>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Errores de validación por campo (del frontend o devueltos por el backend) -->
    <div
      v-if="validationErrors.length > 0"
      class="mb-5 rounded-[8px] border border-[#E8D5BC] bg-[#FAEEDA] p-4 text-[#854F0B]"
    >
      <p class="mb-2 text-xs font-bold uppercase tracking-wider">
        Por favor revise los siguientes campos:
      </p>
      <ul class="list-disc space-y-1 pl-5 text-sm">
        <li
          v-for="error in validationErrors"
          :key="`${error.campo}-${error.mensaje}`"
        >
          <strong>{{ error.campo }}:</strong> {{ error.mensaje }}
        </li>
      </ul>
    </div>

    <!-- Formulario de Registro: al enviarse ejecuta handleSubmit sin recargar la página (@submit.prevent) -->
    <form
      class="space-y-5"
      @submit.prevent="handleSubmit"
    >
      <!-- Fila 1: Nombre y Categoría -->
      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <!-- Nombre -->
        <div>
          <label
            for="nombre"
            class="block text-xs font-bold text-[#7A5A3A] mb-1.5 uppercase tracking-wide"
          >
            Nombre del producto <span class="text-[#A32D2D]">*</span>
          </label>
          <input
            id="nombre"
            v-model="form.nombre"
            type="text"
            maxlength="150"
            required
            placeholder="Ej. Pan de muerto, Harina de trigo"
            class="w-full rounded-[8px] border border-[#E8D5BC] bg-[#FAFAFA] px-3.5 py-2 text-sm text-[#1A0A00] placeholder-[#7A5A3A]/50 outline-none transition focus:border-[#C4620A] focus:bg-white"
          />
        </div>

        <!-- Categoría -->
        <div>
          <label
            for="categoria"
            class="block text-xs font-bold text-[#7A5A3A] mb-1.5 uppercase tracking-wide"
          >
            Categoría
          </label>
          <input
            id="categoria"
            v-model="form.categoria"
            type="text"
            maxlength="100"
            placeholder="Ej. Panadería, Repostería, Materia prima"
            class="w-full rounded-[8px] border border-[#E8D5BC] bg-[#FAFAFA] px-3.5 py-2 text-sm text-[#1A0A00] placeholder-[#7A5A3A]/50 outline-none transition focus:border-[#C4620A] focus:bg-white"
          />
        </div>
      </div>

      <!-- Fila 2: Unidad de Medida, Stock Actual, Stock Mínimo y Fecha de Vencimiento -->
      <div class="grid grid-cols-1 gap-5 md:grid-cols-4">
        <!-- Unidad de medida -->
        <div>
          <label
            for="unidad_medida"
            class="block text-xs font-bold text-[#7A5A3A] mb-1.5 uppercase tracking-wide"
          >
            Unidad de medida <span class="text-[#A32D2D]">*</span>
          </label>
          <input
            id="unidad_medida"
            v-model="form.unidad_medida"
            type="text"
            maxlength="30"
            required
            placeholder="Ej. kg, unidad, pieza, litro"
            class="w-full rounded-[8px] border border-[#E8D5BC] bg-[#FAFAFA] px-3.5 py-2 text-sm text-[#1A0A00] placeholder-[#7A5A3A]/50 outline-none transition focus:border-[#C4620A] focus:bg-white"
          />
        </div>

        <!-- Stock actual -->
        <div>
          <label
            for="stock_actual"
            class="block text-xs font-bold text-[#7A5A3A] mb-1.5 uppercase tracking-wide"
          >
            Stock actual
          </label>
          <input
            id="stock_actual"
            v-model.number="form.stock_actual"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            class="w-full rounded-[8px] border border-[#E8D5BC] bg-[#FAFAFA] px-3.5 py-2 text-sm text-[#1A0A00] placeholder-[#7A5A3A]/50 outline-none transition focus:border-[#C4620A] focus:bg-white"
          />
        </div>

        <!-- Stock mínimo -->
        <div>
          <label
            for="stock_minimo"
            class="block text-xs font-bold text-[#7A5A3A] mb-1.5 uppercase tracking-wide"
          >
            Stock mínimo
          </label>
          <input
            id="stock_minimo"
            v-model.number="form.stock_minimo"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            class="w-full rounded-[8px] border border-[#E8D5BC] bg-[#FAFAFA] px-3.5 py-2 text-sm text-[#1A0A00] placeholder-[#7A5A3A]/50 outline-none transition focus:border-[#C4620A] focus:bg-white"
          />
        </div>

        <!-- Fecha de vencimiento -->
        <div>
          <label
            for="fecha_vencimiento"
            class="block text-xs font-bold text-[#7A5A3A] mb-1.5 uppercase tracking-wide"
          >
            Fecha de vencimiento
          </label>
          <input
            id="fecha_vencimiento"
            v-model="form.fecha_vencimiento"
            type="date"
            class="w-full rounded-[8px] border border-[#E8D5BC] bg-[#FAFAFA] px-3.5 py-2 text-sm text-[#1A0A00] placeholder-[#7A5A3A]/50 outline-none transition focus:border-[#C4620A] focus:bg-white"
          />
        </div>
      </div>

      <!-- Fila 3: Descripción -->
      <div>
        <label
          for="descripcion"
          class="block text-xs font-bold text-[#7A5A3A] mb-1.5 uppercase tracking-wide"
        >
          Descripción
        </label>
        <textarea
          id="descripcion"
          v-model="form.descripcion"
          rows="2"
          placeholder="Breve descripción o notas adicionales sobre el producto..."
          class="w-full rounded-[8px] border border-[#E8D5BC] bg-[#FAFAFA] px-3.5 py-2 text-sm text-[#1A0A00] placeholder-[#7A5A3A]/50 outline-none transition focus:border-[#C4620A] focus:bg-white resize-none"
        ></textarea>
      </div>

      <!-- Fila 4: Estado activo -->
      <div class="flex items-center gap-2.5 pt-1">
        <input
          id="estado"
          v-model="form.estado"
          type="checkbox"
          class="h-4 w-4 rounded border-[#E8D5BC] text-[#C4620A] focus:ring-[#C4620A] accent-[#C4620A]"
        />
        <label
          for="estado"
          class="text-xs font-semibold text-[#1A0A00] select-none cursor-pointer"
        >
          Producto activo al registrar
        </label>
      </div>

      <!-- Botones de Acción -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#E8D5BC]">
        <!-- Botón para vaciar las cajas del formulario -->
        <button
          type="button"
          class="rounded-[7px] border border-[#E8D5BC] bg-white px-4 py-2 text-xs font-semibold text-[#7A5A3A] hover:bg-[#FDF0E6] hover:text-[#C4620A] hover:border-[#C4620A] transition"
          :disabled="isSubmitting"
          @click="resetForm"
        >
          Limpiar
        </button>

        <!-- Botón que dispara el envío del formulario hacia AgregarProducto.ts -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="rounded-[7px] bg-[#C4620A] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#A0500A] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center gap-2"
        >
          <span v-if="isSubmitting">Registrando...</span>
          <span v-else>Registrar producto</span>
        </button>
      </div>
    </form>
  </section>
  <!-- ===== FIN DE MI IMPLEMENTACIÓN - RF-01 ===== -->
</template>

<script setup lang="ts">
// ===== INICIO DE MI IMPLEMENTACIÓN - RF-01 =====
// CONEXIÓN CON EL COMPOSABLE: Importa la lógica y las variables del formulario desde AgregarProducto.ts
import { useAgregarProducto } from './AgregarProducto';

// Define el aviso 'producto-creado' para comunicarle a la página padre (app/pages/productos/index.vue) que recargue la tabla
const emit = defineEmits<{
  (e: 'producto-creado'): void;
}>();

// Obtiene las variables y funciones del composable; cuando el producto se guarda, emite 'producto-creado'
const {
  form,
  isSubmitting,
  successMessage,
  errorMessage,
  validationErrors,
  resetForm,
  submitForm,
} = useAgregarProducto(() => {
  emit('producto-creado');
});

// Función que se ejecuta al presionar "Registrar producto" y llama a submitForm() en AgregarProducto.ts
const handleSubmit = async () => {
  await submitForm();
};
// ===== FIN DE MI IMPLEMENTACIÓN - RF-01 =====
</script>
