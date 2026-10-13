<template>
  <div class="relative" ref="contenedorCampanaRef">
    <!-- =====================================================
         BOTÓN DE LA CAMPANA CON BADGE DINÁMICO
         ===================================================== -->
    <button
      type="button"
      id="btn-campana-alertas"
      class="relative p-2 rounded-lg text-[#7A5A3A] hover:text-[#1A0A00] hover:bg-[#F4ECE1] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C4620A]/40"
      :class="{ 'bg-[#F4ECE1] text-[#1A0A00]': menuAbierto }"
      @click="toggleMenu"
      :aria-label="`Alertas de vencimiento: ${resumen.total} productos`"
      :title="resumen.total > 0 ? `${resumen.total} productos con alerta de vencimiento` : 'Sin alertas de vencimiento'"
    >
      <!-- Icono SVG de Campana -->
      <svg
        class="w-5 h-5 transition-transform"
        :class="{ 'animate-bounce': tieneVencidos && !menuAbierto }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      <!-- Badge Contador -->
      <span
        v-if="resumen.total > 0"
        id="badge-campana-alertas"
        class="absolute -top-1 -right-1 min-w-[1.2rem] h-[1.2rem] px-1 flex items-center justify-center text-[0.68rem] font-bold text-white rounded-full shadow-xs select-none"
        :class="tieneVencidos ? 'bg-[#DC2626] ring-2 ring-white animate-pulse' : 'bg-[#D97706] ring-2 ring-white'"
      >
        {{ resumen.total > 99 ? '99+' : resumen.total }}
      </span>
    </button>

    <!-- =====================================================
         PANEL DESPLEGABLE DE NOTIFICACIONES (DROPDOWN)
         ===================================================== -->
    <transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="menuAbierto"
        id="panel-alertas-vencimiento"
        class="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-xl shadow-xl border border-[#E8D5BC] z-50 overflow-hidden font-sans"
      >
        <!-- Encabezado del Dropdown -->
        <div class="p-4 bg-[#FDF8F3] border-b border-[#E8D5BC] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[0.65rem] font-bold bg-[#FAEEDA] text-[#854F0B] border border-[#E8D5BC]">
              RF-06
            </span>
            <div>
              <h3 class="text-sm font-serif font-bold text-[#1A0A00]">
                Alertas de Vencimiento
              </h3>
              <p class="text-[0.7rem] text-[#7A5A3A]">
                Umbral de aviso: ≤ {{ resumen.dias_umbral_alerta }} días
              </p>
            </div>
          </div>

          <!-- Botón de recarga -->
          <button
            type="button"
            class="p-1.5 rounded-md text-[#7A5A3A] hover:text-[#1A0A00] hover:bg-[#E8D5BC]/30 transition"
            :class="{ 'opacity-50 cursor-not-allowed': loading }"
            :disabled="loading"
            @click="recargar"
            title="Actualizar alertas"
          >
            <svg
              class="w-4 h-4"
              :class="{ 'animate-spin': loading }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <!-- Pestañas de Filtro Rápido -->
        <div class="flex border-b border-[#E8D5BC] bg-[#FDFAF6] text-xs">
          <button
            type="button"
            class="flex-1 py-2 px-3 font-semibold text-center transition border-b-2"
            :class="
              filtroActivo === 'TODOS'
                ? 'border-[#C4620A] text-[#C4620A] bg-white'
                : 'border-transparent text-[#7A5A3A] hover:text-[#1A0A00]'
            "
            @click="filtroActivo = 'TODOS'"
          >
            Todos ({{ resumen.total }})
          </button>
          <button
            type="button"
            class="flex-1 py-2 px-3 font-semibold text-center transition border-b-2 flex items-center justify-center gap-1.5"
            :class="
              filtroActivo === 'VENCIDOS'
                ? 'border-[#DC2626] text-[#DC2626] bg-white'
                : 'border-transparent text-[#7A5A3A] hover:text-[#DC2626]'
            "
            @click="filtroActivo = 'VENCIDOS'"
          >
            <span v-if="resumen.total_vencidos > 0" class="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></span>
            Vencidos ({{ resumen.total_vencidos }})
          </button>
          <button
            type="button"
            class="flex-1 py-2 px-3 font-semibold text-center transition border-b-2 flex items-center justify-center gap-1.5"
            :class="
              filtroActivo === 'POR_VENCER'
                ? 'border-[#D97706] text-[#D97706] bg-white'
                : 'border-transparent text-[#7A5A3A] hover:text-[#D97706]'
            "
            @click="filtroActivo = 'POR_VENCER'"
          >
            <span v-if="resumen.total_por_vencer > 0" class="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
            Por vencer ({{ resumen.total_por_vencer }})
          </button>
        </div>

        <!-- Lista de Alertas -->
        <div class="max-h-80 overflow-y-auto divide-y divide-[#E8D5BC]/50">
          <!-- Spinner de carga inicial -->
          <div v-if="loading && alertas.length === 0" class="p-8 text-center text-[#7A5A3A] text-xs">
            <svg class="animate-spin w-6 h-6 mx-auto mb-2 text-[#C4620A]" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            Consultando lotes y vencimientos...
          </div>

          <!-- Mensaje de error si falla -->
          <div v-else-if="error" class="p-4 text-center text-xs text-[#DC2626] bg-[#FCEBEB]">
            <p class="font-semibold">{{ error }}</p>
            <button
              type="button"
              class="mt-2 px-3 py-1 bg-white border border-[#DC2626] rounded text-[0.7rem] text-[#DC2626] hover:bg-[#FCEBEB]"
              @click="recargar"
            >
              Reintentar
            </button>
          </div>

          <!-- Estado Vacío (Sin alertas) -->
          <div
            v-else-if="alertasFiltradas.length === 0"
            class="p-8 text-center text-[#7A5A3A]"
          >
            <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-[#EAF3DE] flex items-center justify-center text-[#3B6D11]">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="text-xs font-semibold text-[#1A0A00]">
              {{ filtroActivo === 'TODOS' ? '¡Todo en orden!' : 'Sin elementos en esta categoría' }}
            </p>
            <p class="text-[0.72rem] text-[#7A5A3A] mt-1">
              {{ filtroActivo === 'TODOS' ? 'No hay productos vencidos ni próximos a vencer.' : 'No se encontraron lotes que coincidan con el filtro.' }}
            </p>
          </div>

          <!-- Tarjetas de Lotes / Productos con Alerta -->
          <div
            v-for="item in alertasFiltradas"
            :key="item.id_lote"
            class="p-3.5 hover:bg-[#FDF8F3] transition-colors flex items-start gap-3"
            :class="{
              'bg-[#FCEBEB]/40': item.estado_vencimiento === 'VENCIDO',
              'bg-[#FFFBEB]/40': item.estado_vencimiento === 'POR_VENCER' && item.dias_restantes <= 1
            }"
          >
            <!-- Indicador visual lateral -->
            <div
              class="w-1 self-stretch rounded-full flex-shrink-0"
              :class="{
                'bg-[#DC2626]': item.nivel_urgencia === 'CRITICO',
                'bg-[#D97706]': item.nivel_urgencia === 'ALTO',
                'bg-[#EAB308]': item.nivel_urgencia === 'MEDIO'
              }"
            ></div>

            <!-- Información detallada del producto y lote -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1 mb-1">
                <h4 class="text-xs font-bold text-[#1A0A00] truncate">
                  {{ item.nombre_producto }}
                </h4>
                <!-- Etiqueta de Urgencia -->
                <span
                  class="text-[0.65rem] font-bold px-2 py-0.5 rounded-full select-none flex-shrink-0"
                  :class="{
                    'bg-[#DC2626] text-white': item.estado_vencimiento === 'VENCIDO',
                    'bg-[#F59E0B] text-white': item.estado_vencimiento === 'POR_VENCER' && item.dias_restantes === 0,
                    'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]': item.estado_vencimiento === 'POR_VENCER' && item.dias_restantes > 0
                  }"
                >
                  {{ item.mensaje }}
                </span>
              </div>

              <!-- Metadata: Lote, Stock y Categoría -->
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] text-[#7A5A3A] mb-1">
                <span class="font-mono bg-white px-1.5 py-0.2 rounded border border-[#E8D5BC] text-[#1A0A00]">
                  Lote: {{ item.numero_lote }}
                </span>
                <span>
                  Stock: <strong class="text-[#1A0A00]">{{ item.cantidad }} {{ item.unidad_medida }}</strong>
                </span>
                <span v-if="item.categoria" class="text-white/30 hidden sm:inline">•</span>
                <span v-if="item.categoria" class="truncate text-[0.68rem] text-[#9C7A5A]">
                  {{ item.categoria }}
                </span>
              </div>

              <!-- Fecha de Vencimiento -->
              <div class="text-[0.68rem] text-[#7A5A3A] flex items-center justify-between">
                <span>
                  Fecha vencimiento: <strong class="text-[#1A0A00]">{{ formatearFecha(item.fecha_vencimiento) }}</strong>
                </span>

                <!-- Enlace de acción rápida si está vencido para registrar merma -->
                <NuxtLink
                  v-if="item.estado_vencimiento === 'VENCIDO'"
                  to="/perdidas"
                  class="text-[0.68rem] font-semibold text-[#DC2626] hover:underline flex items-center gap-0.5"
                  @click="menuAbierto = false"
                >
                  Registrar pérdida
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Pie del Dropdown -->
        <div class="p-2.5 bg-[#FDF8F3] border-t border-[#E8D5BC] flex items-center justify-between text-xs">
          <NuxtLink
            to="/productos"
            class="text-[0.72rem] font-semibold text-[#C4620A] hover:text-[#9A4C07] transition flex items-center gap-1"
            @click="menuAbierto = false"
          >
            <span>Ver Inventario General</span>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </NuxtLink>

          <button
            type="button"
            class="text-[0.72rem] text-[#7A5A3A] hover:text-[#1A0A00] transition"
            @click="menuAbierto = false"
          >
            Cerrar
          </button>
        </div>
      </div>
    </transition>

    <!-- =====================================================
         TOAST / AVISO INICIAL AL INGRESAR (SI HAY VENCIDOS)
         ===================================================== -->
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="transform opacity-0 translate-y-2"
      enter-to-class="transform opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="transform opacity-100 translate-y-0"
      leave-to-class="transform opacity-0 translate-y-2"
    >
      <div
        v-if="mostrarToastInicial"
        class="fixed bottom-6 right-6 z-50 max-w-sm bg-white border border-[#DC2626] rounded-xl shadow-2xl p-4 flex items-start gap-3 font-sans"
      >
        <div class="w-9 h-9 rounded-full bg-[#FCEBEB] text-[#DC2626] flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-bold text-[#1A0A00]">
            Atención: Productos con alerta
          </h4>
          <p class="text-[0.75rem] text-[#7A5A3A] mt-0.5">
            Se encontraron <strong class="text-[#DC2626]">{{ resumen.total }} producto(s)</strong> que requieren atención en el inventario.
          </p>
          <div class="mt-2 flex items-center gap-2">
            <button
              type="button"
              class="px-2.5 py-1 text-[0.7rem] font-bold rounded bg-[#DC2626] text-white hover:bg-[#B91C1C] transition shadow-xs"
              @click="abrirDesdeToast"
            >
              Ver alertas
            </button>
            <button
              type="button"
              class="px-2 py-1 text-[0.7rem] text-[#7A5A3A] hover:text-[#1A0A00] transition"
              @click="mostrarToastInicial = false"
            >
              Ignorar
            </button>
          </div>
        </div>
        <button
          type="button"
          class="text-[#7A5A3A] hover:text-[#1A0A00]"
          @click="mostrarToastInicial = false"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useAlertasVencimiento } from '~/composables/useAlertasVencimiento';

