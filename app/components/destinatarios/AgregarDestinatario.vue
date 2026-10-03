<template>
  <div class="bg-white rounded-xl shadow-md p-6">
    <h2 class="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Registrar Nuevo Destinatario</h2>
    
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa *</label>
          <input 
            v-model="formulario.nombre_empresa" 
            type="text" 
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
            placeholder="Ej. Panadería El Trigo"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input 
            v-model="formulario.telefono" 
            type="text" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
            placeholder="Ej. 8888-8888"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
          <input 
            v-model="formulario.correo" 
            type="email" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
            placeholder="contacto@empresa.com"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input 
            v-model="formulario.direccion" 
            type="text" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
            placeholder="Dirección exacta"
          >
        </div>
      </div>

      <div v-if="mensajeError" class="text-red-500 text-sm mt-2 font-medium">
        {{ mensajeError }}
      </div>
      <div v-if="mensajeExito" class="text-green-600 text-sm mt-2 font-medium">
        {{ mensajeExito }}
      </div>

      <div class="flex justify-end pt-4">
        <button 
          type="submit" 
          :disabled="cargando"
          class="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center disabled:opacity-50"
        >
          <span v-if="cargando">Guardando...</span>
          <span v-else>Guardar Destinatario</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['destinatarioRegistrado'])

const formulario = ref({
  nombre_empresa: '',
  telefono: '',
  correo: '',
  direccion: ''
})

const cargando = ref(false)
const mensajeError = ref('')
const mensajeExito = ref('')

const handleSubmit = async () => {
  cargando.value = true
  mensajeError.value = ''
  mensajeExito.value = ''

  try {
    const respuesta = await $fetch('/api/destinatarios', {
      method: 'POST',
      body: formulario.value
    })

    if (respuesta.success) {
      mensajeExito.value = 'Destinatario registrado con éxito.'
      formulario.value = {
        nombre_empresa: '',
        telefono: '',
        correo: '',
        direccion: ''
      }
      emit('destinatarioRegistrado')
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        mensajeExito.value = ''
      }, 3000)
    }
  } catch (error: any) {
    mensajeError.value = error.data?.statusMessage || 'Error al registrar el destinatario'
  } finally {
    cargando.value = false
  }
}
</script>
