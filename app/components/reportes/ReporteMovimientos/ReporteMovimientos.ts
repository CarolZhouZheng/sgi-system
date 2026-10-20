import { onMounted, ref } from 'vue'
import type {
  MovimientoReporte,
  ResumenMovimientos,
} from '../../../../server/models/movimiento.model'

interface ProductoFiltro {
  id_producto: number
  nombre: string
  unidad_medida: string
}

interface RespuestaMovimientos {
  success: boolean
  total: number
  data: MovimientoReporte[]
  resumen: ResumenMovimientos
  tipos_disponibles: string[]
}

const ZONA_HORARIA = 'America/Costa_Rica'

const fechaLocal = (fecha: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(fecha)

const primerDiaDelMes = () => `${fechaLocal(new Date()).slice(0, 8)}01`

// Formato para Excel en español (Costa Rica): separador ";" y decimales con coma.
const numeroCsv = (valor: number) => String(valor).replace('.', ',')

const celdaCsv = (valor: string | number | null | undefined) => {
  const texto = valor === null || valor === undefined ? '' : String(valor)
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export function useReporteMovimientos() {
  const filtros = ref({
    desde: primerDiaDelMes(),
    hasta: fechaLocal(new Date()),
    id_producto: '' as string | number,
    tipo: '',
  })

  const movimientos = ref<MovimientoReporte[]>([])
  const resumen = ref<ResumenMovimientos | null>(null)
  const tiposDisponibles = ref<string[]>([])
  const productos = ref<ProductoFiltro[]>([])

  const cargando = ref(false)
  const mensajeError = ref('')
  const mensajeExito = ref('')

  function formatearFecha(fechaIso: string) {
    return new Intl.DateTimeFormat('es-CR', {
      timeZone: ZONA_HORARIA,
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(fechaIso))
  }

  function formatearNumero(valor: number) {
    return new Intl.NumberFormat('es-CR', { maximumFractionDigits: 3 }).format(valor)
  }

  async function cargarProductos() {
    try {
      const respuesta = await $fetch<{ data: ProductoFiltro[] }>('/api/productos')
      productos.value = [...(respuesta.data ?? [])].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es')
      )
    } catch {
      // El reporte funciona sin la lista de productos; solo se pierde ese filtro.
      productos.value = []
    }
  }

  async function generarReporte() {
    mensajeError.value = ''
    mensajeExito.value = ''

    if (filtros.value.desde && filtros.value.hasta && filtros.value.desde > filtros.value.hasta) {
      mensajeError.value = 'La fecha "desde" no puede ser posterior a la fecha "hasta".'
      return
    }

    cargando.value = true

    try {
      const respuesta = await $fetch<RespuestaMovimientos>('/api/movimientos', {
        query: {
          desde: filtros.value.desde || undefined,
          hasta: filtros.value.hasta || undefined,
          id_producto: filtros.value.id_producto || undefined,
          tipo: filtros.value.tipo || undefined,
        },
        // Si el servidor no responde, se avisa en lugar de quedarse "Generando..." para siempre.
        timeout: 20_000,
      })

      movimientos.value = respuesta.data
      resumen.value = respuesta.resumen
      tiposDisponibles.value = respuesta.tipos_disponibles
      mensajeExito.value = `Reporte generado: ${respuesta.total} movimiento(s) · ${new Intl.DateTimeFormat('es-CR', {
        timeZone: ZONA_HORARIA,
        timeStyle: 'short',
      }).format(new Date())}`
    } catch (error: any) {
      console.error('[Reporte de movimientos] Error al generar el reporte:', error)
      mensajeError.value =
        error?.data?.statusMessage ||
        error?.data?.message ||
        (error?.name === 'AbortError' || /timeout|aborted/i.test(error?.message ?? '')
          ? 'El servidor no respondió en 20 segundos. Intenta de nuevo.'
          : `No se pudo generar el reporte de movimientos. ${error?.message ?? ''}`.trim())
      movimientos.value = []
      resumen.value = null
    } finally {
      cargando.value = false
    }
  }

  function limpiarFiltros() {
    filtros.value = {
      desde: primerDiaDelMes(),
      hasta: fechaLocal(new Date()),
      id_producto: '',
      tipo: '',
    }
    generarReporte()
  }

  function exportarCsv() {
    if (!movimientos.value.length) return

    const encabezados = [
      'Fecha',
      'Tipo',
      'Producto',
      'Unidad',
      'Cantidad',
      'Stock anterior',
      'Stock nuevo',
      'Variación',
      'Usuario',
      'Origen',
      'Observaciones',
    ]

    const filas = movimientos.value.map((m) => [
      formatearFecha(m.fecha),
      m.tipo_movimiento,
      m.nombre_producto,
      m.unidad_medida,
      numeroCsv(m.cantidad),
      numeroCsv(m.stock_anterior),
      numeroCsv(m.stock_nuevo),
      numeroCsv(m.variacion),
      m.usuario,
      m.origen,
      m.observaciones,
    ])

    // El BOM (﻿) hace que Excel reconozca las tildes (UTF-8).
    const contenido =
      '﻿' + [encabezados, ...filas].map((fila) => fila.map(celdaCsv).join(';')).join('\r\n')

    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }))
    enlace.download = `reporte-movimientos_${filtros.value.desde || 'inicio'}_${filtros.value.hasta || 'hoy'}.csv`
    enlace.click()
    URL.revokeObjectURL(enlace.href)
  }

  function imprimir() {
    window.print()
  }

  onMounted(() => {
    cargarProductos()
    generarReporte()
  })

  return {
    filtros,
    movimientos,
    resumen,
    tiposDisponibles,
    productos,
    cargando,
    mensajeError,
    mensajeExito,
    formatearFecha,
    formatearNumero,
    generarReporte,
    limpiarFiltros,
    exportarCsv,
    imprimir,
  }
}
