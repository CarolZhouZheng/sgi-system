<template>
  <section class="rounded-lg bg-white p-6 shadow-sm">
    <h2 class="mb-5 border-b pb-3 text-xl font-semibold text-gray-900">
      Registrar pedido
    </h2>

    <form class="space-y-5" @submit.prevent="registrarPedido">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label class="block text-sm font-medium text-gray-700">
          Destinatario
          <select
            v-model.number="formulario.id_destinatario"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option :value="null" disabled>Selecciona un destinatario</option>
            <option
              v-for="destinatario in destinatarios"
              :key="destinatario.id_destinatario"
              :value="destinatario.id_destinatario"
            >
              {{ destinatario.nombre_empresa }}
            </option>
          </select>
        </label>

        <label class="block text-sm font-medium text-gray-700">
          Fecha de entrega
          <input
            v-model="formulario.fecha_entrega"
            type="date"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
        </label>

        <label class="block text-sm font-medium text-gray-700">
          Prioridad
          <select
            v-model="formulario.prioridad"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="NORMAL">Normal</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>
        </label>

        <label class="block text-sm font-medium text-gray-700">
          Encargado de entrega
          <input
            v-model.trim="formulario.encargado_entrega"
            type="text"
            maxlength="150"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          >
        </label>

      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between border-b pb-2">
          <h3 class="font-semibold text-gray-800">Productos del pedido</h3>
          <button
            type="button"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm"
            @click="agregarDetalle"
          >
            Agregar producto
          </button>
        </div>

        <div
          v-for="(detalle, indice) in formulario.detalles"
          :key="detalle.fila"
          class="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_180px_auto]"
        >
          <label class="block text-sm font-medium text-gray-700">
            Producto {{ indice + 1 }}
            <select
              v-model.number="detalle.id_producto"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option :value="null" disabled>Selecciona un producto</option>
              <option
                v-for="producto in productos"
                :key="producto.id_producto"
                :value="producto.id_producto"
              >
                {{ producto.nombre }} ({{ producto.unidad_medida }})
              </option>
            </select>
          </label>

          <label class="block text-sm font-medium text-gray-700">
            Cantidad
            <input
              v-model.number="detalle.cantidad"
              type="number"
              min="0.01"
              step="any"
              required
              class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
          </label>

          <button
            v-if="formulario.detalles.length > 1"
            type="button"
            class="rounded-md px-3 py-2 text-sm text-red-700 hover:bg-red-50"
            @click="quitarDetalle(indice)"
          >
            Quitar
          </button>
        </div>
      </div>

      <p v-if="mensajeError" role="alert" class="text-sm text-red-700">
        {{ mensajeError }}
      </p>
      <p v-if="mensajeExito" role="status" class="text-sm text-green-700">
        {{ mensajeExito }}
      </p>

      <button
        type="submit"
        :disabled="guardando || cargandoOpciones || !destinatarios.length || !productos.length"
        class="rounded-md bg-amber-600 px-5 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {{ guardando ? 'Guardando...' : 'Registrar pedido' }}
      </button>
    </form>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { Destinatario } from '~/server/models/destinatario.model'
import type { Producto } from '~/server/models/producto.model'

type DetalleFormulario = {
  fila: number
  id_producto: number | null
  cantidad: number | null
}

const emit = defineEmits<{ pedidoRegistrado: [] }>()
const destinatarios = ref<Destinatario[]>([])
const productos = ref<Producto[]>([])
const cargandoOpciones = ref(true)
const guardando = ref(false)
const mensajeError = ref('')
const mensajeExito = ref('')
let siguienteFila = 1

const fechaHoy = () => {
  const ahora = new Date()
  const zonaLocal = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000)
  return zonaLocal.toISOString().slice(0, 10)
}

const crearDetalle = (): DetalleFormulario => ({
  fila: siguienteFila++,
  id_producto: null,
  cantidad: null,
})

const formulario = reactive({
  id_destinatario: null as number | null,
  fecha_entrega: fechaHoy(),
  prioridad: 'NORMAL',
  encargado_entrega: '',
  detalles: [crearDetalle()],
})

const cargarOpciones = async () => {
  cargandoOpciones.value = true

  try {
    const [respuestaDestinatarios, respuestaProductos] = await Promise.all([
      $fetch<{ success: boolean; data: Destinatario[] }>('/api/destinatarios'),
      $fetch<{ success: boolean; data: Producto[] }>('/api/productos?estado=true'),
    ])

    destinatarios.value = respuestaDestinatarios.data.filter((item) => item.estado)
    productos.value = respuestaProductos.data.filter((item) => item.estado)
  } catch (error: any) {
    mensajeError.value = error.data?.statusMessage || 'No se pudieron cargar las opciones.'
  } finally {
    cargandoOpciones.value = false
  }
}

const agregarDetalle = () => formulario.detalles.push(crearDetalle())

const quitarDetalle = (indice: number) => {
  formulario.detalles.splice(indice, 1)
}

const registrarPedido = async () => {
  mensajeError.value = ''
  mensajeExito.value = ''

  if (formulario.id_destinatario === null) {
    mensajeError.value = 'Selecciona un destinatario.'
    return
  }

  if (formulario.detalles.some(
    (detalle) =>
      detalle.id_producto === null ||
      detalle.cantidad === null ||
      detalle.cantidad <= 0,
  )) {
    mensajeError.value = 'Completa cada producto con una cantidad mayor que cero.'
    return
  }

  guardando.value = true

  try {
    await $fetch('/api/pedidos', {
      method: 'POST',
      body: {
        id_destinatario: formulario.id_destinatario,
        fecha_entrega: formulario.fecha_entrega || null,
        prioridad: formulario.prioridad,
        encargado_entrega: formulario.encargado_entrega || null,
        detalles: formulario.detalles.map((detalle) => ({
          id_producto: detalle.id_producto,
          cantidad: detalle.cantidad,
        })),
      },
    })

    mensajeExito.value = 'Pedido registrado correctamente.'
    formulario.id_destinatario = null
    formulario.fecha_entrega = fechaHoy()
    formulario.prioridad = 'NORMAL'
    formulario.encargado_entrega = ''
    formulario.detalles = [crearDetalle()]
    emit('pedidoRegistrado')
  } catch (error: any) {
    mensajeError.value = error.data?.statusMessage || 'No se pudo registrar el pedido.'
  } finally {
    guardando.value = false
  }
}

onMounted(cargarOpciones)
</script>