<template>
  <div class="space-y-6">
    <!-- Métricas / Contadores Rápidos -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="rounded-xl border border-amber-900/10 bg-white p-4 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Devoluciones</p>
        <p class="mt-1 text-2xl font-bold font-serif text-[#3D1F0A]">{{ metricas.total }}</p>
      </div>

      <div class="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-emerald-800">Aceptadas (Reingreso)</p>
          <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
        </div>
        <p class="mt-1 text-2xl font-bold text-emerald-950">{{ metricas.aceptadas }}</p>
        <p class="text-[0.7rem] text-emerald-700 mt-0.5">Sumaron al stock actual</p>
      </div>

      <div class="rounded-xl border border-amber-100 bg-amber-50/70 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-amber-800">Pendientes</p>
          <span class="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
        </div>
        <p class="mt-1 text-2xl font-bold text-amber-950">{{ metricas.pendientes }}</p>
        <p class="text-[0.7rem] text-amber-700 mt-0.5">En espera de inspección</p>
      </div>

      <div class="rounded-xl border border-rose-100 bg-rose-50/70 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-rose-800">Rechazadas / Merma</p>
          <span class="h-2 w-2 rounded-full bg-rose-500"></span>
        </div>
        <p class="mt-1 text-2xl font-bold text-rose-950">{{ metricas.rechazadas }}</p>
        <p class="text-[0.7rem] text-rose-700 mt-0.5">Dañadas o caducadas</p>
      </div>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <div class="rounded-xl border border-amber-900/10 bg-white p-4 shadow-sm">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Buscador -->
        <div class="relative">
          <input
            v-model="filtroTexto"
            type="text"
            placeholder="Buscar por cliente, pan o motivo..."
            class="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-[#C4620A] focus:ring-1 focus:ring-[#C4620A] outline-none transition"
          />
          <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- Filtro Estado -->
        <div>
          <select
            v-model="filtroEstado"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C4620A] focus:ring-1 focus:ring-[#C4620A] outline-none transition"
            @change="cargarDevoluciones"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="APROBADA">Aprobadas (Reingreso)</option>
            <option value="PENDIENTE">Pendientes de inspección</option>
            <option value="RECHAZADA">Rechazadas</option>
          </select>
        </div>

        <!-- Fecha Desde -->
        <div>
          <input
            v-model="filtroDesde"
            type="date"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C4620A] focus:ring-1 focus:ring-[#C4620A] outline-none transition"
            @change="cargarDevoluciones"
          />
        </div>

        <!-- Fecha Hasta / Limpiar -->
        <div class="flex items-center gap-2">
          <input
            v-model="filtroHasta"
            type="date"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C4620A] focus:ring-1 focus:ring-[#C4620A] outline-none transition"
            @change="cargarDevoluciones"
          />
          <button
            type="button"
            title="Limpiar filtros"
            class="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100 transition"
            @click="limpiarFiltros"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mensaje de Notificación de Operación -->
    <div
      v-if="mensajeAlerta"
      class="rounded-xl border p-3.5 text-sm flex items-center justify-between"
      :class="alertaTipo === 'exito' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'"
    >
      <span>{{ mensajeAlerta }}</span>
      <button type="button" class="text-xs font-semibold underline" @click="mensajeAlerta = ''">Cerrar</button>
    </div>

    <!-- Tabla de Devoluciones (RF-05 en tiempo real) -->
    <div class="overflow-hidden rounded-xl border border-amber-900/10 bg-white shadow-sm">
      <div v-if="cargando" class="py-12 text-center text-sm text-gray-500">
        <svg class="mx-auto h-8 w-8 animate-spin text-[#C4620A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-2">Cargando devoluciones...</p>
      </div>

      <div v-else-if="devolucionesFiltradas.length === 0" class="py-12 text-center text-sm text-gray-500">
        <svg class="mx-auto h-10 w-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p class="font-medium text-gray-700">No se encontraron registros de devoluciones</p>
        <p class="text-xs text-gray-400 mt-1">Registra una devolución con el botón superior o ajusta los filtros.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead class="bg-[#FDF8F3] text-xs font-semibold text-[#3D1F0A] uppercase tracking-wider">
            <tr>
              <th class="px-4 py-3">Devolución / Fecha</th>
              <th class="px-4 py-3">Destinatario</th>
              <th class="px-4 py-3">Pedido</th>
              <th class="px-4 py-3">Producto Devuelto</th>
              <th class="px-4 py-3 text-right">Cantidad</th>
              <th class="px-4 py-3">Motivo</th>
              <th class="px-4 py-3 text-center">Estado</th>
              <th class="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr
              v-for="d in devolucionesFiltradas"
              :key="d.id_devolucion"
              class="hover:bg-amber-50/30 transition"
            >
              <td class="px-4 py-3.5 whitespace-nowrap">
                <span class="font-mono font-bold text-gray-900">#DEV-{{ String(d.id_devolucion).padStart(4, '0') }}</span>
                <p class="text-xs text-gray-500">{{ formatearFecha(d.fecha) }}</p>
              </td>

              <td class="px-4 py-3.5">
                <p class="font-semibold text-gray-900">
                  {{ d.pedido?.destinatario?.nombre_empresa || 'Cliente' }}
                </p>
                <p v-if="d.pedido?.destinatario?.telefono" class="text-xs text-gray-400">
                  {{ d.pedido?.destinatario?.telefono }}
                </p>
              </td>

              <td class="px-4 py-3.5 whitespace-nowrap">
                <span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  Pedido #{{ d.id_pedido }}
                </span>
              </td>

              <td class="px-4 py-3.5">
                <p class="font-medium text-gray-900">{{ d.producto?.nombre || `Producto #${d.id_producto}` }}</p>
                <p class="text-xs text-gray-400">{{ d.producto?.categoria || 'General' }}</p>
              </td>

              <td class="px-4 py-3.5 text-right whitespace-nowrap">
                <span class="text-sm font-bold text-[#C4620A]">{{ d.cantidad_devuelta }}</span>
                <span class="text-xs text-gray-500 ml-1">{{ d.producto?.unidad_medida || 'u' }}</span>
              </td>

              <td class="px-4 py-3.5 max-w-xs">
                <p class="truncate text-xs font-medium text-gray-800" :title="d.motivo">
                  {{ d.motivo }}
                </p>
                <p v-if="d.observaciones" class="truncate text-[0.7rem] text-gray-400 italic" :title="d.observaciones">
                  {{ d.observaciones }}
                </p>
              </td>

              <td class="px-4 py-3.5 text-center whitespace-nowrap">
                <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold" :class="badgeClase(d.estado)">
                  {{ d.estado }}
                </span>
              </td>

              <td class="px-4 py-3.5 text-center whitespace-nowrap">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    title="Ver comprobante"
                    class="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
                    @click="$emit('verComprobante', d)"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>

                  <template v-if="d.estado === 'PENDIENTE'">
                    <button
                      type="button"
                      title="Aceptar e ingresar al stock"
                      class="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                      :disabled="procesandoId === d.id_devolucion"
                      @click="cambiarEstado(d.id_devolucion, 'APROBADA')"
                    >
                      Aprobar
                    </button>

                    <button
                      type="button"
                      title="Rechazar devolución"
                      class="rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                      :disabled="procesandoId === d.id_devolucion"
                      @click="cambiarEstado(d.id_devolucion, 'RECHAZADA')"
                    >
                      Rechazar
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { DevolucionDetalle, EstadoDevolucion } from '../../../server/models/devolucion.model';

const emit = defineEmits<{
  (e: 'verComprobante', devolucion: DevolucionDetalle): void;
}>();

const devoluciones = ref<DevolucionDetalle[]>([]);
const cargando = ref(false);
const procesandoId = ref<number | null>(null);
const mensajeAlerta = ref('');
const alertaTipo = ref<'exito' | 'error'>('exito');

const filtroTexto = ref('');
const filtroEstado = ref('TODOS');
const filtroDesde = ref('');
const filtroHasta = ref('');

const metricas = computed(() => {
  const total = devoluciones.value.length;
  const aceptadas = devoluciones.value.filter((d) => d.estado === 'APROBADA').length;
  const pendientes = devoluciones.value.filter((d) => d.estado === 'PENDIENTE').length;
  const rechazadas = devoluciones.value.filter((d) => d.estado === 'RECHAZADA').length;
  return { total, aceptadas, pendientes, rechazadas };
});

const devolucionesFiltradas = computed(() => {
  const texto = filtroTexto.value.trim().toLowerCase();
  if (!texto) return devoluciones.value;

  return devoluciones.value.filter((d) => {
    const cliente = d.pedido?.destinatario?.nombre_empresa?.toLowerCase() || '';
    const producto = d.producto?.nombre?.toLowerCase() || '';
    const motivo = d.motivo?.toLowerCase() || '';
    const idStr = String(d.id_devolucion);
    const pedidoIdStr = String(d.id_pedido);

    return (
      cliente.includes(texto) ||
      producto.includes(texto) ||
      motivo.includes(texto) ||
      idStr.includes(texto) ||
      pedidoIdStr.includes(texto)
    );
  });
});

function badgeClase(estado: string) {
  switch (estado) {
    case 'APROBADA':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'RECHAZADA':
      return 'bg-rose-100 text-rose-800 border border-rose-200';
    default:
      return 'bg-amber-100 text-amber-800 border border-amber-200';
  }
}

function formatearFecha(fechaStr?: string) {
  if (!fechaStr) return 'N/A';
  try {
    const [anio, mes, dia] = fechaStr.slice(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
  } catch {
    return fechaStr;
  }
}

function limpiarFiltros() {
  filtroTexto.value = '';
  filtroEstado.value = 'TODOS';
  filtroDesde.value = '';
  filtroHasta.value = '';
  cargarDevoluciones();
}

async function cargarDevoluciones() {
  cargando.value = true;
  try {
    const params: Record<string, any> = {};
    if (filtroEstado.value !== 'TODOS') params.estado = filtroEstado.value;
    if (filtroDesde.value) params.desde = filtroDesde.value;
    if (filtroHasta.value) params.hasta = filtroHasta.value;

    const res: any = await $fetch('/api/devoluciones', { params });
    devoluciones.value = res?.data || [];
  } catch (err: any) {
    mensajeAlerta.value = 'Error al cargar las devoluciones.';
    alertaTipo.value = 'error';
  } finally {
    cargando.value = false;
  }
}

async function cambiarEstado(id: number, nuevoEstado: EstadoDevolucion) {
  procesandoId.value = id;
  mensajeAlerta.value = '';
  try {
    const res: any = await $fetch(`/api/devoluciones/${id}/estado`, {
      method: 'PATCH',
      body: { estado: nuevoEstado },
    });

    mensajeAlerta.value = res?.mensaje || `Devolución #${id} actualizada a ${nuevoEstado}.`;
    alertaTipo.value = 'exito';
    await cargarDevoluciones();
  } catch (err: any) {
    mensajeAlerta.value = err.data?.statusMessage || err.message || 'Error al actualizar el estado.';
    alertaTipo.value = 'error';
  } finally {
    procesandoId.value = null;
  }
}

defineExpose({
  cargarDevoluciones,
});

onMounted(() => {
  cargarDevoluciones();
});
</script>
