<template>
  <main class="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl space-y-8">
      <header>
        <h1 class="text-3xl font-bold text-gray-900">Gestión de pedidos</h1>
        <p class="mt-2 text-sm text-gray-600">
          Registra pedidos para destinatarios y consulta sus detalles.
        </p>
      </header>

      <RegistrarPedido @pedido-registrado="actualizarLista" />
      <ListadoPedidos ref="listaRef" />
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ListadoPedidos from '~/components/pedidos/ListadoPedidos.vue'
import RegistrarPedido from '~/components/pedidos/RegistrarPedido.vue'

const listaRef = ref<{ cargarPedidos: () => Promise<void> } | null>(null)

const actualizarLista = async () => {
  await listaRef.value?.cargarPedidos()
}
</script>