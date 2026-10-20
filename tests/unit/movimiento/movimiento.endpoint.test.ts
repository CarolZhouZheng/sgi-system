import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createError } from 'h3'

let mockQuery: Record<string, any> = {}

vi.stubGlobal('defineEventHandler', (fn: any) => fn)
vi.stubGlobal('createError', createError)
vi.stubGlobal('getQuery', () => mockQuery)

vi.mock('../../../server/services/movimiento.service', () => ({
  MovimientoService: {
    generarReporte: vi.fn(),
  },
}))

import { MovimientoService } from '../../../server/services/movimiento.service'

const mockGenerarReporte = vi.mocked(MovimientoService.generarReporte)

describe('RF-08 · GET /api/movimientos (Endpoint Unitario)', () => {
  let handler: any

  const dummyEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    if (!handler) {
      const mod = await import('../../../server/api/movimientos/index.get')
      handler = mod.default
    }
    mockQuery = {}
    mockGenerarReporte.mockResolvedValue({
      resumen: {
        total_movimientos: 1,
        total_entradas: 1,
        total_salidas: 0,
        productos_afectados: 1,
        por_tipo: [{ tipo_movimiento: 'PRODUCCION', total_movimientos: 1 }],
        por_producto: [
          {
            id_producto: 1,
            nombre_producto: 'Pan',
            unidad_medida: 'kg',
            entradas: 10,
            salidas: 0,
            neto: 10,
          },
        ],
        truncado: false,
      },
      movimientos: [
        {
          id_movimiento: 1,
          fecha: '2026-10-15T00:00:00Z',
          tipo_movimiento: 'PRODUCCION',
          id_producto: 1,
          nombre_producto: 'Pan',
          unidad_medida: 'kg',
          cantidad: 10,
          stock_anterior: 0,
          stock_nuevo: 10,
          variacion: 10,
          direccion: 'ENTRADA',
          usuario: 'Admin',
          origen: null,
          observaciones: null,
        },
      ],
      tipos_disponibles: ['PRODUCCION', 'PERDIDA'],
    })
  })

  it('procesa una consulta por defecto devolviendo 200 con la estructura completa', async () => {
    mockQuery = {}

    const res = await handler(dummyEvent)

    expect(mockGenerarReporte).toHaveBeenCalledWith({ limite: 500 })
    expect(res).toEqual({
      success: true,
      total: 1,
      data: expect.any(Array),
      resumen: expect.objectContaining({ total_movimientos: 1 }),
      tipos_disponibles: ['PRODUCCION', 'PERDIDA'],
    })
  })

  it('pasa filtros válidos al servicio correctamente', async () => {
    mockQuery = {
      desde: '2026-10-01',
      hasta: '2026-10-15',
      id_producto: '5',
      tipo: 'PRODUCCION',
      limite: '100',
    }

    const res = await handler(dummyEvent)

    expect(mockGenerarReporte).toHaveBeenCalledWith({
      desde: '2026-10-01',
      hasta: '2026-10-15',
      id_producto: 5,
      tipo: 'PRODUCCION',
      limite: 100,
    })
    expect(res.success).toBe(true)
  })

  it('rechaza con 400 si fecha "desde" es posterior a fecha "hasta"', async () => {
    mockQuery = {
      desde: '2026-10-25',
      hasta: '2026-10-10',
    }

    await expect(handler(dummyEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'La fecha "desde" no puede ser posterior a la fecha "hasta"',
    })
    expect(mockGenerarReporte).not.toHaveBeenCalled()
  })

  it('rechaza con 400 si el límite supera 1000', async () => {
    mockQuery = { limite: '2000' }

    await expect(handler(dummyEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'El límite máximo es 1000',
    })
    expect(mockGenerarReporte).not.toHaveBeenCalled()
  })

  it('responde 500 si el servicio lanza una excepción', async () => {
    mockQuery = {}
    mockGenerarReporte.mockRejectedValue(new Error('Fallo crítico en base de datos'))

    await expect(handler(dummyEvent)).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'Fallo crítico en base de datos',
    })
  })
})
