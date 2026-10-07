import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../server/repositories/pedido.repository', () => ({
  PedidoRepository: {
    destinatarioActivoExiste: vi.fn(),
    usuarioActivoExiste: vi.fn(),
    obtenerProductosPorIds: vi.fn(),
    registrarAuditoria: vi.fn(),
    crearPedido: vi.fn(),
    listarPedidos: vi.fn(),
    obtenerPedidoPorId: vi.fn(),
    actualizarEstadoPedido: vi.fn(),
  },
}))

import { PedidoRepository } from '../../../server/repositories/pedido.repository'
import { PedidoService } from '../../../server/services/pedido.service'
import type { CrearPedidoDTO } from '../../../server/dtos/pedido.dto'

const repo = vi.mocked(PedidoRepository)

const pedido: CrearPedidoDTO = {
  id_destinatario: 1,
  id_usuario: 7,
  fecha_entrega: '2026-10-10',
  prioridad: 'NORMAL',
  encargado_entrega: null,
  detalles: [
    { id_producto: 10, cantidad: 5 },
    { id_producto: 11, cantidad: 2 },
  ],
}

const producto = (id_producto: number, stock_actual: number | string, estado = true) => ({
  id_producto,
  nombre: `Producto ${id_producto}`,
  stock_actual,
  stock_minimo: 0,
  estado,
})

describe('RF-02 · PedidoService.registrarPedido', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    repo.destinatarioActivoExiste.mockResolvedValue(true)
    repo.usuarioActivoExiste.mockResolvedValue(true)
    repo.obtenerProductosPorIds.mockResolvedValue([producto(10, 50), producto(11, 50)] as never)
    repo.crearPedido.mockResolvedValue({ id_pedido: 99, ...pedido } as never)
  })

  it('registra el pedido cuando destinatario, usuario, productos y stock son válidos', async () => {
    await expect(PedidoService.registrarPedido(pedido)).resolves.toMatchObject({ id_pedido: 99 })
    expect(repo.obtenerProductosPorIds).toHaveBeenCalledWith([10, 11])
    expect(repo.crearPedido).toHaveBeenCalledWith(pedido)
  })

  it('registra la auditoría del pedido creado (CU02 paso 8)', async () => {
    await PedidoService.registrarPedido(pedido)

    expect(repo.registrarAuditoria).toHaveBeenCalledWith({
      id_usuario: 7,
      accion: 'REGISTRAR_PEDIDO',
      tabla_afectada: 'pedido',
      registro_id: 99,
      detalle: 'Registro de pedido #99 para destinatario ID 1 con 2 producto(s).',
    })
  })

  it('rechaza con 400 si el destinatario no existe o está inactivo', async () => {
    repo.destinatarioActivoExiste.mockResolvedValue(false)

    await expect(PedidoService.registrarPedido(pedido)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'El destinatario no existe o está inactivo.',
    })
    expect(repo.crearPedido).not.toHaveBeenCalled()
  })

  it('rechaza con 400 si el usuario no existe o está inactivo', async () => {
    repo.usuarioActivoExiste.mockResolvedValue(false)

    await expect(PedidoService.registrarPedido(pedido)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'El usuario no existe o está inactivo.',
    })
    expect(repo.crearPedido).not.toHaveBeenCalled()
  })

  it.each([
    ['no existe', [producto(10, 50)]],
    ['está inactivo', [producto(10, 50), producto(11, 50, false)]],
  ])('rechaza con 400 si algún producto %s', async (_caso, productos) => {
    repo.obtenerProductosPorIds.mockResolvedValue(productos as never)

    await expect(PedidoService.registrarPedido(pedido)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Uno o más productos no existen o están inactivos.',
    })
    expect(repo.crearPedido).not.toHaveBeenCalled()
  })

  // La validación de stock (CU02 flujo 5.1) se retiró en el commit f06c14e:
  // un pedido puede superar el stock actual (se produce después).
  it('registra el pedido aunque la cantidad supere el stock actual', async () => {
    repo.obtenerProductosPorIds.mockResolvedValue([producto(10, 0), producto(11, '1')] as never)

    await expect(PedidoService.registrarPedido(pedido)).resolves.toMatchObject({ id_pedido: 99 })
    expect(repo.crearPedido).toHaveBeenCalledOnce()
  })

  it('propaga el error si falla el guardado del pedido y no audita', async () => {
    repo.crearPedido.mockRejectedValue(new Error('No se guardaron los detalles: fallo'))

    await expect(PedidoService.registrarPedido(pedido)).rejects.toThrow('No se guardaron los detalles')
    expect(repo.registrarAuditoria).not.toHaveBeenCalled()
  })
})

describe('RF-02 · PedidoService.listarPedidos', () => {
  it('devuelve los pedidos del repositorio', async () => {
    const lista = [{ id_pedido: 1, detalle_pedido: [] }]
    repo.listarPedidos.mockResolvedValue(lista as never)

    await expect(PedidoService.listarPedidos()).resolves.toEqual(lista)
  })
})

describe('RF-21 · PedidoService.completarPedido', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('rechaza con 404 si el pedido no existe', async () => {
    repo.obtenerPedidoPorId.mockResolvedValue(null)

    await expect(PedidoService.completarPedido(99, 1)).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'El pedido especificado no existe.',
    })
    expect(repo.actualizarEstadoPedido).not.toHaveBeenCalled()
  })

  it('rechaza con 400 si el pedido ya está completado', async () => {
    repo.obtenerPedidoPorId.mockResolvedValue({ id_pedido: 99, estado: 'COMPLETADO' } as never)

    await expect(PedidoService.completarPedido(99, 1)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'El pedido ya se encuentra completado.',
    })
    expect(repo.actualizarEstadoPedido).not.toHaveBeenCalled()
  })

  it('rechaza con 400 si el pedido está cancelado', async () => {
    repo.obtenerPedidoPorId.mockResolvedValue({ id_pedido: 99, estado: 'CANCELADO' } as never)

    await expect(PedidoService.completarPedido(99, 1)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'No se puede completar un pedido que está cancelado.',
    })
    expect(repo.actualizarEstadoPedido).not.toHaveBeenCalled()
  })

  it('actualiza el estado del pedido y registra la auditoría con éxito', async () => {
    repo.obtenerPedidoPorId.mockResolvedValue({ id_pedido: 99, estado: 'PENDIENTE' } as never)
    repo.actualizarEstadoPedido.mockResolvedValue({ id_pedido: 99, estado: 'COMPLETADO' } as never)

    const resultado = await PedidoService.completarPedido(99, 5)

    expect(resultado).toMatchObject({ id_pedido: 99, estado: 'COMPLETADO' })
    expect(repo.actualizarEstadoPedido).toHaveBeenCalledWith(99, 'COMPLETADO')
    expect(repo.registrarAuditoria).toHaveBeenCalledWith({
      id_usuario: 5,
      accion: 'COMPLETAR_PEDIDO',
      tabla_afectada: 'pedido',
      registro_id: 99,
      detalle: 'El pedido #99 fue marcado como completado manualmente.',
    })
  })
})
