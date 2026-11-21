<template>
  <div class="space-y-6">
    <!-- ===== INICIO DE MI IMPLEMENTACIÓN - RF-01 ===== -->
    <!-- Muestra el formulario de Registro de Producto (AgregarProducto.vue). -->
    <!-- CONEXIÓN: Escucha el aviso @producto-creado y ejecuta onProductoCreado para actualizar la tabla de abajo. -->
    <AgregarProducto @producto-creado="onProductoCreado" />
    <!-- ===== FIN DE MI IMPLEMENTACIÓN - RF-01 ===== -->

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
// ===== INICIO DE MI IMPLEMENTACIÓN - RF-01 (Importación del componente) =====
import AgregarProducto from '~/components/productos/AgregarProducto/AgregarProducto.vue';
// ===== FIN DE MI IMPLEMENTACIÓN - RF-01 =====
import ListadoProductos from '~/components/productos/ListadoProductos/ListadoProductos.vue';
import ActualizarProducto from '~/components/productos/ActualizarProducto/ActualizarProducto.vue';
import type { Producto } from '~/components/productos/ListadoProductos/ListadoProductos';

// Referencias a los componentes hijos
const listadoRef = ref<InstanceType<typeof ListadoProductos> | null>(null);
const actualizarRef = ref<InstanceType<typeof ActualizarProducto> | null>(null);

// ===== INICIO DE MI IMPLEMENTACIÓN - RF-01 =====
// Esta función se ejecuta cuando AgregarProducto.vue termina de guardar un producto nuevo.
// CONEXIÓN: Llama a fetchProductos() de ListadoProductos para que el nuevo producto aparezca en la tabla sin recargar la página.
const onProductoCreado = () => {
  listadoRef.value?.fetchProductos();
};
// ===== FIN DE MI IMPLEMENTACIÓN - RF-01 =====
// NOTA: Las funciones de abajo pertenecen a otros tickets (RF-03 y RF-04).

// Cuando se solicita editar un producto desde RF-04, abrir el modal en RF-03
const onEditarProducto = (producto: Producto) => {
  actualizarRef.value?.abrirModalEdicion(producto);
};

// Cuando se guarda la edición en RF-03, actualizar el estado local del listado
const onProductoActualizado = (productoActualizado: Producto) => {
  listadoRef.value?.actualizarProductoLocal(productoActualizado);
};
</script>
