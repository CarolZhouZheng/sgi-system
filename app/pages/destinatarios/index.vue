<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto space-y-8">
      
      <!-- Cabecera -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">Gestión de Destinatarios</h1>
          <p class="mt-2 text-sm text-gray-500">Administra los clientes, sucursales y puntos de entrega de la panadería.</p>
        </div>
      </div>

      <!-- Componente de Agregar -->
      <AgregarDestinatario @destinatario-registrado="actualizarLista" />

      <!-- Componente de Listado -->
      <ListadoDestinatarios ref="listaRef" />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AgregarDestinatario from '~/components/destinatarios/AgregarDestinatario.vue'
import ListadoDestinatarios from '~/components/destinatarios/ListadoDestinatarios.vue'

const listaRef = ref()

const actualizarLista = () => {
  if (listaRef.value) {
    listaRef.value.cargarDestinatarios()
  }
}
</script>
