<template>
  <div class="page-container">
    <div class="main-content">
      <!-- TARJETA 1: Registro de Producto (RF-01) -->
      <div class="card">
        <header class="card-header">
          <div class="badge-tag">RF-01</div>
          <h1 class="title">Registro de Producto</h1>
          <p class="subtitle">Ingrese los datos para registrar un nuevo producto en el sistema.</p>
        </header>

        <!-- Mensaje de éxito -->
        <div v-if="successMessage" class="alert alert-success">
          <span>✓ {{ successMessage }}</span>
        </div>

        <!-- Mensaje de error general -->
        <div v-if="errorMessage" class="alert alert-error">
          <span>✕ {{ errorMessage }}</span>
        </div>

        <!-- Errores de validación de campos -->
        <div v-if="validationErrors.length > 0" class="alert alert-warning">
          <p class="warning-title">Por favor revise los siguientes campos:</p>
          <ul class="error-list">
            <li v-for="(err, index) in validationErrors" :key="index">
              <strong>{{ err.campo }}:</strong> {{ err.mensaje }}
            </li>
          </ul>
        </div>

        <form @submit.prevent="submitForm" class="form">
          <!-- Nombre -->
          <div class="form-group">
            <label for="nombre" class="label">
              Nombre <span class="required">*</span>
            </label>
            <input
              id="nombre"
              v-model="form.nombre"
              type="text"
              maxlength="150"
              placeholder="Ej. Pan dulce de mantequilla"
              class="input"
              required
            />
          </div>

          <!-- Descripción -->
          <div class="form-group">
            <label for="descripcion" class="label">Descripción</label>
            <textarea
              id="descripcion"
              v-model="form.descripcion"
              rows="2"
              placeholder="Breve descripción o detalles del producto"
              class="textarea"
            ></textarea>
          </div>

          <!-- Fila: Categoría y Unidad de Medida -->
          <div class="form-row">
            <div class="form-group col">
              <label for="categoria" class="label">Categoría</label>
              <input
                id="categoria"
                v-model="form.categoria"
                type="text"
                maxlength="100"
                placeholder="Ej. Panadería, Repostería"
                class="input"
              />
            </div>

            <div class="form-group col">
              <label for="unidad_medida" class="label">
                Unidad de medida <span class="required">*</span>
              </label>
              <input
                id="unidad_medida"
                v-model="form.unidad_medida"
                type="text"
                maxlength="30"
                placeholder="Ej. unidad, kg, pieza"
                class="input"
                required
              />
            </div>
          </div>

          <!-- Fila: Stock Actual y Stock Mínimo -->
          <div class="form-row">
            <div class="form-group col">
              <label for="stock_actual" class="label">Stock actual</label>
              <input
                id="stock_actual"
                v-model.number="form.stock_actual"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                class="input"
              />
            </div>

            <div class="form-group col">
              <label for="stock_minimo" class="label">Stock mínimo</label>
              <input
                id="stock_minimo"
                v-model.number="form.stock_minimo"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                class="input"
              />
            </div>
          </div>

          <!-- Estado (Activo / Inactivo) -->
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input
                id="estado"
                v-model="form.estado"
                type="checkbox"
                class="checkbox"
              />
              <span class="checkbox-text">Producto activo al registrar</span>
            </label>
          </div>

          <!-- Botón de envío -->
          <div class="form-actions">
            <button
              type="submit"
              class="submit-button"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">Registrando...</span>
              <span v-else>Registrar Producto</span>
            </button>
          </div>
        </form>
      </div>

      <!-- TARJETA 2: Listado y Gestión de Bajas (RF-04) -->
      <div class="card list-card">
        <header class="card-header list-header">
          <div class="header-left">
            <div class="badge-tag tag-purple">RF-04</div>
            <h2 class="title">Gestión y Baja de Productos</h2>
            <p class="subtitle">Baja lógica y reactivación de consumibles sin pérdida física en la BD.</p>
          </div>

          <!-- Barra de Filtros -->
          <div class="filter-group">
            <span class="filter-label">Filtrar:</span>
            <div class="tabs">
              <button
                type="button"
                :class="['tab-btn', { active: filtroSeleccionado === 'todos' }]"
                @click="cambiarFiltro('todos')"
              >
                Todos ({{ conteos.todos }})
              </button>
              <button
                type="button"
                :class="['tab-btn', { active: filtroSeleccionado === 'activos' }]"
                @click="cambiarFiltro('activos')"
              >
                Activos ({{ conteos.activos }})
              </button>
              <button
                type="button"
                :class="['tab-btn', { active: filtroSeleccionado === 'inactivos' }]"
                @click="cambiarFiltro('inactivos')"
              >
                Inactivos ({{ conteos.inactivos }})
              </button>
            </div>
          </div>
        </header>

        <!-- Alerta de acciones de la lista -->
        <div v-if="listMessage" class="alert alert-success">
          <span>✓ {{ listMessage }}</span>
        </div>
        <div v-if="listError" class="alert alert-error">
          <span>✕ {{ listError }}</span>
        </div>

        <!-- Estado de Carga -->
        <div v-if="isLoadingList" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando productos...</p>
        </div>

        <!-- Sin registros -->
        <div v-else-if="productosFiltrados.length === 0" class="empty-state">
          <p>No se encontraron productos con el filtro seleccionado.</p>
        </div>

        <!-- Tabla de Productos -->
        <div v-else class="table-responsive">
          <table class="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Unidad</th>
                <th>Stock</th>
                <th>Estado</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in productosFiltrados"
                :key="p.id_producto"
                :class="['product-row', p.estado ? 'row-active' : 'row-inactive']"
              >
                <td class="font-mono text-muted">#{{ p.id_producto }}</td>
                <td>
                  <div class="product-name">{{ p.nombre }}</div>
                  <small v-if="p.descripcion" class="product-desc">{{ p.descripcion }}</small>
                </td>
                <td>{{ p.categoria || '—' }}</td>
                <td>{{ p.unidad_medida }}</td>
                <td>
                  <span class="stock-badge" :class="{ 'stock-low': p.stock_actual <= p.stock_minimo }">
                    {{ p.stock_actual }}
                  </span>
                </td>
                <td>
                  <span v-if="p.estado" class="badge badge-active">
                    <span class="badge-dot dot-active"></span> Activo
                  </span>
                  <span v-else class="badge badge-inactive">
                    <span class="badge-dot dot-inactive"></span> Inactivo
                  </span>
                </td>
                <td class="text-right">
                  <!-- Botón Baja (Rojizo) -->
                  <button
                    v-if="p.estado"
                    type="button"
                    class="btn-action btn-baja"
                    :disabled="isActionLoading === p.id_producto"
                    @click="abrirModalConfirmacion(p, 'baja')"
                    title="Dar de baja producto"
                  >
                    <span v-if="isActionLoading === p.id_producto">...</span>
                    <span v-else>Baja</span>
                  </button>

                  <!-- Botón Reactivar -->
                  <button
                    v-else
                    type="button"
                    class="btn-action btn-reactivar"
                    :disabled="isActionLoading === p.id_producto"
                    @click="abrirModalConfirmacion(p, 'reactivar')"
                    title="Reactivar producto inactivo"
                  >
                    <span v-if="isActionLoading === p.id_producto">...</span>
                    <span v-else>Reactivar</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MODAL DE CONFIRMACIÓN (BAJA / REACTIVAR) -->
    <div v-if="modal.abierto" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-box">
        <div class="modal-icon" :class="modal.tipo === 'baja' ? 'icon-baja' : 'icon-reactivar'">
          <span v-if="modal.tipo === 'baja'">⚠️</span>
          <span v-else>↺</span>
        </div>

        <h3 class="modal-title">
          {{ modal.tipo === 'baja' ? 'Confirmar Baja de Producto' : 'Confirmar Reactivación' }}
        </h3>

        <p class="modal-text">
          <template v-if="modal.tipo === 'baja'">
            ¿Está seguro de dar de <strong>baja</strong> a: <br />
            <strong class="highlight-text">{{ modal.producto?.nombre }}</strong>?
            <br />
            <span class="subtext-modal">
              El producto quedará en estado inactivo. No se borrará físicamente para preservar los registros de inventario.
            </span>
          </template>
          <template v-else>
            ¿Desea volver a <strong>activar</strong> a: <br />
            <strong class="highlight-text">{{ modal.producto?.nombre }}</strong>?
          </template>
        </p>

        <div class="modal-actions">
          <button
            type="button"
            class="modal-btn btn-cancel"
            :disabled="isActionLoading !== null"
            @click="cerrarModal"
          >
            Cancelar
          </button>

          <button
            type="button"
            :class="['modal-btn', modal.tipo === 'baja' ? 'btn-confirm-baja' : 'btn-confirm-reactivar']"
            :disabled="isActionLoading !== null"
            @click="ejecutarAccionModal"
          >
            <span v-if="isActionLoading !== null">Procesando...</span>
            <span v-else>{{ modal.tipo === 'baja' ? 'Confirmar Baja' : 'Confirmar Reactivación' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  estado: boolean;
  fecha_creacion: string;
}

interface FormState {
  nombre: string;
  descripcion: string;
  categoria: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  estado: boolean;
}

const initialFormState: FormState = {
  nombre: '',
  descripcion: '',
  categoria: '',
  unidad_medida: '',
  stock_actual: 0,
  stock_minimo: 0,
  estado: true,
};

// Estados del formulario
const form = ref<FormState>({ ...initialFormState });
const isSubmitting = ref(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);
const validationErrors = ref<Array<{ campo: string; mensaje: string }>>([]);

// Estados de la lista de productos
const productos = ref<Producto[]>([]);
const isLoadingList = ref(false);
const listMessage = ref<string | null>(null);
const listError = ref<string | null>(null);
const isActionLoading = ref<number | null>(null);

// Filtro seleccionado: 'todos' (por defecto), 'activos', 'inactivos'
const filtroSeleccionado = ref<'todos' | 'activos' | 'inactivos'>('todos');

// Estado del Modal de confirmación
const modal = ref<{
  abierto: boolean;
  tipo: 'baja' | 'reactivar';
  producto: Producto | null;
}>({
  abierto: false,
  tipo: 'baja',
  producto: null,
});

// Conteos para los botones de pestañas
const conteos = computed(() => {
  const todos = productos.value.length;
  const activos = productos.value.filter((p) => p.estado).length;
  const inactivos = productos.value.filter((p) => !p.estado).length;
  return { todos, activos, inactivos };
});

// Lista filtrada según pestaña activa
const productosFiltrados = computed(() => {
  if (filtroSeleccionado.value === 'activos') {
    return productos.value.filter((p) => p.estado);
  }
  if (filtroSeleccionado.value === 'inactivos') {
    return productos.value.filter((p) => !p.estado);
  }
  return productos.value;
});

const cambiarFiltro = (filtro: 'todos' | 'activos' | 'inactivos') => {
  filtroSeleccionado.value = filtro;
};

// Cargar productos desde la API
const fetchProductos = async () => {
  isLoadingList.value = true;
  listError.value = null;
  try {
    const res = await $fetch<{ success: boolean; data: Producto[] }>('/api/productos');
    if (res && res.success) {
      productos.value = res.data;
    }
  } catch (err: any) {
    listError.value = err.data?.message || err.message || 'Error al cargar productos';
  } finally {
    isLoadingList.value = false;
  }
};

// Enviar formulario de registro (RF-01)
const submitForm = async () => {
  isSubmitting.value = true;
  errorMessage.value = null;
  successMessage.value = null;
  validationErrors.value = [];

  try {
    const payload = {
      nombre: form.value.nombre.trim(),
      descripcion: form.value.descripcion.trim() || undefined,
      categoria: form.value.categoria.trim() || undefined,
      unidad_medida: form.value.unidad_medida.trim(),
      stock_actual: Number(form.value.stock_actual) || 0,
      stock_minimo: Number(form.value.stock_minimo) || 0,
      estado: Boolean(form.value.estado),
    };

    const response = await $fetch<{
      success: boolean;
      mensaje: string;
      data: any;
    }>('/api/productos', {
      method: 'POST',
      body: payload,
    });

    if (response && response.success) {
      successMessage.value = response.mensaje || 'Producto registrado exitosamente';
      form.value = { ...initialFormState };
      // Refrescar la lista de productos
      await fetchProductos();
    }
  } catch (err: any) {
    if (err.data?.data && Array.isArray(err.data.data)) {
      validationErrors.value = err.data.data;
    } else {
      errorMessage.value =
        err.data?.message || err.message || 'Error inesperado al registrar el producto';
    }
  } finally {
    isSubmitting.value = false;
  }
};

// Manejo del Modal de Confirmación
const abrirModalConfirmacion = (producto: Producto, tipo: 'baja' | 'reactivar') => {
  modal.value = {
    abierto: true,
    tipo,
    producto,
  };
};

const cerrarModal = (forzar: boolean = false) => {
  if (forzar || isActionLoading.value === null) {
    modal.value.abierto = false;
    modal.value.producto = null;
  }
};

// Ejecución de la acción confirmada
const ejecutarAccionModal = async () => {
  const target = modal.value.producto;
  if (!target) return;

  const id = target.id_producto;
  isActionLoading.value = id;
  listMessage.value = null;
  listError.value = null;

  try {
    if (modal.value.tipo === 'baja') {
      const res = await $fetch<{ success: boolean; mensaje: string; data: Producto }>(
        `/api/productos/${id}`,
        { method: 'DELETE' }
      );
      if (res && res.success) {
        listMessage.value = res.mensaje;
        // Actualizar en el estado local
        const index = productos.value.findIndex((p) => p.id_producto === id);
        if (index !== -1) {
          productos.value[index].estado = false;
        }
      }
    } else {
      const res = await $fetch<{ success: boolean; mensaje: string; data: Producto }>(
        `/api/productos/${id}/reactivar`,
        { method: 'PATCH' }
      );
      if (res && res.success) {
        listMessage.value = res.mensaje;
        // Actualizar en el estado local
        const index = productos.value.findIndex((p) => p.id_producto === id);
        if (index !== -1) {
          productos.value[index].estado = true;
        }
      }
    }
    // Cerrar el modal automáticamente
    cerrarModal(true);
  } catch (err: any) {
    listError.value =
      err.data?.statusMessage ||
      err.data?.message ||
      err.message ||
      'Error al procesar la solicitud';
  } finally {
    isActionLoading.value = null;
  }
};


onMounted(() => {
  fetchProductos();
});
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 2.5rem 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #1e293b;
}

