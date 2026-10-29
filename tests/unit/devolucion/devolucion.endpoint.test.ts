import { beforeEach, describe, expect, it, vi } from 'vitest'

let mockQuery: Record<string, any> = {}
let mockBody: Record<string, any> = {}
let mockCookies: Record<string, string | undefined> = {}
let mockParams: Record<string, string | undefined> = {}

vi.mock('h3', async (importOriginal) => {
  const actual: any = await importOriginal()
  return {
    ...actual,
    defineEventHandler: (fn: any) => fn,
    getQuery: () => mockQuery,
    readBody: async () => mockBody,
    getCookie: (_event: any, name: string) => mockCookies[name],
    getRouterParams: () => mockParams,
  }
})

vi.mock('../../../server/services/devolucion.service', () => ({
  DevolucionService: {
    listarDevoluciones: vi.fn(),
    registrarDevolucion: vi.fn(),
    obtenerDevolucionPorId: vi.fn(),
    cambiarEstadoDevolucion: vi.fn(),
    obtenerPedidosElegibles: vi.fn(),
  },
}))

import { DevolucionService } from '../../../server/services/devolucion.service'

const mockService = vi.mocked(DevolucionService)

describe('RF-11 · Endpoints Unitarios de Devoluciones (Armando)', () => {
  const dummyEvent = {
    context: {},
    node: { req: { headers: {} } },
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery = {}
    mockBody = {}
    mockCookies = {}
    mockParams = {}
  })

  describe('GET /api/devoluciones', () => {
    let handler: any
    beforeEach(async () => {
      const mod = await import('../../../server/api/devoluciones/index.get')
      handler = mod.default
    })

    it('retorna la lista de devoluciones y el conteo total', async () => {
      mockQuery = { estado: 'PENDIENTE' }
      mockService.listarDevoluciones.mockResolvedValue([
        { id_devolucion: 1, motivo: 'Dañado' } as any,
      ])

      const res = await handler(dummyEvent)

      expect(mockService.listarDevoluciones).toHaveBeenCalledWith({ estado: 'PENDIENTE' })
      expect(res).toEqual({
        success: true,
        total: 1,
        data: [{ id_devolucion: 1, motivo: 'Dañado' }],
      })
    })

    it('captura errores del servicio y propaga error formateado', async () => {
      const { createError } = await import('h3')
      mockService.listarDevoluciones.mockRejectedValue(
        createError({ statusCode: 400, statusMessage: 'Filtro de fecha inválido.' })
      )

      await expect(handler(dummyEvent)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Filtro de fecha inválido.',
      })
    })
  })

  describe('POST /api/devoluciones', () => {
    let handler: any
    beforeEach(async () => {
      const mod = await import('../../../server/api/devoluciones/index.post')
      handler = mod.default
    })

    it('rechaza con 401 si no hay cookie de sesión activa', async () => {
      mockCookies = {}
      await expect(handler(dummyEvent)).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: expect.stringContaining('No hay sesión activa'),
      })
    })

    it('rechaza con 401 si la cookie de sesión está corrupta', async () => {
      mockCookies = { usuario_session: 'invalido-json' }
      await expect(handler(dummyEvent)).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: expect.stringContaining('dañada'),
      })
    })

    it('procesa el registro inyectando el id_usuario de sesión', async () => {
      mockCookies = { usuario_session: JSON.stringify({ id_usuario: 3, nombre_usuario: 'armando' }) }
      mockBody = {
        id_pedido: 5,
        id_producto: 2,
        cantidad_devuelta: 10,
        motivo: 'Producto roto',
      }
      mockService.registrarDevolucion.mockResolvedValue({
        id_devolucion: 88,
        ...mockBody,
        id_usuario: 3,
      } as any)

      const res = await handler(dummyEvent)

      expect(mockService.registrarDevolucion).toHaveBeenCalledWith(
        expect.objectContaining({ id_pedido: 5, id_usuario: 3 }),
        3
      )
      expect(res).toEqual({
        success: true,
        mensaje: 'Devolución registrada exitosamente.',
        data: expect.objectContaining({ id_devolucion: 88 }),
      })
    })
  })

  describe('GET /api/devoluciones/pedidos-elegibles', () => {
    let handler: any
    beforeEach(async () => {
      const mod = await import('../../../server/api/devoluciones/pedidos-elegibles.get')
      handler = mod.default
    })

    it('retorna los pedidos elegibles para selección rápida', async () => {
      mockService.obtenerPedidosElegibles.mockResolvedValue([
        { id_pedido: 1, destinatario: { nombre_empresa: 'Supermercado Sol' } },
      ] as any)

      const res = await handler(dummyEvent)
      expect(res).toEqual({
        success: true,
        data: [{ id_pedido: 1, destinatario: { nombre_empresa: 'Supermercado Sol' } }],
      })
    })
  })

  describe('GET /api/devoluciones/[id]', () => {
    let handler: any
    beforeEach(async () => {
      const mod = await import('../../../server/api/devoluciones/[id]/index.get')
      handler = mod.default
    })

    it('rechaza con 400 si el parámetro id no es numérico positivo', async () => {
      mockParams = { id: 'no-numero' }
      await expect(handler(dummyEvent)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: expect.stringContaining('no es válido'),
      })
    })

    it('obtiene el detalle de la devolución solicitada', async () => {
      mockParams = { id: '45' }
      mockService.obtenerDevolucionPorId.mockResolvedValue({
        id_devolucion: 45,
        motivo: 'Pan quemado',
      } as any)

      const res = await handler(dummyEvent)
      expect(mockService.obtenerDevolucionPorId).toHaveBeenCalledWith(45)
      expect(res).toEqual({
        success: true,
        data: { id_devolucion: 45, motivo: 'Pan quemado' },
      })
    })
  })

  describe('PATCH /api/devoluciones/[id]/estado', () => {
    let handler: any
    beforeEach(async () => {
      const mod = await import('../../../server/api/devoluciones/[id]/estado.patch')
      handler = mod.default
    })

    it('rechaza con 400 si el estado enviado no es válido', async () => {
      mockParams = { id: '10' }
      mockBody = { estado: 'INVALIDO' }

      await expect(handler(dummyEvent)).rejects.toMatchObject({
        statusCode: 400,
      })
    })

    it('cambia el estado exitosamente pasando usuario de sesión si existe', async () => {
      mockParams = { id: '10' }
      mockCookies = { usuario_session: JSON.stringify({ id_usuario: 5 }) }
      mockBody = {
        estado: 'APROBADA',
        observaciones: 'Reingresado',
      }
      mockService.cambiarEstadoDevolucion.mockResolvedValue({
        id_devolucion: 10,
        estado: 'APROBADA',
      } as any)

      const res = await handler(dummyEvent)

      expect(mockService.cambiarEstadoDevolucion).toHaveBeenCalledWith(
        10,
        { estado: 'APROBADA', observaciones: 'Reingresado' },
        5
      )
      expect(res).toEqual({
        success: true,
        mensaje: 'Estado de la devolución actualizado a APROBADA.',
        data: { id_devolucion: 10, estado: 'APROBADA' },
      })
    })
  })
})