const {
  alertas,
  resumen,
  loading,
  error,
  filtroActivo,
  alertasFiltradas,
  tieneVencidos,
  cargarAlertas,
} = useAlertasVencimiento();

const menuAbierto = ref(false);
const mostrarToastInicial = ref(false);
const contenedorCampanaRef = ref<HTMLElement | null>(null);

const toggleMenu = () => {
  menuAbierto.value = !menuAbierto.value;
  if (menuAbierto.value) {
    mostrarToastInicial.value = false;
  }
};

const recargar = async () => {
  await cargarAlertas();
};

const abrirDesdeToast = () => {
  mostrarToastInicial.value = false;
  menuAbierto.value = true;
};

const formatearFecha = (fechaStr: string) => {
  if (!fechaStr) return '';
  const [ano, mes, dia] = fechaStr.split('-');
  return `${dia}/${mes}/${ano}`;
};

// Cerrar el menú al hacer clic fuera del componente
const handleClickOutside = (event: MouseEvent) => {
  if (
    contenedorCampanaRef.value &&
    !contenedorCampanaRef.value.contains(event.target as Node)
  ) {
    menuAbierto.value = false;
  }
};

// Cerrar con Escape
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    menuAbierto.value = false;
    mostrarToastInicial.value = false;
  }
};

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeyDown);

  // Carga inicial de alertas
  await cargarAlertas();

  // Si hay vencidos o alertas críticas, mostrar aviso toast sutil
  if (resumen.value.total > 0) {
    mostrarToastInicial.value = true;
    // Ocultar automáticamente después de 8 segundos si no se interactúa
    setTimeout(() => {
      mostrarToastInicial.value = false;
    }, 8000);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeyDown);
});
</script>
