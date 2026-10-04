import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ProductoService usa createError como auto-import de Nuxt; aquí se provee el de h3.
vi.stubGlobal('createError', createError)

vi.mock('../../server/repositories/producto.repository', () => ({
  ProductoRepository: {
    crear: vi.fn(),
    obtenerPorId: vi.fn(),
    listar: vi.fn(),
    actualizar: vi.fn(),
    darDeBaja: vi.fn(),
    reactivar: vi.fn(),
  },
}))

import { ProductoRepository } from '../../server/repositories/producto.repository'
import { ProductoService } from '../../server/services/producto.service'

const repo = vi.mocked(ProductoRepository)

const producto = (estado: boolean) => ({
  id_producto: 3,
  nombre: 'Pan baguette',
  descripcion: 'Pan francés',
  categoria: 'Panes',
  unidad_medida: 'unidad',
  stock_actual: 20,
  stock_minimo: 5,
  estado,
  fecha_creacion: '2026-09-20T00:00:00Z',
})

describe('RF-01 · ProductoService.registrarProducto', () => {
  beforeEach(() => vi.resetAllMocks())

  it('crea el producto con los datos validados', async () => {
    const datos = { nombre: 'Pan', unidad_medida: 'unidad', stock_actual: 0, stock_minimo: 0, estado: true }
    repo.crear.mockResolvedValue({ id_producto: 1, ...datos } as never)

    await expect(ProductoService.registrarProducto(datos)).resolves.toMatchObject({ id_producto: 1 })
    expect(repo.crear).toHaveBeenCalledWith(datos)
  })

  it('lista productos pasando el filtro de estado', async () => {
    repo.listar.mockResolvedValue([] as never)

    await ProductoService.listarProductos(true)
    expect(repo.listar).toHaveBeenCalledWith(true)
  })
})

describe('RF-03 · ProductoService.actualizarProducto', () => {
  beforeEach(() => vi.resetAllMocks())

  it('actualiza un producto activo', async () => {
    repo.obtenerPorId.mockResolvedValue(producto(true) as never)
    repo.actualizar.mockResolvedValue({ ...producto(true), stock_actual: 30 } as never)

    await expect(ProductoService.actualizarProducto(3, { stock_actual: 30 })).resolves.toMatchObject({ stock_actual: 30 })
    expect(repo.actualizar).toHaveBeenCalledWith(3, { stock_actual: 30 })
  })

  it('guarda descripción y categoría vacías como null', async () => {
    repo.obtenerPorId.mockResolvedValue(producto(true) as never)
    repo.actualizar.mockResolvedValue(producto(true) as never)

    await ProductoService.actualizarProducto(3, { descripcion: '', categoria: '' })
    expect(repo.actualizar).toHaveBeenCalledWith(3, { descripcion: null, categoria: null })
  })

  it('responde 404 si el producto no existe', async () => {
    repo.obtenerPorId.mockResolvedValue(null as never)

    await expect(ProductoService.actualizarProducto(999, { nombre: 'X' })).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'No se encontró ningún producto con ID 999',
    })
  })

  it('rechaza con 400 modificar un producto dado de baja', async () => {
    repo.obtenerPorId.mockResolvedValue(producto(false) as never)

    await expect(ProductoService.actualizarProducto(3, { nombre: 'X' })).rejects.toMatchObject({ statusCode: 400 })
    expect(repo.actualizar).not.toHaveBeenCalled()
  })
})

describe('RF-04 · ProductoService baja y reactivación', () => {
  beforeEach(() => vi.resetAllMocks())

  it('da de baja un producto activo', async () => {
    repo.obtenerPorId.mockResolvedValue(producto(true) as never)
    repo.darDeBaja.mockResolvedValue(producto(false) as never)

    await expect(ProductoService.darDeBajaProducto(3)).resolves.toMatchObject({ estado: false })
  })

  it('rechaza con 400 dar de baja un producto ya inactivo', async () => {
    repo.obtenerPorId.mockResolvedValue(producto(false) as never)

    await expect(ProductoService.darDeBajaProducto(3)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'El producto "Pan baguette" ya se encuentra dado de baja (inactivo)',
    })
    expect(repo.darDeBaja).not.toHaveBeenCalled()
  })

  it('reactiva un producto inactivo', async () => {
    repo.obtenerPorId.mockResolvedValue(producto(false) as never)
    repo.reactivar.mockResolvedValue(producto(true) as never)

    await expect(ProductoService.reactivarProducto(3)).resolves.toMatchObject({ estado: true })
  })

  it('rechaza con 400 reactivar un producto ya activo', async () => {
    repo.obtenerPorId.mockResolvedValue(producto(true) as never)

    await expect(ProductoService.reactivarProducto(3)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'El producto "Pan baguette" ya se encuentra activo',
    })
    expect(repo.reactivar).not.toHaveBeenCalled()
  })

  it.each(['darDeBajaProducto', 'reactivarProducto'] as const)('%s responde 404 si el producto no existe', async (metodo) => {
    repo.obtenerPorId.mockResolvedValue(null as never)

    await expect(ProductoService[metodo](999)).rejects.toMatchObject({ statusCode: 404 })
  })
})
