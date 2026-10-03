<template>
  <div class="bg-white rounded-xl shadow-md overflow-hidden">
    <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
      <h2 class="text-xl font-bold text-gray-800">Listado de Destinatarios</h2>
      <button @click="cargarDestinatarios" class="text-amber-600 hover:text-amber-800 transition-colors p-2 rounded-full hover:bg-amber-50">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
    
    <div v-if="cargando" class="p-8 text-center text-gray-500">
      Cargando destinatarios...
    </div>
    
    <div v-else-if="destinatarios.length === 0" class="p-8 text-center text-gray-500">
      No hay destinatarios registrados aún.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
            <th class="p-4 font-semibold border-b">Empresa</th>
            <th class="p-4 font-semibold border-b">Teléfono</th>
            <th class="p-4 font-semibold border-b">Correo</th>
            <th class="p-4 font-semibold border-b">Dirección</th>
            <th class="p-4 font-semibold border-b">Estado</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="dest in destinatarios" :key="dest.id_destinatario" class="hover:bg-gray-50 transition-colors">
            <td class="p-4 text-gray-800 font-medium">{{ dest.nombre_empresa }}</td>
            <td class="p-4 text-gray-600">{{ dest.telefono || '-' }}</td>
            <td class="p-4 text-gray-600">{{ dest.correo || '-' }}</td>
            <td class="p-4 text-gray-600">{{ dest.direccion || '-' }}</td>
            <td class="p-4">
              <span :class="dest.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-3 py-1 rounded-full text-xs font-bold">
                {{ dest.estado ? 'ACTIVO' : 'INACTIVO' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Destinatario } from '~/server/models/destinatario.model'

const destinatarios = ref<Destinatario[]>([])
const cargando = ref(true)

const cargarDestinatarios = async () => {
  cargando.value = true
  try {
    const response = await $fetch('/api/destinatarios')
    if (response.success) {
      destinatarios.value = response.data as Destinatario[]
    }
  } catch (error) {
    console.error('Error al cargar destinatarios:', error)
  } finally {
    cargando.value = false
  }
}

// Exponer el método para que el padre pueda llamarlo
defineExpose({ cargarDestinatarios })

onMounted(() => {
  cargarDestinatarios()
})
</script>
