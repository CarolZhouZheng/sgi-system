<script setup lang="ts">
import RegistrarPerdida from '~/components/perdida/RegistrarPerdida/RegistrarPerdida.vue'
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-gray-800">
        Pérdidas
      </h1>

      <p class="mt-1 text-sm text-gray-500">
        Registra las pérdidas de productos del inventario.
      </p>
    </div>

    <RegistrarPerdida />
  </div>
</template>