import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../server/repositories/movimiento.repository', () => ({
  MovimientoRepository: {
    listar: vi.fn(),
    obtenerTipos: vi.fn(),
  },
}))

import { MovimientoRepository } from '../../../server/repositories/movimiento.repository'
import { MovimientoService } from '../../../server/services/movimiento.service'

const repo = vi.mocked(MovimientoRepository)

describe('RF-08 · MovimientoService.calcularRangoFechas', () => {
  it('calcula fechaInicio a las 00:00 con desfase de Costa Rica (-06:00)', () => {
    const rango = MovimientoService.calcularRangoFechas('2026-10-01')
    expect(rango.fechaInicio).toBe('2026-10-01T00:00:00-06:00')
    expect(rango.fechaFin).toBeUndefined()
  })

  it('calcula fechaFin al inicio del día siguiente para incluir todo el último día', () => {
    const rango = MovimientoService.calcularRangoFechas(undefined, '2026-10-15')
    expect(rango.fechaInicio).toBeUndefined()
    expect(rango.fechaFin).toBe('2026-10-16T00:00:00-06:00')
  })

  it('devuelve objeto vacío si no se envían fechas', () => {
    const rango = MovimientoService.calcularRangoFechas()
    expect(rango).toEqual({})
  })
})

describe('RF-08 · MovimientoService.describirOrigen', () => {
  const baseFila = {
    id_movimiento: 1,
    id_producto: 10,
    id_usuario: 5,
    tipo_movimiento: 'TEST',
    cantidad: 10,
    stock_anterior: 0,
    stock_nuevo: 10,
    fecha: '2026-10-15T12:00:00Z',
    observaciones: null,
    id_lote: null,
    id_produccion: null,
    id_perdida: null,
    id_devolucion: null,
  }

  it('prioriza Pérdida si existe id_perdida', () => {
    expect(MovimientoService.describirOrigen({ ...baseFila, id_perdida: 34 })).toBe('Pérdida #34')
  })

  it('describe Producción si existe id_produccion', () => {
    expect(MovimientoService.describirOrigen({ ...baseFila, id_produccion: 12 })).toBe('Producción #12')
  })

  it('describe Devolución si existe id_devolucion', () => {
    expect(MovimientoService.describirOrigen({ ...baseFila, id_devolucion: 7 })).toBe('Devolución #7')
  })

  it('describe Lote si existe id_lote', () => {
    expect(MovimientoService.describirOrigen({ ...baseFila, id_lote: 99 })).toBe('Lote #99')
  })

  it('devuelve null si no tiene referencias foráneas', () => {
    expect(MovimientoService.describirOrigen(baseFila)).toBeNull()
  })
})

describe('RF-08 · MovimientoService.mapearMovimiento', () => {
  it('mapea correctamente dirección ENTRADA y concatena nombre de usuario', () => {
    const fila = {
      id_movimiento: 101,
      id_producto: 5,
      id_usuario: 2,
      id_lote: null,
      id_produccion: null,
      id_perdida: null,
      id_devolucion: null,
      tipo_movimiento: 'AJUSTE_POSITIVO',
      cantidad: 15,
      stock_anterior: 10,
      stock_nuevo: 25,
      fecha: '2026-10-15T10:00:00Z',
      observaciones: 'Conteo físico',
      producto: { nombre: 'Harina Especial', unidad_medida: 'kg' },
      usuario: { nombre: 'Carlos', apellido: 'Gómez', nombre_usuario: 'cgomez' },
    }

    const m = MovimientoService.mapearMovimiento(fila as any)

    expect(m.id_movimiento).toBe(101)
    expect(m.nombre_producto).toBe('Harina Especial')
    expect(m.unidad_medida).toBe('kg')
    expect(m.variacion).toBe(15)
    expect(m.direccion).toBe('ENTRADA')
    expect(m.usuario).toBe('Carlos Gómez')
  })

  it('mapea correctamente dirección SALIDA cuando el stock disminuye', () => {
    const fila = {
      id_movimiento: 102,
      id_producto: 5,
      id_usuario: 2,
      id_lote: null,
      id_produccion: null,
      id_perdida: 3,
      id_devolucion: null,
      tipo_movimiento: 'PERDIDA',
      cantidad: 5,
      stock_anterior: 25,
      stock_nuevo: 20,
      fecha: '2026-10-15T11:00:00Z',
      observaciones: null,
      producto: [{ nombre: 'Harina Especial', unidad_medida: 'kg' }],
      usuario: [{ nombre: 'Ana', apellido: null, nombre_usuario: 'ana123' }],
    }

    const m = MovimientoService.mapearMovimiento(fila as any)

    expect(m.variacion).toBe(-5)
    expect(m.direccion).toBe('SALIDA')
    expect(m.usuario).toBe('Ana')
    expect(m.origen).toBe('Pérdida #3')
  })
})

