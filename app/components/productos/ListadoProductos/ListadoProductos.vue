<template>
  <section class="bg-white border border-[#E8D5BC] rounded-[10px] p-6 shadow-xs">
    <!-- Encabezado con estilo del prototipo -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between pb-4 mb-6 border-b border-[#E8D5BC] gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#FAEEDA] text-[#854F0B] border border-[#E8D5BC]">
            RF-04
          </span>
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#EAF3DE] text-[#3B6D11] border border-[#C0DD97]">
            <span class="w-1.5 h-1.5 rounded-full bg-[#3B6D11] animate-pulse"></span>
            RF-05 Realtime
          </span>
          <h2 class="text-xl font-bold font-serif text-[#1A0A00]">
            Gestión y Listado de Productos
          </h2>
        </div>
        <p class="text-xs text-[#7A5A3A]">
          Baja lógica, reactivación y control de inventario con sincronización en tiempo real.
        </p>
      </div>

      <!-- Barra de Filtros por Estado -->
      <div class="flex items-center gap-1.5 bg-[#FDFAF6] border border-[#E8D5BC] p-1 rounded-[8px]">
        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-[6px] text-xs font-semibold transition',
            filtroSeleccionado === 'todos'
              ? 'bg-[#C4620A] text-white shadow-xs'
              : 'text-[#7A5A3A] hover:bg-[#FDF0E6] hover:text-[#1A0A00]',
          ]"
          @click="cambiarFiltro('todos')"
        >
          Todos ({{ conteos.todos }})
        </button>

        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-[6px] text-xs font-semibold transition',
            filtroSeleccionado === 'activos'
              ? 'bg-[#3B6D11] text-white shadow-xs'
              : 'text-[#7A5A3A] hover:bg-[#EAF3DE] hover:text-[#3B6D11]',
          ]"
          @click="cambiarFiltro('activos')"
        >
          Activos ({{ conteos.activos }})
        </button>

        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-[6px] text-xs font-semibold transition',
            filtroSeleccionado === 'inactivos'
              ? 'bg-[#A32D2D] text-white shadow-xs'
              : 'text-[#7A5A3A] hover:bg-[#FCEBEB] hover:text-[#A32D2D]',
          ]"
          @click="cambiarFiltro('inactivos')"
        >
          Inactivos ({{ conteos.inactivos }})
        </button>
      </div>
    </div>

    <!-- Barra de búsqueda del prototipo -->
    <div class="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div class="relative flex-1 max-w-md">
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar producto por nombre o categoría..."
          class="w-full rounded-[8px] border border-[#E8D5BC] bg-white px-3.5 py-2 pl-9 text-xs text-[#1A0A00] placeholder-[#7A5A3A]/60 outline-none transition focus:border-[#C4620A]"
        />
        <svg
          class="absolute left-3 top-2.5 h-4 w-4 text-[#7A5A3A]/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div class="text-xs text-[#7A5A3A]">
        Mostrando <strong>{{ productosFiltrados.length }}</strong> de <strong>{{ productos.length }}</strong> productos
      </div>
    </div>

    <!-- Alertas de operaciones de lista -->
    <div
      v-if="listMessage"
      class="mb-4 rounded-[8px] border border-[#C0DD97] bg-[#EAF3DE] px-4 py-3 text-xs text-[#3B6D11] flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <span class="font-bold">✓</span>
        <span>{{ listMessage }}</span>
      </div>
      <button
        type="button"
        class="text-xs font-bold text-[#3B6D11]/70 hover:text-[#3B6D11]"
        @click="listMessage = null"
      >
        ✕
      </button>
    </div>

    <div
      v-if="listError"
      class="mb-4 rounded-[8px] border border-[#F7C1C1] bg-[#FCEBEB] px-4 py-3 text-xs text-[#A32D2D] flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <span class="font-bold">✕</span>
        <span>{{ listError }}</span>
      </div>
      <button
        type="button"
        class="text-xs font-bold text-[#A32D2D]/70 hover:text-[#A32D2D]"
        @click="listError = null"
      >
        ✕
      </button>
    </div>

    <!-- Estado de Carga -->
    <div
      v-if="isLoadingList"
      class="flex flex-col items-center justify-center py-12 text-[#7A5A3A]"
    >
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-[#C4620A] border-t-transparent"></div>
      <p class="mt-3 text-xs font-medium">Cargando productos del inventario...</p>
    </div>

    <!-- Estado Vacío -->
    <div
      v-else-if="productosFiltrados.length === 0"
      class="rounded-[8px] border border-dashed border-[#E8D5BC] bg-[#FDFAF6] py-12 text-center text-[#7A5A3A]"
    >
      <p class="text-sm font-medium">No se encontraron productos con el filtro seleccionado.</p>
      <p class="text-xs text-[#7A5A3A]/70 mt-1">Pruebe cambiando el filtro o agregando un nuevo producto.</p>
    </div>

    <!-- Tabla de Productos con Estilo del Prototipo -->
    <div
      v-else
      class="overflow-x-auto rounded-[8px] border border-[#E8D5BC]"
    >
      <table class="w-full text-left text-xs font-sans border-collapse">
        <thead class="bg-[#FDFAF6] border-b-[1.5px] border-[#E8D5BC]">
          <tr>
            <th class="px-4 py-3 text-[0.72rem] font-bold uppercase tracking-wider text-[#7A5A3A]">
              ID
            </th>
            <th class="px-4 py-3 text-[0.72rem] font-bold uppercase tracking-wider text-[#7A5A3A]">
              Producto
            </th>
            <th class="px-4 py-3 text-[0.72rem] font-bold uppercase tracking-wider text-[#7A5A3A]">
              Categoría
            </th>
            <th class="px-4 py-3 text-[0.72rem] font-bold uppercase tracking-wider text-[#7A5A3A]">
              Unidad
            </th>
            <th class="px-4 py-3 text-[0.72rem] font-bold uppercase tracking-wider text-[#7A5A3A]">
              Stock
            </th>
            <th class="px-4 py-3 text-[0.72rem] font-bold uppercase tracking-wider text-[#7A5A3A]">
              Estado
            </th>
            <th class="px-4 py-3 text-right text-[0.72rem] font-bold uppercase tracking-wider text-[#7A5A3A]">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#E8D5BC] bg-white">
          <tr
            v-for="p in productosFiltrados"
            :key="p.id_producto"
            class="hover:bg-[#FEF6EE] transition"
          >
            <!-- ID -->
            <td class="px-4 py-3 font-mono text-[#7A5A3A] font-medium">
              #{{ p.id_producto }}
            </td>

            <!-- Nombre y Descripción -->
            <td class="px-4 py-3">
              <div class="font-semibold text-[#1A0A00]">
                {{ p.nombre }}
              </div>
              <p v-if="p.descripcion" class="text-[0.72rem] text-[#7A5A3A] line-clamp-1">
                {{ p.descripcion }}
              </p>
            </td>

            <!-- Categoría -->
            <td class="px-4 py-3 text-[#1A0A00]">
              {{ p.categoria || '—' }}
            </td>

            <!-- Unidad de medida -->
            <td class="px-4 py-3 text-[#7A5A3A]">
              {{ p.unidad_medida }}
            </td>

            <!-- Stock -->
            <td class="px-4 py-3">
              <span
                v-if="p.stock_actual <= p.stock_minimo"
                class="inline-flex items-center px-2 py-0.5 rounded text-[0.72rem] font-bold bg-[#FAEEDA] text-[#854F0B] border border-[#E8D5BC]"
                title="Stock bajo o en nivel mínimo"
              >
                {{ p.stock_actual }} (mín. {{ p.stock_minimo }})
              </span>
              <span v-else class="font-semibold text-[#1A0A00]">
                {{ p.stock_actual }}
              </span>
            </td>

            <!-- Estado -->
            <td class="px-4 py-3">
              <span
                v-if="p.estado"
                class="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3DE] px-2.5 py-0.5 text-[0.72rem] font-semibold text-[#3B6D11]"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-[#3B6D11]"></span>
                Activo
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1.5 rounded-full bg-[#FCEBEB] px-2.5 py-0.5 text-[0.72rem] font-semibold text-[#A32D2D]"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-[#A32D2D]"></span>
                Inactivo
              </span>
            </td>

            <!-- Acciones -->
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <!-- Botón Editar (RF-03) -->
                <button
                  v-if="p.estado"
                  type="button"
                  class="rounded-[6px] border border-[#E8D5BC] bg-white px-2.5 py-1 text-xs font-semibold text-[#1A0A00] transition hover:bg-[#FDF0E6] hover:border-[#C4620A]"
                  :disabled="isActionLoading === p.id_producto"
                  title="Editar producto"
                  @click="$emit('editar', p)"
                >
                  Editar
                </button>

                <!-- Botón Baja (RF-04) -->
                <button
                  v-if="p.estado"
                  type="button"
                  class="rounded-[6px] border border-[#F7C1C1] bg-[#FCEBEB] px-2.5 py-1 text-xs font-semibold text-[#A32D2D] transition hover:bg-[#F7C1C1]"
                  :disabled="isActionLoading === p.id_producto"
                  title="Dar de baja producto"
                  @click="abrirModalConfirmacion(p, 'baja')"
                >
                  <span v-if="isActionLoading === p.id_producto">...</span>
                  <span v-else>Baja</span>
                </button>

                <!-- Botón Reactivar (RF-04) -->
                <button
                  v-else
                  type="button"
                  class="rounded-[6px] border border-[#C0DD97] bg-[#EAF3DE] px-2.5 py-1 text-xs font-semibold text-[#3B6D11] transition hover:bg-[#C0DD97]"
                  :disabled="isActionLoading === p.id_producto"
                  title="Reactivar producto"
                  @click="abrirModalConfirmacion(p, 'reactivar')"
                >
                  <span v-if="isActionLoading === p.id_producto">...</span>
                  <span v-else>Reactivar</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de Confirmación (Baja / Reactivación) -->
    <div
      v-if="modal.abierto"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      @click.self="cerrarModal()"
    >
      <div class="w-full max-w-md rounded-[14px] border border-[#E8D5BC] bg-white p-6 shadow-2xl">
        <div class="mb-4 flex items-center gap-3">
          <div
            :class="[
              'flex h-10 w-10 items-center justify-center rounded-full text-base font-bold',
              modal.tipo === 'baja' ? 'bg-[#FCEBEB] text-[#A32D2D]' : 'bg-[#EAF3DE] text-[#3B6D11]',
            ]"
          >
            {{ modal.tipo === 'baja' ? '⚠️' : '↺' }}
          </div>
          <div>
            <h3 class="font-serif text-base font-bold text-[#1A0A00]">
              {{ modal.tipo === 'baja' ? 'Confirmar Baja de Producto' : 'Confirmar Reactivación' }}
            </h3>
            <p class="text-xs text-[#7A5A3A]">
              {{ modal.tipo === 'baja' ? 'Baja lógica en el sistema' : 'Reactivación de estado' }}
            </p>
          </div>
        </div>

        <p class="mb-5 text-xs text-[#1A0A00] leading-relaxed">
          <template v-if="modal.tipo === 'baja'">
            ¿Está seguro de dar de <strong>baja</strong> el producto:
            <br />
            <strong class="text-sm font-serif text-[#C4620A] block my-1">
              {{ modal.producto?.nombre }}
            </strong>
            <span class="text-[#7A5A3A] block text-[0.72rem]">
              El producto pasará a estado inactivo sin eliminación física para preservar el historial de movimientos de inventario.
            </span>
          </template>
          <template v-else>
            ¿Desea volver a <strong>activar</strong> el producto:
            <br />
            <strong class="text-sm font-serif text-[#3B6D11] block my-1">
              {{ modal.producto?.nombre }}
            </strong>
          </template>
        </p>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#E8D5BC]">
          <button
            type="button"
            class="rounded-[7px] border border-[#E8D5BC] bg-white px-4 py-2 text-xs font-semibold text-[#7A5A3A] hover:bg-[#FDF0E6] hover:text-[#1A0A00] transition"
            :disabled="isActionLoading !== null"
            @click="cerrarModal()"
          >
            Cancelar
          </button>

          <button
            type="button"
            :class="[
              'rounded-[7px] px-4 py-2 text-xs font-semibold text-white transition shadow-xs',
              modal.tipo === 'baja'
                ? 'bg-[#A32D2D] hover:bg-[#7D2020]'
                : 'bg-[#3B6D11] hover:bg-[#2F570E]',
            ]"
            :disabled="isActionLoading !== null"
            @click="ejecutarAccionModal"
          >
            <span v-if="isActionLoading !== null">Procesando...</span>
            <span v-else>
              {{ modal.tipo === 'baja' ? 'Confirmar Baja' : 'Confirmar Reactivación' }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useListadoProductos, type Producto } from './ListadoProductos';

defineEmits<{
  (e: 'editar', producto: Producto): void;
}>();

const {
  productos,
  isLoadingList,
  listMessage,
  listError,
  isActionLoading,
  filtroSeleccionado,
  busqueda,
  modal,
  conteos,
  productosFiltrados,
  cambiarFiltro,
  fetchProductos,
  abrirModalConfirmacion,
  cerrarModal,
  ejecutarAccionModal,
  actualizarProductoLocal,
} = useListadoProductos();

defineExpose({
  fetchProductos,
  actualizarProductoLocal,
});
</script>
