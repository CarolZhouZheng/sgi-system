import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../server/repositories/pedido.repository', () => ({
  PedidoRepository: {
    destinatarioActivoExiste: vi.fn(),
    usuarioActivoExiste: vi.fn(),
    productosActivosExisten: vi.fn(),
    crearPedido: vi.fn(),
    listarPedidos: vi.fn(),
  },
}))

import { PedidoRepository } from '../../server/repositories/pedido.repository'
import { PedidoService } from '../../server/services/pedido.service'
import type { CrearPedidoDTO } from '../../server/dtos/pedido.dto'

const repo = vi.mocked(PedidoRepository)

const pedido: CrearPedidoDTO = {
  id_destinatario: 1,
  id_usuario: 1,
  fecha_entrega: '2026-10-10',
  prioridad: 'NORMAL',
  encargado_entrega: null,
  detalles: [
    { id_producto: 10, cantidad: 5 },
    { id_producto: 11, cantidad: 2 },
  ],
}

describe('RF-02 · PedidoService.registrarPedido', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    repo.destinatarioActivoExiste.mockResolvedValue(true)
    repo.usuarioActivoExiste.mockResolvedValue(true)
    repo.productosActivosExisten.mockResolvedValue(true)
  })

  it('registra el pedido cuando destinatario, usuario y productos son válidos', async () => {
    const creado = { id_pedido: 99, ...pedido }
    repo.crearPedido.mockResolvedValue(creado as never)

    await expect(PedidoService.registrarPedido(pedido)).resolves.toEqual(creado)
    expect(repo.productosActivosExisten).toHaveBeenCalledWith([10, 11])
    expect(repo.crearPedido).toHaveBeenCalledWith(pedido)
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

  it('rechaza con 400 si algún producto no existe o está inactivo', async () => {
    repo.productosActivosExisten.mockResolvedValue(false)

    await expect(PedidoService.registrarPedido(pedido)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Uno o más productos no existen o están inactivos.',
    })
    expect(repo.crearPedido).not.toHaveBeenCalled()
  })

  it('propaga el error si falla el guardado de los detalles', async () => {
    repo.crearPedido.mockRejectedValue(new Error('No se guardaron los detalles: fallo'))

    await expect(PedidoService.registrarPedido(pedido)).rejects.toThrow('No se guardaron los detalles')
  })
})

describe('RF-02 · PedidoService.listarPedidos', () => {
  it('devuelve los pedidos del repositorio', async () => {
    const lista = [{ id_pedido: 1, detalle_pedido: [] }]
    repo.listarPedidos.mockResolvedValue(lista as never)

    await expect(PedidoService.listarPedidos()).resolves.toEqual(lista)
  })
})
