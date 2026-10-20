import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createError } from 'h3'

let mockQuery: Record<string, any> = {}

vi.stubGlobal('defineEventHandler', (fn: any) => fn)
vi.stubGlobal('createError', createError)
vi.stubGlobal('getQuery', () => mockQuery)

vi.mock('../../../server/services/producto.service', () => ({
  ProductoService: {
    listarProductos: vi.fn(),
  },
}))

import { ProductoService } from '../../../server/services/producto.service'

const mockListarProductos = vi.mocked(ProductoService.listarProductos)

describe('RF-07 · GET /api/productos (Endpoint Unitario - Búsqueda Avanzada)', () => {
  let handler: any

  const dummyEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    if (!handler) {
      const mod = await import('../../../server/api/productos/index.get')
      handler = mod.default
    }
    mockQuery = {}
    mockListarProductos.mockResolvedValue([
      {
        id_producto: 1,
        nombre: 'Pan Baguette',
        categoria: 'Panes',
        unidad_medida: 'unidad',
        stock_actual: 10,
        stock_minimo: 5,
        estado: true,
      },
    ] as any)
  })

  it('procesa una consulta sin parámetros con los defaults esperados', async () => {
    mockQuery = {}

    const res = await handler(dummyEvent)

    expect(mockListarProductos).toHaveBeenCalledWith({ stock: 'todos' })
    expect(res).toEqual({
      success: true,
      total: 1,
      data: expect.any(Array),
    })
  })

  it('procesa parámetros de búsqueda y filtros avanzados válidos', async () => {
    mockQuery = {
      busqueda: 'baguette',
      categoria: 'Panes',
      estado: 'true',
      stock: 'bajo',
    }

    const res = await handler(dummyEvent)

    expect(mockListarProductos).toHaveBeenCalledWith({
      busqueda: 'baguette',
      categoria: 'Panes',
      estado: true,
      stock: 'bajo',
    })
    expect(res.success).toBe(true)
  })

  it('rechaza con 400 si el parámetro stock tiene un valor inválido', async () => {
    mockQuery = { stock: 'inexistente' }

    await expect(handler(dummyEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Parámetros de búsqueda inválidos',
    })
    expect(mockListarProductos).not.toHaveBeenCalled()
  })

  it('propaga errores internos del servicio con status correspondiente', async () => {
    mockQuery = {}
    mockListarProductos.mockRejectedValue(new Error('Fallo de conexión'))

    await expect(handler(dummyEvent)).rejects.toThrow('Fallo de conexión')
  })
})
