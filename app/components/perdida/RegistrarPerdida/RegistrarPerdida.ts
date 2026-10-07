import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

interface Producto {
  id_producto: number
  nombre: string
  stock_actual: number
  unidad_medida: string
}

export function useRegistrarPerdida() {
  const productos = ref<Producto[]>([])
  const cargandoProductos = ref(false)
  const guardando = ref(false)

  const mensajeExito = ref('')
  const mensajeError = ref('')

  const fechaHoy = () =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Costa_Rica',
    }).format(new Date())

  const form = ref({
    id_producto: '',
    cantidad: '',
    motivo: '',
    tipo_perdida: '',
    fecha: fechaHoy(),
    observaciones: '',
  })

  const { usuario } = useAuth()

  async function cargarProductos() {
    cargandoProductos.value = true
    mensajeError.value = ''

    try {
      const respuesta = await $fetch<any>('/api/productos?estado=true')

      productos.value = respuesta.data ?? respuesta
    } catch (error: any) {
      mensajeError.value =
        error?.data?.message ||
        error?.message ||
        'No se pudieron cargar los productos.'
    } finally {
      cargandoProductos.value = false
    }
  }

  function limpiarMensajes() {
    mensajeExito.value = ''
    mensajeError.value = ''
  }

  function validarFormulario(): boolean {
    limpiarMensajes()

    if (!form.value.id_producto) {
      mensajeError.value = 'Debe seleccionar un producto.'
      return false
    }

    const cantidad = Number(form.value.cantidad)

    if (!cantidad || cantidad <= 0) {
      mensajeError.value = 'La cantidad debe ser mayor que 0.'
      return false
    }

    const producto = productos.value.find(
      (p) => p.id_producto === Number(form.value.id_producto)
    )

    if (!producto) {
      mensajeError.value = 'El producto seleccionado no existe.'
      return false
    }

    if (cantidad > producto.stock_actual) {
      mensajeError.value =
        `La cantidad no puede ser mayor al stock disponible (${producto.stock_actual}).`
      return false
    }

    if (!form.value.motivo.trim()) {
      mensajeError.value = 'El motivo es obligatorio.'
      return false
    }

    if (!form.value.tipo_perdida.trim()) {
      mensajeError.value = 'Debe seleccionar un tipo de pérdida.'
      return false
    }

    if (!form.value.fecha) {
      mensajeError.value = 'La fecha es obligatoria.'
      return false
    }

    const hoy = fechaHoy()

    if (form.value.fecha > hoy) {
      mensajeError.value = 'La fecha no puede ser futura.'
      return false
    }

    return true
  }

  async function registrarPerdida() {
    if (!validarFormulario()) return

    guardando.value = true
    limpiarMensajes()

    try {
      const idUsuario = usuario.value?.id_usuario

      if (!idUsuario) {
        throw new Error('No se encontró el usuario de la sesión.')
      }

      await $fetch('/api/perdida', {
        method: 'POST',
        body: {
          id_producto: Number(form.value.id_producto),
          id_usuario: Number(idUsuario),
          cantidad: Number(form.value.cantidad),
          motivo: form.value.motivo.trim(),
          tipo_perdida: form.value.tipo_perdida.trim(),
          fecha: form.value.fecha,
          observaciones: form.value.observaciones.trim() || null,
          id_lote: null,
        },
      })

      mensajeExito.value = 'Pérdida registrada exitosamente.'

      form.value = {
        id_producto: '',
        cantidad: '',
        motivo: '',
        tipo_perdida: '',
        fecha: fechaHoy(),
        observaciones: '',
      }

      await cargarProductos()
    } catch (error: any) {
      mensajeError.value =
        error?.data?.message ||
        error?.statusMessage ||
        error?.message ||
        'No se pudo registrar la pérdida.'
    } finally {
      guardando.value = false
    }
  }

  const productoSeleccionado = () => {
    return productos.value.find(
      (p) => p.id_producto === Number(form.value.id_producto)
    )
  }

  onMounted(() => {
    cargarProductos()
  })

  return {
    form,
    productos,
    cargandoProductos,
    guardando,
    mensajeExito,
    mensajeError,
    productoSeleccionado,
    registrarPerdida,
    cargarProductos,
  }
}
