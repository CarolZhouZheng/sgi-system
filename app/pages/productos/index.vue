<template>
  <div class="page-container">
    <div class="card">
      <header class="card-header">
        <h1 class="title">Registro de Producto</h1>
        <p class="subtitle">Ingrese los datos para registrar un nuevo producto en el sistema (RF-01).</p>
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
            rows="3"
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
            <span class="checkbox-text">Producto activo</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

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

const form = ref<FormState>({ ...initialFormState });
const isSubmitting = ref(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);
const validationErrors = ref<Array<{ campo: string; mensaje: string }>>([]);

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
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6;
  padding: 2rem 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #1f2937;
}

.card {
  width: 100%;
  max-width: 640px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 2rem;
}

.card-header {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.subtitle {
  font-size: 0.875rem;
  color: #6b7280;
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

.error-list li {
  margin-bottom: 0.25rem;
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
  color: #374151;
  margin-bottom: 0.375rem;
}

.required {
  color: #ef4444;
}

.input,
.textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #111827;
  background-color: #ffffff;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  box-sizing: border-box;
}

.input:focus,
.textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
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
  color: #374151;
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
  transition: background-color 0.15s ease-in-out;
}

.submit-button:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.submit-button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .form-row {
    flex-direction: column;
  }
}
</style>
