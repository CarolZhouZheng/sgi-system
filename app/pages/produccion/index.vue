<template>
  <main class="min-h-screen bg-[#FDF8F3] px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <header>
        <h1 class="text-3xl font-bold font-serif text-[#3D1F0A]">Gestión de Producción</h1>
        <p class="mt-1 text-sm text-[#3D1F0A]/70">
          Control y seguimiento en tiempo real de las órdenes de horneado y panadería (RF-20).
        </p>
      </header>

      <!-- Componente Principal de la Cola de Producción en Tiempo Real -->
      <ColaProduccion />
    </div>
  </main>
</template>

<script setup lang="ts">
import ColaProduccion from '~/components/produccion/ColaProduccion.vue'

useHead({
  title: 'Cola de Producción | La Nueva Victoria',
})
</script>
