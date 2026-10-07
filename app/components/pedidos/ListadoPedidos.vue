<template>
  <section class="overflow-hidden rounded-lg bg-white shadow-sm">
    <div class="flex items-center justify-between border-b px-5 py-4">
      <h2 class="text-xl font-semibold text-gray-900">Pedidos registrados</h2>
      <button
        type="button"
        :disabled="cargando"
        class="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
        @click="cargarPedidos"
      >
        Actualizar
      </button>
    </div>

    <p v-if="mensajeError" role="alert" class="p-5 text-sm text-red-700">
      {{ mensajeError }}
    </p>
    <p v-else-if="cargando" class="p-5 text-sm text-gray-600">
      Cargando pedidos...
    </p>
    <p v-else-if="pedidos.length === 0" class="p-5 text-sm text-gray-600">
      Todavía no hay pedidos registrados.
    </p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[760px] text-left text-sm">
        <thead class="bg-gray-50 text-xs uppercase text-gray-600">
          <tr>
            <th class="px-4 py-3">Pedido</th>
            <th class="px-4 py-3">Destinatario</th>
            <th class="px-4 py-3">Registro</th>
            <th class="px-4 py-3">Entrega</th>
            <th class="px-4 py-3">Prioridad / estado</th>
            <th class="px-4 py-3">Productos</th>
            <th class="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="pedido in pedidos" :key="pedido.id_pedido" class="align-top">
            <td class="px-4 py-4 font-medium">#{{ pedido.id_pedido }}</td>
            <td class="px-4 py-4">
              {{ pedido.destinatario?.nombre_empresa || 'No disponible' }}
            </td>
            <td class="px-4 py-4">{{ pedido.fecha_registro.slice(0, 10) }}</td>
            <td class="px-4 py-4">{{ pedido.fecha_entrega || 'Sin definir' }}</td>
            <td class="px-4 py-4">
              {{ pedido.prioridad }}
              <span class="mt-1 block text-xs">{{ pedido.estado }}</span>
            </td>
            <td class="px-4 py-4">
              <ul>
                <li v-for="detalle in pedido.detalle_pedido" :key="detalle.id_detalle_pedido">
                  {{ detalle.producto?.nombre || `Producto ${detalle.id_producto}` }}:
                  {{ detalle.cantidad }} {{ detalle.producto?.unidad_medida || '' }}
                </li>
              </ul>
            </td>
            <td class="px-4 py-4 text-right">
              <button
                v-if="pedido.estado === 'PENDIENTE' || pedido.estado === 'EN_PROCESO'"
                type="button"
                :disabled="guardando === pedido.id_pedido"
                class="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                @click="completarPedido(pedido.id_pedido)"
              >
                {{ guardando === pedido.id_pedido ? 'Procesando...' : 'Completar' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { PedidoListado } from '../../../server/models/pedido.model'

const pedidos = ref<PedidoListado[]>([])
const cargando = ref(true)
const guardando = ref<number | null>(null)
const mensajeError = ref('')

const cargarPedidos = async () => {
  cargando.value = true
  mensajeError.value = ''

  try {
    const respuesta = await $fetch<{ success: boolean; data: PedidoListado[] }>(
      '/api/pedidos',
    )
    pedidos.value = respuesta.data
  } catch (error: any) {
    mensajeError.value = error.data?.statusMessage || 'No se pudieron cargar los pedidos.'
  } finally {
    cargando.value = false
  }
}

const completarPedido = async (id: number) => {
  guardando.value = id
  mensajeError.value = ''

  try {
    await $fetch(`/api/pedidos/${id}/estado`, {
      method: 'PATCH',
      body: { estado: 'COMPLETADO' }
    })
    
    // Actualizar el estado localmente para no recargar todo
    const pedido = pedidos.value.find(p => p.id_pedido === id)
    if (pedido) {
      pedido.estado = 'COMPLETADO'
    }
  } catch (error: any) {
    mensajeError.value = error.data?.statusMessage || 'No se pudo completar el pedido.'
  } finally {
    guardando.value = null
  }
}

defineExpose({ cargarPedidos })
onMounted(cargarPedidos)
</script>