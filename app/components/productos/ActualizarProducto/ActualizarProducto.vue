<template>
  <div
    v-if="edicion.abierto"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
    @click.self="cerrarModalEdicion"
  >
    <div class="w-full max-w-lg rounded-[14px] border border-[#E8D5BC] bg-white p-6 shadow-2xl">
      <!-- Encabezado del Modal con estilo del prototipo -->
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-[#E8D5BC]">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#FAEEDA] text-[#854F0B] border border-[#E8D5BC]">
              RF-03
            </span>
            <h3 class="font-serif text-lg font-bold text-[#1A0A00]">
              Actualizar Producto #{{ edicion.id }}
            </h3>
          </div>
          <p class="text-xs text-[#7A5A3A]">
            Modifique los datos necesarios y guarde los cambios.
          </p>
        </div>

        <button
          type="button"
          class="rounded-md p-1.5 text-[#7A5A3A] hover:bg-[#FDF0E6] hover:text-[#1A0A00] transition"
          :disabled="edicion.guardando"
          @click="cerrarModalEdicion"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Alertas de error -->
      <div
        v-if="edicion.error"
        class="mb-4 rounded-[8px] border border-[#F7C1C1] bg-[#FCEBEB] px-4 py-2.5 text-xs text-[#A32D2D] flex items-center gap-2"
      >
        <span class="font-bold">✕</span>
        <span>{{ edicion.error }}</span>
      </div>

      <!-- Errores de validación -->
      <div
        v-if="edicion.validationErrors.length > 0"
        class="mb-4 rounded-[8px] border border-[#E8D5BC] bg-[#FAEEDA] p-3 text-xs text-[#854F0B]"
      >
        <p class="font-bold mb-1 uppercase tracking-wide">
          Por favor revise los siguientes campos:
        </p>
        <ul class="list-disc pl-4 space-y-0.5">
          <li v-for="(err, idx) in edicion.validationErrors" :key="idx">
            <strong>{{ err.campo }}:</strong> {{ err.mensaje }}
          </li>
        </ul>
      </div>

      <!-- Formulario de Edición -->
      <form class="space-y-4" @submit.prevent="guardarEdicion">
        <!-- Nombre -->
        <div>
          <label
            for="edit_nombre"
            class="block text-xs font-bold text-[#7A5A3A] mb-1 uppercase tracking-wide"
          >
            Nombre del producto <span class="text-[#A32D2D]">*</span>
          </label>
          <input
            id="edit_nombre"
            v-model="edicion.form.nombre"
            type="text"
            maxlength="150"
            required
            class="w-full rounded-[8px] border border-[#E8D5BC] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#1A0A00] outline-none transition focus:border-[#C4620A] focus:bg-white"
          />
        </div>

        <!-- Descripción -->
        <div>
          <label
            for="edit_descripcion"
            class="block text-xs font-bold text-[#7A5A3A] mb-1 uppercase tracking-wide"
          >
            Descripción
          </label>
          <textarea
            id="edit_descripcion"
            v-model="edicion.form.descripcion"
            rows="2"
            class="w-full rounded-[8px] border border-[#E8D5BC] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#1A0A00] outline-none transition focus:border-[#C4620A] focus:bg-white resize-none"
          ></textarea>
        </div>

        <!-- Categoría y Unidad -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              for="edit_categoria"
              class="block text-xs font-bold text-[#7A5A3A] mb-1 uppercase tracking-wide"
            >
              Categoría
            </label>
            <input
              id="edit_categoria"
              v-model="edicion.form.categoria"
              type="text"
              maxlength="100"
              class="w-full rounded-[8px] border border-[#E8D5BC] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#1A0A00] outline-none transition focus:border-[#C4620A] focus:bg-white"
            />
          </div>

          <div>
            <label
              for="edit_unidad_medida"
              class="block text-xs font-bold text-[#7A5A3A] mb-1 uppercase tracking-wide"
            >
              Unidad de medida <span class="text-[#A32D2D]">*</span>
            </label>
            <input
              id="edit_unidad_medida"
              v-model="edicion.form.unidad_medida"
              type="text"
              maxlength="30"
              required
              class="w-full rounded-[8px] border border-[#E8D5BC] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#1A0A00] outline-none transition focus:border-[#C4620A] focus:bg-white"
            />
          </div>
        </div>

        <!-- Stock Actual y Mínimo -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              for="edit_stock_actual"
              class="block text-xs font-bold text-[#7A5A3A] mb-1 uppercase tracking-wide"
            >
              Stock actual
            </label>
            <input
              id="edit_stock_actual"
              v-model.number="edicion.form.stock_actual"
              type="number"
              min="0"
              step="any"
              class="w-full rounded-[8px] border border-[#E8D5BC] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#1A0A00] outline-none transition focus:border-[#C4620A] focus:bg-white"
            />
          </div>

          <div>
            <label
              for="edit_stock_minimo"
              class="block text-xs font-bold text-[#7A5A3A] mb-1 uppercase tracking-wide"
            >
              Stock mínimo
            </label>
            <input
              id="edit_stock_minimo"
              v-model.number="edicion.form.stock_minimo"
              type="number"
              min="0"
              step="any"
              class="w-full rounded-[8px] border border-[#E8D5BC] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#1A0A00] outline-none transition focus:border-[#C4620A] focus:bg-white"
            />
          </div>

          <div>
            <label
              for="edit_fecha_vencimiento"
              class="block text-xs font-bold text-[#7A5A3A] mb-1 uppercase tracking-wide"
            >
              Fecha de vencimiento
            </label>
            <input
              id="edit_fecha_vencimiento"
              v-model="edicion.form.fecha_vencimiento"
              type="date"
              :required="!!edicion.original?.fecha_vencimiento"
              class="w-full rounded-[8px] border border-[#E8D5BC] bg-[#FAFAFA] px-3.5 py-2 text-xs text-[#1A0A00] outline-none transition focus:border-[#C4620A] focus:bg-white"
            />
            <p class="mt-1 text-[0.65rem] text-[#7A5A3A]">
              {{ edicion.original?.fecha_vencimiento ? 'Se puede cambiar, pero no quitar.' : 'Opcional: el producto no tiene fecha registrada.' }}
            </p>
          </div>
        </div>

        <!-- Acciones del Modal -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-[#E8D5BC]">
          <button
            type="button"
            class="rounded-[7px] border border-[#E8D5BC] bg-white px-4 py-2 text-xs font-semibold text-[#7A5A3A] hover:bg-[#FDF0E6] hover:text-[#1A0A00] transition"
            :disabled="edicion.guardando"
            @click="cerrarModalEdicion"
          >
            Cancelar
          </button>

          <button
            type="submit"
            :disabled="edicion.guardando || !hayCambios"
            class="rounded-[7px] bg-[#C4620A] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#A0500A] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            <span v-if="edicion.guardando">Guardando...</span>
            <span v-else>Guardar Cambios</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useActualizarProducto } from './ActualizarProducto';
import type { Producto } from '../ListadoProductos/ListadoProductos';

const emit = defineEmits<{
  (e: 'producto-actualizado', producto: Producto): void;
}>();

const {
  edicion,
  hayCambios,
  abrirModalEdicion,
  cerrarModalEdicion,
  guardarEdicion,
} = useActualizarProducto((productoActualizado) => {
  emit('producto-actualizado', productoActualizado);
});

defineExpose({
  abrirModalEdicion,
  cerrarModalEdicion,
});
</script>
