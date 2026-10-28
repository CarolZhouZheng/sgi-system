<template>
  <div
    v-if="abierto && devolucion"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:p-0 print:bg-white"
  >
    <div
      class="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 print:shadow-none print:border-none print:max-w-full"
    >
      <!-- Cabecera del Comprobante -->
      <div class="flex items-start justify-between border-b pb-4 print:border-b-2">
        <div class="flex items-center gap-3">
          <div class="h-12 w-12 rounded-lg bg-[#3D1F0A] flex items-center justify-center text-amber-300 font-serif font-bold text-lg">
            NV
          </div>
          <div>
            <h3 class="text-lg font-bold font-serif text-[#3D1F0A]">Panadería La Nueva Victoria</h3>
            <p class="text-xs text-gray-500">Comprobante de Recepción de Devolución (RF-11)</p>
          </div>
        </div>

        <div class="text-right">
          <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" :class="badgeClase(devolucion.estado)">
            {{ devolucion.estado }}
          </span>
          <p class="mt-1 text-xs font-mono font-bold text-gray-600">
            N° DEV-{{ String(devolucion.id_devolucion).padStart(5, '0') }}
          </p>
        </div>
      </div>

      <!-- Datos del comprobante -->
      <div class="mt-5 space-y-4 text-sm">
        <div class="grid grid-cols-2 gap-4 rounded-xl bg-[#FDF8F3] p-4 border border-amber-900/10">
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-amber-900/60">Fecha de Registro</p>
            <p class="font-semibold text-gray-900">{{ formatearFecha(devolucion.fecha) }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-amber-900/60">Pedido Original</p>
            <p class="font-semibold text-gray-900">Pedido #{{ devolucion.id_pedido }}</p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-amber-900/60">Destinatario / Cliente</p>
            <p class="font-semibold text-gray-900">
              {{ devolucion.pedido?.destinatario?.nombre_empresa || 'Cliente no especificado' }}
            </p>
            <p v-if="devolucion.pedido?.destinatario?.telefono" class="text-xs text-gray-500">
              Tel: {{ devolucion.pedido?.destinatario?.telefono }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-amber-900/60">Responsable Recepción</p>
            <p class="font-semibold text-gray-900">
              {{ devolucion.usuario?.nombre ? `${devolucion.usuario.nombre} ${devolucion.usuario.apellido || ''}` : devolucion.usuario?.nombre_usuario || `Usuario #${devolucion.id_usuario}` }}
            </p>
          </div>
        </div>

        <!-- Detalle de Producto Devuelto -->
        <div class="overflow-hidden rounded-xl border border-gray-200">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th class="px-4 py-2.5">Producto</th>
                <th class="px-4 py-2.5 text-center">Lote</th>
                <th class="px-4 py-2.5 text-right">Cantidad Devuelta</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 bg-white">
              <tr>
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">
                    {{ devolucion.producto?.nombre || `Producto #${devolucion.id_producto}` }}
                  </div>
                  <div class="text-xs text-gray-500">
                    Cat: {{ devolucion.producto?.categoria || 'General' }}
                  </div>
                </td>
                <td class="px-4 py-3 text-center text-xs text-gray-600">
                  {{ devolucion.lote?.numero_lote || 'Sin lote' }}
                </td>
                <td class="px-4 py-3 text-right">
                  <span class="text-base font-bold text-[#C4620A]">
                    {{ devolucion.cantidad_devuelta }}
                  </span>
                  <span class="ml-1 text-xs text-gray-500">
                    {{ devolucion.producto?.unidad_medida || 'unidades' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Motivo y Observaciones -->
        <div class="space-y-2">
          <div class="rounded-lg bg-gray-50 p-3">
            <p class="text-xs font-semibold text-gray-700">Motivo de Devolución:</p>
            <p class="mt-0.5 text-gray-800">{{ devolucion.motivo }}</p>
          </div>

          <div v-if="devolucion.observaciones" class="rounded-lg bg-gray-50 p-3">
            <p class="text-xs font-semibold text-gray-700">Observaciones adicionales:</p>
            <p class="mt-0.5 text-gray-600 italic">{{ devolucion.observaciones }}</p>
          </div>

          <div
            v-if="devolucion.estado === 'APROBADA'"
            class="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800 flex items-center gap-2"
          >
            <svg class="h-4 w-4 flex-shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>
              <strong>Inventario Actualizado:</strong> Esta cantidad fue reingresada al stock disponible y registrada en el reporte de movimientos como ENTRADA (DEVOLUCION).
            </span>
          </div>
        </div>
      </div>

      <!-- Pie y Botones de Acción -->
      <div class="mt-6 flex items-center justify-end gap-3 border-t pt-4 print:hidden">
        <button
          type="button"
          class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition"
          @click="$emit('cerrar')"
        >
          Cerrar
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-lg bg-[#3D1F0A] px-4 py-2 text-sm font-medium text-white hover:bg-[#2B1506] shadow-sm transition"
          @click="imprimir"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir Comprobante
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DevolucionDetalle } from '../../../server/models/devolucion.model';

defineProps<{
  abierto: boolean;
  devolucion: DevolucionDetalle | null;
}>();

defineEmits<{
  (e: 'cerrar'): void;
}>();

function badgeClase(estado?: string) {
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

function imprimir() {
  window.print();
}
</script>
