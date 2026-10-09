import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createError } from 'h3'

let mockCookies: Record<string, string | undefined> = {}
let mockBody: any = {}
let mockParams: Record<string, string | undefined> = {}

vi.stubGlobal('defineEventHandler', (fn: any) => fn)
vi.stubGlobal('createError', createError)
vi.stubGlobal('getCookie', (_event: any, name: string) => mockCookies[name])
vi.stubGlobal('readBody', async () => mockBody)

vi.mock('../../../server/services/pedido.service', () => ({
  PedidoService: {
    completarPedido: vi.fn(),
  },
}))

import { PedidoService } from '../../../server/services/pedido.service'

const mockCompletarPedido = vi.mocked(PedidoService.completarPedido)

describe('RF-21 · PATCH /api/pedidos/:id/estado (Endpoint Unitario)', () => {
  let handler: any

  const getDummyEvent = () => ({
    context: {
      params: mockParams,
    },
  } as any)

  beforeEach(async () => {
    vi.clearAllMocks()
    if (!handler) {
      const mod = await import('../../../server/api/pedidos/[id]/estado.patch')
      handler = mod.default
    }
    mockCookies = {
      usuario_session: JSON.stringify({ id_usuario: 5, nombre_usuario: 'admin' }),
    }
    mockParams = { id: '10' }
    mockBody = { estado: 'COMPLETADO' }
    mockCompletarPedido.mockResolvedValue({
      id_pedido: 10,
      id_destinatario: 1,
      id_usuario: 5,
      estado: 'COMPLETADO',
      prioridad: 'NORMAL',
    } as any)
  })

  describe('Control de sesión y autenticación (401)', () => {
    it('rechaza con 401 si no existe la cookie de sesión', async () => {
      mockCookies = {}

      await expect(handler(getDummyEvent())).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'No hay sesión activa.',
      })
      expect(mockCompletarPedido).not.toHaveBeenCalled()
    })

    it('rechaza con 401 si la cookie de sesión no es un JSON válido', async () => {
      mockCookies = { usuario_session: 'invalido-no-json' }

      await expect(handler(getDummyEvent())).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'La sesión está dañada o es inválida.',
      })
      expect(mockCompletarPedido).not.toHaveBeenCalled()
    })
  })

  describe('Validación de parámetros y cuerpo de solicitud (400)', () => {
    it('rechaza con 400 si el parámetro id no es un número válido', async () => {
      mockParams = { id: 'abc' }

      await expect(handler(getDummyEvent())).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'ID de pedido inválido.',
      })
      expect(mockCompletarPedido).not.toHaveBeenCalled()
    })

    it('rechaza con 400 si el parámetro id es menor o igual a 0', async () => {
      mockParams = { id: '0' }

      await expect(handler(getDummyEvent())).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'ID de pedido inválido.',
      })

      mockParams = { id: '-5' }
      await expect(handler(getDummyEvent())).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'ID de pedido inválido.',
      })
      expect(mockCompletarPedido).not.toHaveBeenCalled()
    })

    it('rechaza con 400 si el estado enviado no es COMPLETADO', async () => {
      mockBody = { estado: 'EN_PROCESO' }

      await expect(handler(getDummyEvent())).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Solo se permite marcar como COMPLETADO a través de este endpoint.',
      })
      expect(mockCompletarPedido).not.toHaveBeenCalled()
    })

    it('rechaza con 400 si el estado enviado está vacío o es nulo', async () => {
      mockBody = {}

      await expect(handler(getDummyEvent())).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Solo se permite marcar como COMPLETADO a través de este endpoint.',
      })
      expect(mockCompletarPedido).not.toHaveBeenCalled()
    })
  })

  describe('Ejecución exitosa', () => {
    it('completa el pedido exitosamente y delega a PedidoService con el id_usuario de la sesión', async () => {
      const respuesta = await handler(getDummyEvent())

      expect(mockCompletarPedido).toHaveBeenCalledWith(10, 5)
      expect(respuesta).toEqual({
        success: true,
        data: expect.objectContaining({ id_pedido: 10, estado: 'COMPLETADO' }),
        message: 'Pedido completado con éxito.',
      })
    })
  })
})
