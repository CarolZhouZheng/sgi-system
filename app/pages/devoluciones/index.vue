<template>
  <main class="min-h-screen bg-[#FDF8F3] px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <!-- Encabezado de la página -->
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-amber-900/10 pb-5">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-3xl font-bold font-serif text-[#3D1F0A]">Gestión de Devoluciones</h1>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 border border-amber-200">
              RF-11
            </span>
          </div>
          <p class="mt-1 text-sm text-[#3D1F0A]/70">
            Control de logística inversa, reingreso de pan al inventario y generación de comprobantes.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-[#C4620A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#A85108] transition"
            @click="modalFormulario = true"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Registrar Devolución
          </button>
        </div>
      </header>

      <!-- Componente de Listado y Métricas -->
      <ListadoDevoluciones
        ref="listadoRef"
        @ver-comprobante="abrirComprobante"
      />

      <!-- Modal Formulario de Registro -->
      <FormularioDevolucion
        :abierto="modalFormulario"
        @cerrar="modalFormulario = false"
        @guardado="onDevolucionGuardada"
      />

      <!-- Modal de Comprobante / Recibo -->
      <ModalComprobanteDevolucion
        :abierto="modalComprobante"
        :devolucion="devolucionSeleccionada"
        @cerrar="modalComprobante = false"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ListadoDevoluciones from '~/components/devoluciones/ListadoDevoluciones.vue';
import FormularioDevolucion from '~/components/devoluciones/FormularioDevolucion.vue';
import ModalComprobanteDevolucion from '~/components/devoluciones/ModalComprobanteDevolucion.vue';
import type { DevolucionDetalle } from '../../../server/models/devolucion.model';

useHead({
  title: 'Gestión de Devoluciones | La Nueva Victoria',
});

const listadoRef = ref<any>(null);
const modalFormulario = ref(false);
const modalComprobante = ref(false);
const devolucionSeleccionada = ref<DevolucionDetalle | null>(null);

function abrirComprobante(dev: DevolucionDetalle) {
  devolucionSeleccionada.value = dev;
  modalComprobante.value = true;
}

function onDevolucionGuardada(nuevaDev: any) {
  modalFormulario.value = false;
  listadoRef.value?.cargarDevoluciones();
  if (nuevaDev) {
    devolucionSeleccionada.value = nuevaDev;
    modalComprobante.value = true;
  }
}
</script>
