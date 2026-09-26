import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProductoService } from '../../server/services/producto.service'
import { ProductoRepository } from '../../server/repositories/producto.repository'

vi.mock('../../server/repositories/producto.repository', () => ({
  ProductoRepository: {
    crear: vi.fn(),
    listar: vi.fn(),
    obtenerPorId: vi.fn(),
    darDeBaja: vi.fn(),
    reactivar: vi.fn()
  }
}))

describe('ProductoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debe registrar un producto', async () => {
    const payload = {
      nombre: 'Pan de manteca',
      precio: 1200,
      stock: 20,
      estado: true
    }

    vi.mocked(ProductoRepository.crear).mockResolvedValue({
      id: 1,
      ...payload
    } as any)

    const result = await ProductoService.registrarProducto(payload)

    expect(ProductoRepository.crear).toHaveBeenCalledWith(payload)
    expect(result).toHaveProperty('id', 1)
  })

  it('debe lanzar error si el producto no existe al buscar por id', async () => {
    vi.mocked(ProductoRepository.obtenerPorId).mockResolvedValue(null)

    await expect(ProductoService.obtenerPorId(999)).rejects.toMatchObject({
      statusCode: 404
    })
  })

  it('debe lanzar error si el producto ya está dado de baja', async () => {
    vi.mocked(ProductoRepository.obtenerPorId).mockResolvedValue({
      id: 1,
      nombre: 'Pan',
      estado: false
    } as any)

    await expect(ProductoService.darDeBajaProducto(1)).rejects.toMatchObject({
      statusCode: 400
    })
  })

  it('debe reactivar un producto inactivo', async () => {
    vi.mocked(ProductoRepository.obtenerPorId).mockResolvedValue({
      id: 1,
      nombre: 'Pan',
      estado: false
    } as any)

    vi.mocked(ProductoRepository.reactivar).mockResolvedValue({
      id: 1,
      nombre: 'Pan',
      estado: true
    } as any)

    const result = await ProductoService.reactivarProducto(1)

    expect(ProductoRepository.reactivar).toHaveBeenCalledWith(1)
    expect(result.estado).toBe(true)
  })
})