describe('RF-08 · MovimientoService.calcularResumen', () => {
  const mockMovimientos = [
    {
      id_movimiento: 1,
      fecha: '2026-10-15',
      tipo_movimiento: 'PRODUCCION',
      id_producto: 1,
      nombre_producto: 'Pan Blanco',
      unidad_medida: 'unidad',
      cantidad: 20,
      stock_anterior: 0,
      stock_nuevo: 20,
      variacion: 20,
      direccion: 'ENTRADA' as const,
      usuario: 'Admin',
      origen: null,
      observaciones: null,
    },
    {
      id_movimiento: 2,
      fecha: '2026-10-15',
      tipo_movimiento: 'PERDIDA',
      id_producto: 1,
      nombre_producto: 'Pan Blanco',
      unidad_medida: 'unidad',
      cantidad: 5,
      stock_anterior: 20,
      stock_nuevo: 15,
      variacion: -5,
      direccion: 'SALIDA' as const,
      usuario: 'Admin',
      origen: null,
      observaciones: null,
    },
    {
      id_movimiento: 3,
      fecha: '2026-10-15',
      tipo_movimiento: 'PRODUCCION',
      id_producto: 2,
      nombre_producto: 'Baguette',
      unidad_medida: 'unidad',
      cantidad: 30,
      stock_anterior: 0,
      stock_nuevo: 30,
      variacion: 30,
      direccion: 'ENTRADA' as const,
      usuario: 'Admin',
      origen: null,
      observaciones: null,
    },
  ]

  it('calcula los totales generales y por tipo correctamente', () => {
    const resumen = MovimientoService.calcularResumen(mockMovimientos, 3)

    expect(resumen.total_movimientos).toBe(3)
    expect(resumen.total_entradas).toBe(2)
    expect(resumen.total_salidas).toBe(1)
    expect(resumen.productos_afectados).toBe(2)
    expect(resumen.truncado).toBe(false)

    // Agrupación por tipo: 2 de PRODUCCION y 1 de PERDIDA
    expect(resumen.por_tipo).toEqual([
      { tipo_movimiento: 'PRODUCCION', total_movimientos: 2 },
      { tipo_movimiento: 'PERDIDA', total_movimientos: 1 },
    ])

    // Agrupación por producto (alfabético: Baguette primero, luego Pan Blanco)
    expect(resumen.por_producto[0]).toMatchObject({
      nombre_producto: 'Baguette',
      entradas: 30,
      salidas: 0,
      neto: 30,
    })
    expect(resumen.por_producto[1]).toMatchObject({
      nombre_producto: 'Pan Blanco',
      entradas: 20,
      salidas: 5,
      neto: 15,
    })
  })

  it('indica truncado: true cuando total en base supera el límite de movimientos devueltos', () => {
    const resumen = MovimientoService.calcularResumen(mockMovimientos, 100)
    expect(resumen.truncado).toBe(true)
  })
})

describe('RF-08 · MovimientoService.generarReporte (Orquestación)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    repo.listar.mockResolvedValue({ filas: [], total: 0 })
    repo.obtenerTipos.mockResolvedValue(['PRODUCCION', 'PERDIDA'])
  })

  it('orquesta la consulta de movimientos y tipos disponibles', async () => {
    const filtros = { desde: '2026-10-01', hasta: '2026-10-10', limite: 100 }
    const reporte = await MovimientoService.generarReporte(filtros)

    expect(repo.listar).toHaveBeenCalledWith({
      fechaInicio: '2026-10-01T00:00:00-06:00',
      fechaFin: '2026-10-11T00:00:00-06:00',
      id_producto: undefined,
      tipo: undefined,
      limite: 100,
    })
    expect(repo.obtenerTipos).toHaveBeenCalledOnce()
    expect(reporte.tipos_disponibles).toEqual(['PRODUCCION', 'PERDIDA'])
    expect(reporte.movimientos).toEqual([])
    expect(reporte.resumen.total_movimientos).toBe(0)
  })
})
