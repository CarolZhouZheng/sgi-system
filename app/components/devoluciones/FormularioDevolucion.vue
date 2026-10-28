<template>
  <div
    v-if="abierto"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto"
  >
    <div
      class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 my-8"
    >
      <!-- Cabecera del Modal -->
      <div class="flex items-start justify-between border-b pb-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="rounded-lg bg-[#C4620A]/10 p-2 text-[#C4620A]">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
              </svg>
            </span>
            <h2 class="text-xl font-bold font-serif text-[#3D1F0A]">Registrar Devolución (RF-11)</h2>
          </div>
          <p class="mt-1 text-xs text-gray-500">
            Ingreso de producto devuelto por destinatario según pedido despachado.
          </p>
        </div>

        <button
          type="button"
          class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          @click="$emit('cerrar')"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Alertas de estado -->
      <div
        v-if="errorMensaje"
        class="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800 flex items-start gap-2.5"
      >
        <svg class="h-5 w-5 flex-shrink-0 text-rose-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ errorMensaje }}</span>
      </div>

      <!-- Formulario -->
      <form class="mt-5 space-y-4 text-sm" @submit.prevent="guardarDevolucion">
        <!-- Paso 1: Selección de Pedido -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Pedido Asociado *
            </label>
            <select
              v-model.number="form.id_pedido"
              required
              :disabled="cargandoPedidos || guardando"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C4620A] focus:ring-1 focus:ring-[#C4620A] outline-none transition"
              @change="alCambiarPedido"
            >
              <option :value="0" disabled>
                {{ cargandoPedidos ? 'Cargando pedidos...' : '— Seleccione un pedido despachado —' }}
              </option>
              <option
                v-for="p in pedidosElegibles"
                :key="p.id_pedido"
                :value="p.id_pedido"
              >
                Pedido #{{ p.id_pedido }} — {{ p.destinatario?.nombre_empresa || 'Cliente' }} ({{ p.estado }})
              </option>
            </select>
          </div>

          <!-- Destinatario (automático del pedido) -->
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Destinatario / Cliente
            </label>
            <input
              type="text"
              readonly
              :value="destinatarioNombre"
              placeholder="Se autocompleta con el pedido"
              class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none"
            />
          </div>
        </div>

        <!-- Paso 2: Selección de Producto y Cantidad -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Producto Devuelto *
            </label>
            <select
              v-model.number="form.id_producto"
              required
              :disabled="!form.id_pedido || guardando"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C4620A] focus:ring-1 focus:ring-[#C4620A] outline-none transition disabled:bg-gray-100"
              @change="alCambiarProducto"
            >
              <option :value="0" disabled>
                {{ form.id_pedido ? '— Seleccione el producto del pedido —' : 'Primero seleccione un pedido' }}
              </option>
              <option
                v-for="det in productosDelPedido"
                :key="det.id_producto"
                :value="det.id_producto"
              >
                {{ det.producto?.nombre || `Producto #${det.id_producto}` }} (Despachado: {{ det.cantidad_entregada || det.cantidad }} {{ det.producto?.unidad_medida || 'u' }})
              </option>
            </select>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Cantidad a Devolver *
              </label>
              <span v-if="productoSeleccionadoDetalle" class="text-[0.7rem] text-amber-800 font-medium">
                Tope despachado: {{ maximoDevolvible }} {{ productoSeleccionadoDetalle.producto?.unidad_medida || 'u' }}
              </span>
            </div>
            <input
              v-model.number="form.cantidad_devuelta"
              type="number"
              step="any"
              min="0.01"
              :max="maximoDevolvible"
              required
              :disabled="!form.id_producto || guardando"
              placeholder="Ej: 10"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C4620A] focus:ring-1 focus:ring-[#C4620A] outline-none transition disabled:bg-gray-100"
            />
          </div>
        </div>

        <!-- Paso 3: Motivo y Fecha -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Motivo de la Devolución *
            </label>
            <select
              v-model="motivoPredefinido"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C4620A] focus:ring-1 focus:ring-[#C4620A] outline-none transition"
              @change="alCambiarMotivoPredefinido"
            >
              <option value="Pan en mal estado / Descomposición">Pan en mal estado / Descomposición</option>
              <option value="Producto golpeado o dañado en transporte">Producto golpeado o dañado en transporte</option>
              <option value="Error en tipo de producto entregado">Error en tipo de producto entregado</option>
              <option value="Exceso de cantidad no solicitada">Exceso de cantidad no solicitada</option>
              <option value="Fecha de vencimiento próxima / Caducado">Fecha de vencimiento próxima / Caducado</option>
              <option value="Rechazo o cancelación por el cliente">Rechazo o cancelación por el cliente</option>
              <option value="OTRO">Otro motivo personalizado...</option>
            </select>

            <input
              v-if="motivoPredefinido === 'OTRO'"
              v-model="form.motivo"
              type="text"
              required
              maxlength="150"
              placeholder="Describa el motivo detallado..."
              class="mt-2 w-full rounded-lg border border-amber-300 bg-amber-50/50 px-3 py-2 text-sm focus:border-[#C4620A] focus:ring-1 focus:ring-[#C4620A] outline-none transition"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Fecha de Devolución *
            </label>
            <input
              v-model="form.fecha"
              type="date"
              required
              :disabled="guardando"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C4620A] focus:ring-1 focus:ring-[#C4620A] outline-none transition"
            />
          </div>
        </div>

        <!-- Paso 4: Estado y Efecto sobre el Inventario -->
        <div class="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Clasificación / Estado de la Devolución *
          </label>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label
              class="flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition"
              :class="form.estado === 'APROBADA' ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'"
            >
              <input
                v-model="form.estado"
                type="radio"
                value="APROBADA"
                class="mt-1 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <p class="font-bold text-xs">APROBADA (Reingreso)</p>
                <p class="text-[0.7rem] text-gray-500 mt-0.5">
                  Pan apto: suma al stock y crea movimiento de inventario (ENTRADA).
                </p>
              </div>
            </label>

            <label
              class="flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition"
              :class="form.estado === 'PENDIENTE' ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'"
            >
              <input
                v-model="form.estado"
                type="radio"
                value="PENDIENTE"
                class="mt-1 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <p class="font-bold text-xs">PENDIENTE</p>
                <p class="text-[0.7rem] text-gray-500 mt-0.5">
                  Por inspeccionar. No altera stock hasta ser aprobada.
                </p>
              </div>
            </label>

            <label
              class="flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition"
              :class="form.estado === 'RECHAZADA' ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'"
            >
              <input
                v-model="form.estado"
                type="radio"
                value="RECHAZADA"
                class="mt-1 text-rose-600 focus:ring-rose-500"
              />
              <div>
                <p class="font-bold text-xs">RECHAZADA (Merma)</p>
                <p class="text-[0.7rem] text-gray-500 mt-0.5">
                  Dañado o caducado: no apto para reingresar a venta.
                </p>
              </div>
            </label>
          </div>
        </div>

        <!-- Observaciones -->
        <div>
          <label class="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
            Observaciones (Opcional)
          </label>
          <textarea
            v-model="form.observaciones"
            rows="2"
            maxlength="500"
            placeholder="Detalles sobre el empaque, lote, condiciones o acuerdos con el cliente..."
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#C4620A] focus:ring-1 focus:ring-[#C4620A] outline-none transition"
          ></textarea>
        </div>

        <!-- Acciones -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            :disabled="guardando"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            @click="$emit('cerrar')"
          >
            Cancelar
          </button>

          <button
            type="submit"
            :disabled="guardando || !form.id_pedido || !form.id_producto || !form.cantidad_devuelta"
            class="inline-flex items-center gap-2 rounded-lg bg-[#C4620A] px-5 py-2 text-sm font-medium text-white hover:bg-[#A85108] shadow-sm transition disabled:opacity-50"
          >
            <svg
              v-if="guardando"
              class="h-4 w-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ guardando ? 'Registrando...' : 'Registrar Devolución' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import type { EstadoDevolucion } from '../../../server/models/devolucion.model';

const props = defineProps<{
  abierto: boolean;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'guardado', devolucion: any): void;
}>();

