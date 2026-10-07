<template>
  <div class="space-y-6">
    <!-- Encabezado y Estadísticas de la Cola de Producción -->
    <div class="rounded-xl bg-white p-6 shadow-sm border border-amber-900/10">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold text-gray-900">Cola de Producción</h2>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Tiempo Real
            </span>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            Monitorea y gestiona las órdenes de elaboración en hornos y amasado.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            :disabled="cargando"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm disabled:opacity-50 transition"
            @click="cargarCola"
          >
            <svg class="h-4 w-4" :class="{ 'animate-spin': cargando }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-[#C4620A] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#A85108] transition"
            @click="modalCrear = true"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Orden
          </button>
        </div>
      </div>

      <!-- Métricas / Contadores -->
      <div class="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-4">
        <div class="rounded-lg bg-amber-50/70 p-3.5 border border-amber-100">
          <span class="text-xs font-medium text-amber-800 uppercase tracking-wider">En Cola (Pendientes)</span>
          <p class="mt-1 text-2xl font-bold text-amber-950">{{ conteos.pendientes }}</p>
        </div>
        <div class="rounded-lg bg-blue-50/70 p-3.5 border border-blue-100">
          <span class="text-xs font-medium text-blue-800 uppercase tracking-wider">En Elaboración</span>
          <p class="mt-1 text-2xl font-bold text-blue-950">{{ conteos.enProceso }}</p>
        </div>
        <div class="rounded-lg bg-emerald-50/70 p-3.5 border border-emerald-100">
          <span class="text-xs font-medium text-emerald-800 uppercase tracking-wider">Completadas</span>
          <p class="mt-1 text-2xl font-bold text-emerald-950">{{ conteos.completadas }}</p>
        </div>
        <div class="rounded-lg bg-gray-50 p-3.5 border border-gray-200">
          <span class="text-xs font-medium text-gray-600 uppercase tracking-wider">Total Registradas</span>
          <p class="mt-1 text-2xl font-bold text-gray-900">{{ conteos.total }}</p>
        </div>
      </div>
    </div>

    <!-- Pestañas de Filtro y Búsqueda -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="pestana in pestanas"
          :key="pestana.clave"
          type="button"
          :class="[
            'rounded-lg px-3.5 py-1.5 text-xs font-medium transition',
            filtroEstado === pestana.clave
              ? 'bg-[#3D1F0A] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          ]"
          @click="filtroEstado = pestana.clave"
        >
          {{ pestana.nombre }}
        </button>
      </div>

      <div class="relative min-w-[240px]">
        <input
          v-model.trim="busqueda"
          type="text"
          placeholder="Buscar producto o pedido..."
          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 pl-9 text-xs shadow-sm focus:border-amber-500 focus:outline-none"
        />
        <svg class="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>

    <!-- Mensajes de Estado / Alertas -->
    <div v-if="mensajeError" role="alert" class="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex items-center justify-between">
      <span>{{ mensajeError }}</span>
      <button type="button" class="text-red-500 hover:text-red-700 font-bold" @click="mensajeError = ''">&times;</button>
    </div>

    <div v-if="mensajeExito" role="status" class="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200 flex items-center justify-between">
      <span>{{ mensajeExito }}</span>
      <button type="button" class="text-emerald-600 hover:text-emerald-800 font-bold" @click="mensajeExito = ''">&times;</button>
    </div>

    <!-- Contenedor Principal: Tablero / Cola de Órdenes -->
    <div v-if="cargando && !colaProduccion.length" class="rounded-xl bg-white p-12 text-center text-sm text-gray-500 shadow-sm border border-gray-200">
      <svg class="mx-auto h-8 w-8 animate-spin text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <p class="mt-2 font-medium">Cargando cola de producción...</p>
    </div>

    <div v-else-if="!ordenesFiltradas.length" class="rounded-xl bg-white p-12 text-center text-sm text-gray-500 shadow-sm border border-gray-200">
      <svg class="mx-auto h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <p class="mt-3 font-semibold text-gray-700">No hay órdenes en este estado de la cola.</p>
      <p class="mt-1 text-xs text-gray-400">Puedes registrar una nueva orden de producción con el botón superior.</p>
    </div>

    <!-- Lista / Grid de Órdenes en Cola -->
    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="item in ordenesFiltradas"
        :key="item.id_produccion"
        class="flex flex-col justify-between rounded-xl bg-white p-5 shadow-sm border transition hover:shadow-md"
        :class="{
          'border-blue-300 bg-blue-50/15': item.estado === 'EN_PROCESO',
          'border-amber-200': item.estado === 'PENDIENTE',
          'border-emerald-200': item.estado === 'COMPLETADA',
          'border-gray-200 opacity-70': item.estado === 'CANCELADA'
        }"
      >
        <div>
          <!-- Cabecera de la Tarjeta -->
          <div class="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <span class="text-[0.7rem] font-mono text-gray-400 font-bold uppercase tracking-wider">
                Orden #{{ item.id_produccion }}
              </span>
              <h3 class="text-base font-bold text-gray-900 leading-tight">
                {{ item.producto?.nombre || `Producto ID #${item.id_producto}` }}
              </h3>
              <span v-if="item.producto?.categoria" class="text-xs text-gray-500">
                {{ item.producto.categoria }}
              </span>
            </div>

            <!-- Badge de Estado -->
            <span
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider"
              :class="{
                'bg-blue-100 text-blue-800 border border-blue-200': item.estado === 'EN_PROCESO',
                'bg-amber-100 text-amber-800 border border-amber-200': item.estado === 'PENDIENTE',
                'bg-emerald-100 text-emerald-800 border border-emerald-200': item.estado === 'COMPLETADA',
                'bg-gray-100 text-gray-700 border border-gray-300': item.estado === 'CANCELADA'
              }"
            >
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="{
                  'bg-blue-600 animate-ping': item.estado === 'EN_PROCESO',
                  'bg-amber-600': item.estado === 'PENDIENTE',
                  'bg-emerald-600': item.estado === 'COMPLETADA',
                  'bg-gray-500': item.estado === 'CANCELADA'
                }"
              ></span>
              {{ formatearEstado(item.estado) }}
            </span>
          </div>

          <!-- Detalles de Cantidad y Pedido Asociado -->
          <div class="mt-3 space-y-2 text-xs text-gray-600">
            <div class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span class="font-medium text-gray-700">Cant. Planificada:</span>
              <span class="font-bold text-gray-900 text-sm">
                {{ item.cantidad_planificada }} {{ item.producto?.unidad_medida || 'uds' }}
              </span>
            </div>

            <div v-if="item.estado === 'COMPLETADA' || item.cantidad_producida > 0" class="flex items-center justify-between rounded-lg bg-emerald-50/70 px-3 py-2 text-emerald-900">
              <span class="font-medium">Cant. Producida:</span>
              <span class="font-bold text-sm">
                {{ item.cantidad_producida }} {{ item.producto?.unidad_medida || 'uds' }}
              </span>
            </div>

            <div v-if="item.pedido" class="rounded-lg border border-amber-100 bg-amber-50/40 p-2.5">
              <div class="flex items-center justify-between font-semibold text-amber-900">
                <span>Pedido Asociado #{{ item.pedido.id_pedido }}</span>
                <span
                  class="rounded px-1.5 py-0.5 text-[0.65rem] uppercase font-bold"
                  :class="{
                    'bg-red-100 text-red-800': item.pedido.prioridad === 'URGENTE',
                    'bg-orange-100 text-orange-800': item.pedido.prioridad === 'ALTA',
                    'bg-blue-100 text-blue-800': item.pedido.prioridad === 'NORMAL',
                    'bg-gray-100 text-gray-700': item.pedido.prioridad === 'BAJA',
                  }"
                >
                  {{ item.pedido.prioridad }}
                </span>
              </div>
              <p v-if="item.pedido.destinatario?.nombre_empresa" class="mt-1 text-[0.7rem] text-gray-600">
                Destinatario: <strong class="text-gray-800">{{ item.pedido.destinatario.nombre_empresa }}</strong>
              </p>
              <p v-if="item.pedido.fecha_entrega" class="text-[0.7rem] text-gray-500">
                Fecha entrega: {{ item.pedido.fecha_entrega }}
              </p>
            </div>

            <div class="flex items-center justify-between pt-1 text-[0.7rem] text-gray-400">
              <span>Fecha orden: {{ item.fecha_produccion }}</span>
              <span v-if="item.tiempo_real" class="font-medium text-gray-600">⏱ {{ item.tiempo_real }}</span>
            </div>

            <p v-if="item.observaciones" class="rounded bg-gray-50 p-2 text-[0.7rem] text-gray-600 italic">
              "{{ item.observaciones }}"
            </p>
          </div>
        </div>

        <!-- Acciones según Estado -->
        <div class="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
          <button
            v-if="item.estado === 'PENDIENTE'"
            type="button"
            :disabled="guardandoId === item.id_produccion"
            class="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
            @click="cambiarEstado(item.id_produccion, 'EN_PROCESO')"
          >
            {{ guardandoId === item.id_produccion ? 'Iniciando...' : '▶ Iniciar Elaboración' }}
          </button>

          <button
            v-if="item.estado === 'EN_PROCESO'"
            type="button"
            class="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            @click="abrirModalCompletar(item)"
          >
            ✓ Completar Producción
          </button>

          <button
            v-if="item.estado === 'PENDIENTE' || item.estado === 'EN_PROCESO'"
            type="button"
            :disabled="guardandoId === item.id_produccion"
            class="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
            title="Cancelar orden"
            @click="cambiarEstado(item.id_produccion, 'CANCELADA')"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Registrar Nueva Orden en Cola -->
    <div
      v-if="modalCrear"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl border border-amber-900/10">
        <div class="flex items-center justify-between border-b pb-3">
          <h3 class="text-lg font-bold text-gray-900">Agregar a la Cola de Producción</h3>
          <button type="button" class="text-gray-400 hover:text-gray-600 text-lg font-bold" @click="modalCrear = false">&times;</button>
        </div>

        <form class="mt-4 space-y-4" @submit.prevent="crearOrden">
          <div>
            <label class="block text-xs font-semibold text-gray-700">
              Producto a Elaborar *
              <select
                v-model.number="formCrear.id_producto"
                required
                class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs shadow-sm focus:border-amber-500 focus:outline-none"
              >
                <option :value="null" disabled>Selecciona un producto</option>
                <option v-for="p in productosDisponibles" :key="p.id_producto" :value="p.id_producto">
                  {{ p.nombre }} ({{ p.unidad_medida }}) - Stock actual: {{ p.stock_actual }}
                </option>
              </select>
            </label>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="block text-xs font-semibold text-gray-700">
              Cantidad Planificada *
              <input
                v-model.number="formCrear.cantidad_planificada"
                type="number"
                min="0.01"
                step="any"
                required
                placeholder="Ej. 50"
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs shadow-sm focus:border-amber-500 focus:outline-none"
              />
            </label>

            <label class="block text-xs font-semibold text-gray-700">
              Pedido Asociado (Opcional)
              <select
                v-model.number="formCrear.id_pedido"
                class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs shadow-sm focus:border-amber-500 focus:outline-none"
              >
                <option :value="null">Ninguno (Producción para Stock)</option>
                <option v-for="ped in pedidosDisponibles" :key="ped.id_pedido" :value="ped.id_pedido">
                  Pedido #{{ ped.id_pedido }} ({{ ped.prioridad }}) - {{ ped.destinatario?.nombre_empresa || 'Cliente' }}
                </option>
              </select>
            </label>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700">
              Observaciones / Instrucciones de Horneado
              <textarea
                v-model.trim="formCrear.observaciones"
                rows="2"
                maxlength="500"
                placeholder="Ej. Hornear a 180°C con vapor, lote matutino..."
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs shadow-sm focus:border-amber-500 focus:outline-none"
              ></textarea>
            </label>
          </div>

          <div class="mt-5 flex items-center justify-end gap-3 border-t pt-4">
            <button
              type="button"
              class="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              @click="modalCrear = false"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="guardandoModal"
              class="rounded-lg bg-[#C4620A] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#A85108] disabled:opacity-50 transition"
            >
              {{ guardandoModal ? 'Guardando...' : 'Agregar a la Cola' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Completar Producción -->
    <div
      v-if="modalCompletar.abierto"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-emerald-900/10">
        <div class="flex items-center justify-between border-b pb-3">
          <h3 class="text-lg font-bold text-gray-900">Finalizar Producción #{{ modalCompletar.item?.id_produccion }}</h3>
          <button type="button" class="text-gray-400 hover:text-gray-600 text-lg font-bold" @click="cerrarModalCompletar">&times;</button>
        </div>

        <form class="mt-4 space-y-4" @submit.prevent="confirmarCompletar">
          <p class="text-xs text-gray-600">
            Producto: <strong class="text-gray-900">{{ modalCompletar.item?.producto?.nombre }}</strong>
          </p>

          <label class="block text-xs font-semibold text-gray-700">
            Cantidad Producida Real *
            <input
              v-model.number="modalCompletar.cantidad_producida"
              type="number"
              min="0.01"
              step="any"
              required
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs shadow-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label class="block text-xs font-semibold text-gray-700">
            Tiempo Real Empleado
            <input
              v-model.trim="modalCompletar.tiempo_real"
              type="text"
              maxlength="50"
              placeholder="Ej. 45 mins, 1 hora 15m..."
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs shadow-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label class="block text-xs font-semibold text-gray-700">
            Observaciones de Cierre
            <textarea
              v-model.trim="modalCompletar.observaciones"
              rows="2"
              maxlength="500"
              placeholder="Resultados, mermas o notas de calidad..."
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-xs shadow-sm focus:border-emerald-500 focus:outline-none"
            ></textarea>
          </label>

          <div class="mt-5 flex items-center justify-end gap-3 border-t pt-4">
            <button
              type="button"
              class="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              @click="cerrarModalCompletar"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="guardandoModal"
              class="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {{ guardandoModal ? 'Guardando...' : 'Confirmar Finalización' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { createClient, type RealtimeChannel } from '@supabase/supabase-js'
import { useAuth } from '../../composables/useAuth'
import type { ProduccionDetalle, EstadoProduccion } from '../../../server/models/produccion.model'
import type { Producto } from '../../../server/models/producto.model'
import type { PedidoListado } from '../../../server/models/pedido.model'

// Autenticación y Cliente Supabase para Realtime
const { usuario } = useAuth()
const config = useRuntimeConfig()
const supabase = (config.public.supabaseUrl && config.public.supabaseKey)
  ? createClient(config.public.supabaseUrl as string, config.public.supabaseKey as string)
  : null

let realtimeChannel: RealtimeChannel | null = null

// Estados reactivos
const colaProduccion = ref<ProduccionDetalle[]>([])
const productosDisponibles = ref<Producto[]>([])
const pedidosDisponibles = ref<PedidoListado[]>([])
const cargando = ref(true)
const guardandoId = ref<number | null>(null)
const guardandoModal = ref(false)
const mensajeError = ref('')
const mensajeExito = ref('')
const filtroEstado = ref<string>('TODOS')
const busqueda = ref('')

// Pestañas
const pestanas = [
  { clave: 'TODOS', nombre: 'Todas' },
  { clave: 'PENDIENTE', nombre: 'En Cola (Pendientes)' },
  { clave: 'EN_PROCESO', nombre: 'En Elaboración' },
  { clave: 'COMPLETADA', nombre: 'Completadas' },
  { clave: 'CANCELADA', nombre: 'Canceladas' },
]

// Modal Crear
const modalCrear = ref(false)
const formCrear = reactive({
  id_producto: null as number | null,
  id_pedido: null as number | null,
  cantidad_planificada: null as number | null,
  observaciones: '',
})

// Modal Completar
const modalCompletar = reactive({
  abierto: false,
  item: null as ProduccionDetalle | null,
  cantidad_producida: 0,
  tiempo_real: '',
  observaciones: '',
})

// Conteos
const conteos = computed(() => {
  const pendientes = colaProduccion.value.filter((i) => i.estado === 'PENDIENTE').length
  const enProceso = colaProduccion.value.filter((i) => i.estado === 'EN_PROCESO').length
  const completadas = colaProduccion.value.filter((i) => i.estado === 'COMPLETADA').length
  const total = colaProduccion.value.length
  return { pendientes, enProceso, completadas, total }
})

// Filtros y Búsqueda
const ordenesFiltradas = computed(() => {
  let lista = colaProduccion.value

  if (filtroEstado.value !== 'TODOS') {
    lista = lista.filter((item) => item.estado === filtroEstado.value)
  }

  if (busqueda.value.trim() !== '') {
    const q = busqueda.value.toLowerCase().trim()
    lista = lista.filter(
      (item) =>
        item.producto?.nombre?.toLowerCase().includes(q) ||
        item.id_produccion.toString().includes(q) ||
        item.pedido?.id_pedido?.toString().includes(q) ||
        item.pedido?.destinatario?.nombre_empresa?.toLowerCase().includes(q)
    )
  }

  return lista
})

const formatearEstado = (estado: EstadoProduccion) => {
  switch (estado) {
    case 'PENDIENTE':
      return 'En Cola'
    case 'EN_PROCESO':
      return 'En Elaboración'
    case 'COMPLETADA':
      return 'Completada'
    case 'CANCELADA':
      return 'Cancelada'
    default:
      return estado
  }
}

// Cargar Datos
const cargarCola = async () => {
  cargando.value = true
  mensajeError.value = ''
  try {
    const res = await $fetch<{ success: boolean; data: ProduccionDetalle[] }>('/api/produccion')
    if (res?.success) {
      colaProduccion.value = res.data
    }
  } catch (err: any) {
    mensajeError.value = err.data?.statusMessage || 'Error al cargar la cola de producción.'
  } finally {
    cargando.value = false
  }
}

const cargarAuxiliares = async () => {
  try {
    const [resProd, resPed] = await Promise.all([
      $fetch<{ success: boolean; data: Producto[] }>('/api/productos?estado=true'),
      $fetch<{ success: boolean; data: PedidoListado[] }>('/api/pedidos'),
    ])
    productosDisponibles.value = resProd.data || []
    pedidosDisponibles.value = resPed.data || []
  } catch {
    // Silencioso
  }
}

// Acciones de Cambio de Estado
const cambiarEstado = async (id: number, nuevoEstado: EstadoProduccion) => {
  guardandoId.value = id
  mensajeError.value = ''
  mensajeExito.value = ''
  try {
    await $fetch(`/api/produccion/${id}/estado`, {
      method: 'PATCH',
      body: { estado: nuevoEstado },
    })
    mensajeExito.value = `Orden #${id} actualizada a ${formatearEstado(nuevoEstado)}.`
    await cargarCola()
  } catch (err: any) {
    mensajeError.value = err.data?.statusMessage || 'Error al cambiar estado de la orden.'
  } finally {
    guardandoId.value = null
  }
}

const abrirModalCompletar = (item: ProduccionDetalle) => {
  modalCompletar.item = item
  modalCompletar.cantidad_producida = Number(item.cantidad_planificada)
  modalCompletar.tiempo_real = item.tiempo_real || ''
  modalCompletar.observaciones = item.observaciones || ''
  modalCompletar.abierto = true
}

const cerrarModalCompletar = () => {
  modalCompletar.abierto = false
  modalCompletar.item = null
}

const confirmarCompletar = async () => {
  if (!modalCompletar.item) return
  guardandoModal.value = true
  mensajeError.value = ''
  mensajeExito.value = ''
  try {
    await $fetch(`/api/produccion/${modalCompletar.item.id_produccion}/estado`, {
      method: 'PATCH',
      body: {
        estado: 'COMPLETADA',
        cantidad_producida: modalCompletar.cantidad_producida,
        tiempo_real: modalCompletar.tiempo_real || null,
        observaciones: modalCompletar.observaciones || null,
      },
    })
    mensajeExito.value = `Orden #${modalCompletar.item.id_produccion} completada exitosamente.`
    cerrarModalCompletar()
    await cargarCola()
  } catch (err: any) {
    mensajeError.value = err.data?.statusMessage || 'Error al completar la orden.'
  } finally {
    guardandoModal.value = false
  }
}

// Crear Orden
const crearOrden = async () => {
  if (!formCrear.id_producto || !formCrear.cantidad_planificada) {
    mensajeError.value = 'Selecciona un producto y cantidad válida.'
    return
  }
  guardandoModal.value = true
  mensajeError.value = ''
  mensajeExito.value = ''
  try {
    await $fetch('/api/produccion', {
      method: 'POST',
      body: {
        id_producto: formCrear.id_producto,
        id_pedido: formCrear.id_pedido || null,
        id_usuario: usuario.value?.id_usuario || 1,
        cantidad_planificada: formCrear.cantidad_planificada,
        observaciones: formCrear.observaciones || null,
      },
    })
    mensajeExito.value = 'Orden agregada exitosamente a la cola de producción.'
    modalCrear.value = false
    formCrear.id_producto = null
    formCrear.id_pedido = null
    formCrear.cantidad_planificada = null
    formCrear.observaciones = ''
    await cargarCola()
  } catch (err: any) {
    mensajeError.value = err.data?.statusMessage || 'Error al crear la orden de producción.'
  } finally {
    guardandoModal.value = false
  }
}

// Suscripción Realtime (RF-20)
onMounted(() => {
  cargarCola()
  cargarAuxiliares()

  if (supabase) {
    realtimeChannel = supabase
      .channel('realtime-produccion')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produccion' }, () => {
        cargarCola()
      })
      .subscribe()
  }
})

onUnmounted(() => {
  if (realtimeChannel && supabase) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
})
</script>
