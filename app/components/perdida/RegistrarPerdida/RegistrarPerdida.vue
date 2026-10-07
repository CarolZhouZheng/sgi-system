<script setup lang="ts">
import { useRegistrarPerdida } from './RegistrarPerdida'

const emit = defineEmits<{
  (e: 'perdidaRegistrada'): void
}>()

const {
  form,
  productos,
  cargandoProductos,
  guardando,
  mensajeExito,
  mensajeError,
  productoSeleccionado,
  registrarPerdida,
} = useRegistrarPerdida()

async function guardar() {
  await registrarPerdida()

  if (mensajeExito.value) {
    emit('perdidaRegistrada')
  }
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-800">
        Registrar Pérdida
      </h2>

      <p class="mt-1 text-sm text-gray-500">
        Registra una pérdida de producto y descuenta automáticamente la cantidad del inventario.
      </p>
    </div>

    <div
      v-if="mensajeExito"
      class="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
    >
      {{ mensajeExito }}
    </div>

    <div
      v-if="mensajeError"
      class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ mensajeError }}
    </div>

    <form
      class="grid grid-cols-1 gap-5 md:grid-cols-2"
      @submit.prevent="guardar"
    >
      <!-- Producto -->
      <div>
        <label
          for="producto"
          class="mb-2 block text-sm font-medium text-gray-700"
        >
          Producto
        </label>

        <select
          id="producto"
          v-model="form.id_producto"
          :disabled="cargandoProductos || guardando"
          class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
        >
          <option value="">
            {{ cargandoProductos ? 'Cargando productos...' : 'Seleccione un producto' }}
          </option>

          <option
            v-for="producto in productos"
            :key="producto.id_producto"
            :value="producto.id_producto"
          >
            {{ producto.nombre }} — Stock: {{ producto.stock_actual }}
            {{ producto.unidad_medida }}
          </option>
        </select>
      </div>

      <!-- Stock disponible -->
      <div>
        <label class="mb-2 block text-sm font-medium text-gray-700">
          Stock disponible
        </label>

        <div
          class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700"
        >
          <template v-if="productoSeleccionado()">
            {{ productoSeleccionado()?.stock_actual }}
            {{ productoSeleccionado()?.unidad_medida }}
          </template>

          <template v-else>
            Seleccione un producto
          </template>
        </div>
      </div>

      <!-- Cantidad -->
      <div>
        <label
          for="cantidad"
          class="mb-2 block text-sm font-medium text-gray-700"
        >
          Cantidad
        </label>

        <input
          id="cantidad"
          v-model="form.cantidad"
          type="number"
          min="0.01"
          step="0.01"
          :disabled="guardando"
          placeholder="Ej. 5"
          class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
        />
      </div>

      <!-- Tipo -->
      <div>
        <label
          for="tipo"
          class="mb-2 block text-sm font-medium text-gray-700"
        >
          Tipo de pérdida
        </label>

        <select
          id="tipo"
          v-model="form.tipo_perdida"
          :disabled="guardando"
          class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
        >
          <option value="">
            Seleccione un tipo
          </option>

          <option value="VENCIMIENTO">
            Vencimiento
          </option>

          <option value="DAÑO">
            Daño
          </option>

          <option value="DESPERDICIO">
            Desperdicio
          </option>

          <option value="CONTAMINACION">
            Contaminación
          </option>

          <option value="OTRO">
            Otro
          </option>
        </select>
      </div>

      <!-- Motivo -->
      <div>
        <label
          for="motivo"
          class="mb-2 block text-sm font-medium text-gray-700"
        >
          Motivo
        </label>

        <input
          id="motivo"
          v-model="form.motivo"
          type="text"
          maxlength="150"
          :disabled="guardando"
          placeholder="Indique el motivo de la pérdida"
          class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
        />
      </div>

      <!-- Fecha -->
      <div>
        <label
          for="fecha"
          class="mb-2 block text-sm font-medium text-gray-700"
        >
          Fecha
        </label>

        <input
          id="fecha"
          v-model="form.fecha"
          type="date"
          :disabled="guardando"
          class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
        />
      </div>

      <!-- Observaciones -->
      <div class="md:col-span-2">
        <label
          for="observaciones"
          class="mb-2 block text-sm font-medium text-gray-700"
        >
          Observaciones
        </label>

        <textarea
          id="observaciones"
          v-model="form.observaciones"
          rows="3"
          :disabled="guardando"
          placeholder="Observaciones adicionales (opcional)"
          class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
        />
      </div>

      <!-- Botón -->
      <div class="flex justify-end md:col-span-2">
        <button
          type="submit"
          :disabled="guardando || cargandoProductos"
          class="rounded-lg bg-gray-800 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ guardando ? 'Registrando...' : 'Registrar Pérdida' }}
        </button>
      </div>
    </form>
  </div>
</template>