const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica' }).format(new Date());

const form = reactive({
  id_pedido: 0,
  id_producto: 0,
  cantidad_devuelta: null as number | null,
  motivo: 'Pan en mal estado / Descomposición',
  fecha: hoy,
  estado: 'APROBADA' as EstadoDevolucion,
  observaciones: '',
});

const motivoPredefinido = ref('Pan en mal estado / Descomposición');
const pedidosElegibles = ref<any[]>([]);
const cargandoPedidos = ref(false);
const guardando = ref(false);
const errorMensaje = ref('');

const pedidoSeleccionado = computed(() => {
  return pedidosElegibles.value.find((p) => p.id_pedido === form.id_pedido);
});

const destinatarioNombre = computed(() => {
  return pedidoSeleccionado.value?.destinatario?.nombre_empresa || '';
});

const productosDelPedido = computed(() => {
  return pedidoSeleccionado.value?.detalle_pedido || [];
});

const productoSeleccionadoDetalle = computed(() => {
  return productosDelPedido.value.find((d: any) => d.id_producto === form.id_producto);
});

const maximoDevolvible = computed(() => {
  if (!productoSeleccionadoDetalle.value) return 999999;
  return Number(productoSeleccionadoDetalle.value.cantidad_entregada || productoSeleccionadoDetalle.value.cantidad || 0);
});

