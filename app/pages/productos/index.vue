<template>
  <div class="space-y-6">
    <!-- Componente de Registro de Producto (RF-01) -->
    <AgregarProducto @producto-creado="onProductoCreado" />

    <!-- Componente de Listado y Gestión de Productos (RF-04 + RF-05) -->
    <ListadoProductos
      ref="listadoRef"
      @editar="onEditarProducto"
    />

    <!-- Componente de Modal de Actualización (RF-03) -->
    <ActualizarProducto
      ref="actualizarRef"
      @producto-actualizado="onProductoActualizado"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AgregarProducto from '~/components/productos/AgregarProducto/AgregarProducto.vue';
import ListadoProductos from '~/components/productos/ListadoProductos/ListadoProductos.vue';
import ActualizarProducto from '~/components/productos/ActualizarProducto/ActualizarProducto.vue';
import type { Producto } from '~/components/productos/ListadoProductos/ListadoProductos';

// Referencias a los componentes hijos
const listadoRef = ref<InstanceType<typeof ListadoProductos> | null>(null);
const actualizarRef = ref<InstanceType<typeof ActualizarProducto> | null>(null);

// Cuando se crea un producto en RF-01, recargar el listado
const onProductoCreado = () => {
  listadoRef.value?.fetchProductos();
};

// Cuando se solicita editar un producto desde RF-04, abrir el modal en RF-03
const onEditarProducto = (producto: Producto) => {
  actualizarRef.value?.abrirModalEdicion(producto);
};

// Cuando se guarda la edición en RF-03, actualizar el estado local del listado
const onProductoActualizado = (productoActualizado: Producto) => {
  listadoRef.value?.actualizarProductoLocal(productoActualizado);
};
</script>
