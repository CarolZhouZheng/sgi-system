<script setup lang="ts">
import { useReporteMovimientos } from './ReporteMovimientos'

const {
  filtros,
  movimientos,
  resumen,
  tiposDisponibles,
  productos,
  cargando,
  mensajeError,
  formatearFecha,
  formatearNumero,
  generarReporte,
  limpiarFiltros,
  exportarCsv,
  imprimir,
} = useReporteMovimientos()

const claseDireccion = (direccion: string) =>
  direccion === 'ENTRADA'
    ? 'text-green-700'
    : direccion === 'SALIDA'
      ? 'text-red-700'
      : 'text-gray-500'
</script>

<template>
  <div class="space-y-6">
    <!-- Filtros -->
    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm print:hidden">
      <form
        class="grid grid-cols-1 gap-4 md:grid-cols-4"
        @submit.prevent="generarReporte"
      >
        <div>
          <label
            for="desde"
            class="mb-2 block text-sm font-medium text-gray-700"
          >
            Desde
          </label>
          <input
            id="desde"
            v-model="filtros.desde"
            type="date"
            :max="filtros.hasta || undefined"
            class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          >
        </div>

        <div>
          <label
            for="hasta"
            class="mb-2 block text-sm font-medium text-gray-700"
          >
            Hasta
          </label>
          <input
            id="hasta"
            v-model="filtros.hasta"
            type="date"
            :min="filtros.desde || undefined"
            class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          >
        </div>

        <div>
          <label
            for="producto"
            class="mb-2 block text-sm font-medium text-gray-700"
          >
            Producto
          </label>
          <select
            id="producto"
            v-model="filtros.id_producto"
            class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          >
            <option value="">
              Todos los productos
            </option>
            <option
              v-for="producto in productos"
              :key="producto.id_producto"
              :value="producto.id_producto"
            >
              {{ producto.nombre }}
            </option>
          </select>
        </div>

        <div>
          <label
            for="tipo"
            class="mb-2 block text-sm font-medium text-gray-700"
          >
            Tipo de movimiento
          </label>
          <select
            id="tipo"
            v-model="filtros.tipo"
            class="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          >
            <option value="">
              Todos los tipos
            </option>
            <option
              v-for="tipo in tiposDisponibles"
              :key="tipo"
              :value="tipo"
            >
              {{ tipo }}
            </option>
          </select>
        </div>

        <div class="flex flex-wrap gap-3 md:col-span-4">
          <button
            type="submit"
            :disabled="cargando"
            class="rounded-lg bg-[#C4620A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#A8530A] disabled:opacity-50"
          >
            {{ cargando ? 'Generando...' : 'Generar reporte' }}
          </button>

          <button
            type="button"
            :disabled="cargando"
            class="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            @click="limpiarFiltros"
          >
            Limpiar filtros
          </button>

          <div class="ml-auto flex gap-3">
            <button
              type="button"
              :disabled="!movimientos.length"
              class="rounded-lg border border-[#C4620A] px-5 py-2.5 text-sm font-medium text-[#C4620A] hover:bg-[#C4620A]/10 disabled:opacity-50"
              @click="exportarCsv"
            >
              Exportar CSV
            </button>

            <button
              type="button"
              :disabled="!movimientos.length"
              class="rounded-lg border border-gray-300 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              @click="imprimir"
            >
              Imprimir
            </button>
          </div>
        </div>
      </form>
    </div>

    <div
      v-if="mensajeError"
      role="alert"
      class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ mensajeError }}
    </div>

    <!-- Encabezado solo para la versión impresa -->
    <div class="hidden print:block">
      <h1 class="text-xl font-semibold">
        Reporte de movimientos de inventario
      </h1>
      <p class="text-sm">
        Período: {{ filtros.desde || 'inicio' }} al {{ filtros.hasta || 'hoy' }}
        <template v-if="filtros.tipo">
          · Tipo: {{ filtros.tipo }}
        </template>
      </p>
    </div>

    <!-- Resumen -->
    <div
      v-if="resumen"
      class="grid grid-cols-2 gap-4 md:grid-cols-4"
    >
      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-500">
          Movimientos
        </p>
        <p class="mt-1 text-2xl font-semibold text-gray-800">
          {{ resumen.total_movimientos }}
        </p>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-500">
          Entradas
        </p>
        <p class="mt-1 text-2xl font-semibold text-green-700">
          {{ resumen.total_entradas }}
        </p>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-500">
          Salidas
        </p>
        <p class="mt-1 text-2xl font-semibold text-red-700">
          {{ resumen.total_salidas }}
        </p>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p class="text-xs uppercase text-gray-500">
          Productos afectados
        </p>
        <p class="mt-1 text-2xl font-semibold text-gray-800">
          {{ resumen.productos_afectados }}
        </p>
      </div>
    </div>

    <p
      v-if="resumen?.truncado"
      class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      Se muestran los {{ resumen.total_movimientos }} movimientos más recientes. Reduce el rango de fechas para ver el resto.
    </p>

    <!-- Totales por producto -->
    <div
      v-if="resumen && resumen.por_producto.length"
      class="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      <h2 class="border-b px-5 py-3 text-sm font-semibold text-gray-800">
        Totales por producto
      </h2>
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50 text-xs uppercase text-gray-600">
          <tr>
            <th class="px-4 py-2">
              Producto
            </th>
            <th class="px-4 py-2 text-right">
              Entradas
            </th>
            <th class="px-4 py-2 text-right">
              Salidas
            </th>
            <th class="px-4 py-2 text-right">
              Neto
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="producto in resumen.por_producto"
            :key="producto.id_producto"
          >
            <td class="px-4 py-2">
              {{ producto.nombre_producto }}
            </td>
            <td class="px-4 py-2 text-right text-green-700">
              {{ formatearNumero(producto.entradas) }} {{ producto.unidad_medida }}
            </td>
            <td class="px-4 py-2 text-right text-red-700">
              {{ formatearNumero(producto.salidas) }} {{ producto.unidad_medida }}
            </td>
            <td class="px-4 py-2 text-right font-medium">
              {{ formatearNumero(producto.neto) }} {{ producto.unidad_medida }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detalle de movimientos -->
    <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <h2 class="border-b px-5 py-3 text-sm font-semibold text-gray-800">
        Detalle de movimientos
      </h2>

      <p
        v-if="cargando"
        class="p-5 text-sm text-gray-600"
      >
        Generando reporte...
      </p>

      <p
        v-else-if="!movimientos.length"
        class="p-5 text-sm text-gray-600"
      >
        No hay movimientos para los filtros seleccionados.
      </p>

      <table
        v-else
        class="w-full min-w-[900px] text-left text-sm"
      >
        <thead class="bg-gray-50 text-xs uppercase text-gray-600">
          <tr>
            <th class="px-4 py-2">
              Fecha
            </th>
            <th class="px-4 py-2">
              Tipo
            </th>
            <th class="px-4 py-2">
              Producto
            </th>
            <th class="px-4 py-2 text-right">
              Cantidad
            </th>
            <th class="px-4 py-2 text-right">
              Stock
            </th>
            <th class="px-4 py-2">
              Usuario
            </th>
            <th class="px-4 py-2">
              Origen / observaciones
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="movimiento in movimientos"
            :key="movimiento.id_movimiento"
            class="align-top"
          >
            <td class="whitespace-nowrap px-4 py-2">
              {{ formatearFecha(movimiento.fecha) }}
            </td>
            <td class="px-4 py-2 font-medium">
              {{ movimiento.tipo_movimiento }}
            </td>
            <td class="px-4 py-2">
              {{ movimiento.nombre_producto }}
            </td>
            <td
              class="whitespace-nowrap px-4 py-2 text-right"
              :class="claseDireccion(movimiento.direccion)"
            >
              {{ movimiento.variacion > 0 ? '+' : movimiento.variacion < 0 ? '−' : '' }}{{ formatearNumero(movimiento.cantidad) }}
              {{ movimiento.unidad_medida }}
            </td>
            <td class="whitespace-nowrap px-4 py-2 text-right text-gray-600">
              {{ formatearNumero(movimiento.stock_anterior) }} → {{ formatearNumero(movimiento.stock_nuevo) }}
            </td>
            <td class="px-4 py-2">
              {{ movimiento.usuario }}
            </td>
            <td class="px-4 py-2 text-gray-600">
              <span
                v-if="movimiento.origen"
                class="block text-xs font-medium text-gray-500"
              >{{ movimiento.origen }}</span>
              {{ movimiento.observaciones || '' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
