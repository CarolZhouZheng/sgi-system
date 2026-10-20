<script setup lang="ts">
import ReporteMovimientos from '~/components/reportes/ReporteMovimientos/ReporteMovimientos.vue'
</script>

<template>
  <div class="space-y-6">
    <div class="print:hidden">
      <h1 class="text-2xl font-semibold text-gray-800">
        Reporte de movimientos
      </h1>

      <p class="mt-1 text-sm text-gray-500">
        Consulta las entradas y salidas del inventario por fecha, producto y tipo de movimiento.
      </p>
    </div>

    <!-- RF-08: Reporte de movimientos -->
    <ReporteMovimientos />
  </div>
</template>
