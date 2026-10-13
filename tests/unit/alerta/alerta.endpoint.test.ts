import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createError } from 'h3'

let mockQuery: Record<string, any> = {}

vi.stubGlobal('defineEventHandler', (fn: any) => fn)
vi.stubGlobal('createError', createError)
vi.stubGlobal('getQuery', () => mockQuery)

vi.mock('../../../server/services/alerta.service', () => ({
  AlertaService: {
    obtenerAlertasVencimiento: vi.fn(),
  },
}))

import { AlertaService } from '../../../server/services/alerta.service'

const mockObtenerAlertas = vi.mocked(AlertaService.obtenerAlertasVencimiento)

describe('RF-06 · GET /api/alertas/vencimientos (Endpoint Unitario)', () => {
  let handler: any

  const dummyEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    if (!handler) {
      const mod = await import('../../../server/api/alertas/vencimientos.get')
      handler = mod.default
    }
    mockQuery = {}
    mockObtenerAlertas.mockResolvedValue({
      resumen: {
        total: 2,
        total_vencidos: 1,
        total_por_vencer: 1,
        dias_umbral_alerta: 3,
      },
      alertas: [
        {
          id_lote: 1,
          numero_lote: 'L-01',
          id_producto: 10,
          nombre_producto: 'Pan',
          categoria: 'Panadería',
          unidad_medida: 'unidad',
          cantidad: 5,
          fecha_vencimiento: '2026-10-10',
          fecha_produccion: null,
          dias_restantes: -2,
          estado_vencimiento: 'VENCIDO',
          nivel_urgencia: 'CRITICO',
          mensaje: 'Venció hace 2 días',
        },
      ],
    })
  })

  it('rechaza con 400 si dias_anticipacion es menor que 1', async () => {
    mockQuery = { dias_anticipacion: '0' }

    await expect(handler(dummyEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Parámetros de consulta inválidos.',
    })
    expect(mockObtenerAlertas).not.toHaveBeenCalled()
  })

  it('rechaza con 400 si dias_anticipacion supera 365 días', async () => {
    mockQuery = { dias_anticipacion: '400' }

    await expect(handler(dummyEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Parámetros de consulta inválidos.',
    })
    expect(mockObtenerAlertas).not.toHaveBeenCalled()
  })

  it('retorna 200 con la estructura { success, data, resumen } en consulta por defecto', async () => {
    mockQuery = {}

    const resultado = await handler(dummyEvent)

    expect(mockObtenerAlertas).toHaveBeenCalledWith({})
    expect(resultado).toMatchObject({
      success: true,
      data: expect.any(Array),
      resumen: expect.objectContaining({
        total: 2,
        total_vencidos: 1,
        total_por_vencer: 1,
        dias_umbral_alerta: 3,
      }),
    })
  })

  it('transforma parámetros válidos de consulta y los envía al servicio', async () => {
    mockQuery = {
      dias_anticipacion: '15',
      solo_vencidos: 'true',
    }

    const resultado = await handler(dummyEvent)

    expect(mockObtenerAlertas).toHaveBeenCalledWith({
      dias_anticipacion: 15,
      solo_vencidos: true,
    })
    expect(resultado.success).toBe(true)
  })

  it('propaga error si el servicio falla internamente', async () => {
    mockQuery = {}
    mockObtenerAlertas.mockRejectedValue(new Error('Fallo de conexión a Supabase'))

    await expect(handler(dummyEvent)).rejects.toThrow('Fallo de conexión a Supabase')
  })
})