.main-content {
  max-width: 1050px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card {
  width: 100%;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  padding: 2rem;
  box-sizing: border-box;
}

.badge-tag {
  display: inline-block;
  background-color: #eff6ff;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  margin-bottom: 0.5rem;
  letter-spacing: 0.05em;
}

.tag-purple {
  background-color: #f3e8ff;
  color: #7e22ce;
}

.card-header {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
}

.title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
}

.subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.alert {
  padding: 0.875rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
}

.alert-success {
  background-color: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.alert-error {
  background-color: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-warning {
  background-color: #fffbeb;
  color: #92400e;
  border: 1px solid #fde68a;
}

.warning-title {
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.error-list {
  margin: 0;
  padding-left: 1.25rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.col {
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.375rem;
}

.required {
  color: #ef4444;
}

.input,
.textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #0f172a;
  background-color: #ffffff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  box-sizing: border-box;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.textarea {
  resize: vertical;
}

.checkbox-group {
  margin-top: 0.25rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.checkbox {
  width: 1.125rem;
  height: 1.125rem;
  accent-color: #2563eb;
  cursor: pointer;
}

.checkbox-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
}

.form-actions {
  margin-top: 0.5rem;
}

.submit-button {
  width: 100%;
  padding: 0.75rem 1.25rem;
  background-color: #2563eb;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.submit-button:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.submit-button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

/* LIST CARD & FILTERS */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
}

.tabs {
  display: flex;
  background-color: #f1f5f9;
  padding: 0.25rem;
  border-radius: 8px;
  gap: 0.25rem;
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 0.4rem 0.85rem;
  font-size: 0.825rem;
  font-weight: 500;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: #0f172a;
}

.tab-btn.active {
  background-color: #ffffff;
  color: #0f172a;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* TABLA DE PRODUCTOS */
.table-responsive {
  overflow-x: auto;
}

.products-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
}

.products-table th {
  background-color: #f8fafc;
  color: #475569;
  font-weight: 600;
  text-align: left;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.products-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

/* Filas: Activo (blanco/normal) vs Inactivo (gris atenuado) */
.row-active {
  background-color: #ffffff;
  transition: background-color 0.15s ease;
}

.row-active:hover {
  background-color: #fcfcfd;
}

.row-inactive {
  background-color: #f1f5f9;
  color: #64748b;
}

.row-inactive:hover {
  background-color: #e2e8f0;
}

.row-inactive .product-name {
  color: #475569;
  text-decoration: line-through;
}

.product-name {
  font-weight: 600;
  color: #0f172a;
}

.product-desc {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.15rem;
}

.font-mono {
  font-family: monospace;
}

.text-muted {
  color: #94a3b8;
}

.text-right {
  text-align: right;
}

.stock-badge {
  display: inline-block;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background-color: #f1f5f9;
  color: #334155;
}

.stock-low {
  background-color: #fef2f2;
  color: #dc2626;
}

/* BADGES DE ESTADO */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.badge-active {
  background-color: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.dot-active {
  background-color: #10b981;
}

.badge-inactive {
  background-color: #f1f5f9;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.dot-inactive {
  background-color: #94a3b8;
}

/* BOTONES DE ACCIÓN */
.btn-action {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

/* Botón Baja (Rojizo) */
.btn-baja {
  background-color: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.btn-baja:hover:not(:disabled) {
  background-color: #dc2626;
  color: #ffffff;
  border-color: #dc2626;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
}

/* Botón Reactivar (Verdoso/Azulado) */
.btn-reactivar {
  background-color: #f0fdf4;
  color: #15803d;
  border-color: #bbf7d0;
}

.btn-reactivar:hover:not(:disabled) {
  background-color: #16a34a;
  color: #ffffff;
  border-color: #16a34a;
  box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
  font-size: 0.9rem;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 0.75rem auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* MODAL OVERLAY & BOX */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
  backdrop-filter: blur(2px);
}

.modal-box {
  background-color: #ffffff;
  border-radius: 14px;
  max-width: 440px;
  width: 100%;
  padding: 1.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  text-align: center;
  animation: modalEnter 0.2s ease-out;
}

@keyframes modalEnter {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-icon {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin: 0 auto 1rem auto;
}

.icon-baja {
  background-color: #fef2f2;
}

.icon-reactivar {
  background-color: #f0fdf4;
}

.modal-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
}

.modal-text {
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.5;
  margin: 0 0 1.5rem 0;
}

.highlight-text {
  color: #0f172a;
  font-size: 1rem;
}

.subtext-modal {
  display: block;
  font-size: 0.775rem;
  color: #64748b;
  margin-top: 0.5rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.modal-btn {
  flex: 1;
  padding: 0.65rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;
}

.btn-cancel {
  background-color: #f1f5f9;
  color: #475569;
}

.btn-cancel:hover:not(:disabled) {
  background-color: #e2e8f0;
  color: #0f172a;
}

.btn-confirm-baja {
  background-color: #dc2626;
  color: #ffffff;
}

.btn-confirm-baja:hover:not(:disabled) {
  background-color: #b91c1c;
}

.btn-confirm-reactivar {
  background-color: #16a34a;
  color: #ffffff;
}

.btn-confirm-reactivar:hover:not(:disabled) {
  background-color: #15803d;
}

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
  }
  .list-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .filter-group {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