function alCambiarPedido() {
  form.id_producto = 0;
  form.cantidad_devuelta = null;
  errorMensaje.value = '';
}

function alCambiarProducto() {
  errorMensaje.value = '';
  if (productoSeleccionadoDetalle.value && !form.cantidad_devuelta) {
    // Sugerencia inicial: cantidad despachada
    form.cantidad_devuelta = maximoDevolvible.value;
  }
}

function alCambiarMotivoPredefinido() {
  if (motivoPredefinido.value !== 'OTRO') {
    form.motivo = motivoPredefinido.value;
  } else {
    form.motivo = '';
  }
}

async function cargarPedidos() {
  cargandoPedidos.value = true;
  errorMensaje.value = '';
  try {
    const res: any = await $fetch('/api/devoluciones/pedidos-elegibles');
    pedidosElegibles.value = res?.data || [];
  } catch (err: any) {
    errorMensaje.value = 'No se pudieron cargar los pedidos elegibles para devolución.';
  } finally {
    cargandoPedidos.value = false;
  }
}

async function guardarDevolucion() {
  errorMensaje.value = '';

  if (!form.id_pedido || !form.id_producto) {
    errorMensaje.value = 'Seleccione el pedido y el producto a devolver.';
    return;
  }

  if (!form.cantidad_devuelta || form.cantidad_devuelta <= 0) {
    errorMensaje.value = 'La cantidad devuelta debe ser mayor a 0.';
    return;
  }

  if (form.cantidad_devuelta > maximoDevolvible.value) {
    errorMensaje.value = `La cantidad devuelta no puede superar la cantidad despachada (${maximoDevolvible.value}).`;
    return;
  }

  const motivoFinal = motivoPredefinido.value === 'OTRO' ? form.motivo : motivoPredefinido.value;
  if (!motivoFinal || motivoFinal.trim().length < 3) {
    errorMensaje.value = 'Ingrese un motivo de devolución válido (mínimo 3 caracteres).';
    return;
  }

  guardando.value = true;
  try {
    const res: any = await $fetch('/api/devoluciones', {
      method: 'POST',
      body: {
        id_pedido: form.id_pedido,
        id_producto: form.id_producto,
        cantidad_devuelta: form.cantidad_devuelta,
        motivo: motivoFinal.trim(),
        fecha: form.fecha,
        estado: form.estado,
        observaciones: form.observaciones ? form.observaciones.trim() : null,
      },
    });

    emit('guardado', res?.data);
  } catch (err: any) {
    errorMensaje.value = err.data?.statusMessage || err.message || 'Error al registrar la devolución.';
  } finally {
    guardando.value = false;
  }
}

watch(
  () => props.abierto,
  (abierto) => {
    if (abierto) {
      errorMensaje.value = '';
      form.id_pedido = 0;
      form.id_producto = 0;
      form.cantidad_devuelta = null;
      form.fecha = hoy;
      form.estado = 'APROBADA';
      form.observaciones = '';
      motivoPredefinido.value = 'Pan en mal estado / Descomposición';
      form.motivo = motivoPredefinido.value;
      cargarPedidos();
    }
  }
);

onMounted(() => {
  if (props.abierto) {
    cargarPedidos();
  }
});
</script>
