import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../server/repositories/devolucion.repository', () => ({
  DevolucionRepository: {
    obtenerDetallePedido: vi.fn(),
    obtenerTotalDevueltoPreviamente: vi.fn(),
    crear: vi.fn(),
    obtenerPorId: vi.fn(),
    actualizarEstado: vi.fn(),
    listar: vi.fn(),
    listarPedidosElegibles: vi.fn(),
    registrarAuditoria: vi.fn(),
  },
}))

vi.mock('../../../server/repositories/producto.repository', () => ({
  ProductoRepository: {
    sumarStock: vi.fn(),
  },
}))

vi.mock('../../../server/repositories/movimiento.repository', () => ({
  MovimientoRepository: {
    crear: vi.fn(),
  },
}))

import { DevolucionRepository } from '../../../server/repositories/devolucion.repository'
import { ProductoRepository } from '../../../server/repositories/producto.repository'
import { MovimientoRepository } from '../../../server/repositories/movimiento.repository'
import { DevolucionService } from '../../../server/services/devolucion.service'

const repoDev = vi.mocked(DevolucionRepository)
const repoProd = vi.mocked(ProductoRepository)
const repoMov = vi.mocked(MovimientoRepository)

describe('RF-11 · DevolucionService Unitario (Armando)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('registrarDevolucion', () => {
    const payloadValido = {
      id_pedido: 10,
      id_producto: 5,
      cantidad_devuelta: 3,
      motivo: 'Pan aplastado en transporte',
      estado: 'PENDIENTE' as const,
    }

    it('falla con 400 si no se proporciona id_usuario ni en sesión ni en datos', async () => {
      await expect(
        DevolucionService.registrarDevolucion(payloadValido as any, undefined)
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: expect.stringContaining('El ID de usuario es obligatorio'),
      })
    })

    it('falla con 400 si el producto no pertenece al pedido indicado', async () => {
      repoDev.obtenerDetallePedido.mockResolvedValue(null)

      await expect(
        DevolucionService.registrarDevolucion(payloadValido as any, 1)
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: expect.stringContaining('no forma parte del pedido'),
      })
      expect(repoDev.obtenerDetallePedido).toHaveBeenCalledWith(10, 5)
    })

    it('falla con 400 si la cantidad devuelta supera la disponible del pedido', async () => {
      repoDev.obtenerDetallePedido.mockResolvedValue({
        id_detalle_pedido: 1,
        id_pedido: 10,
        id_producto: 5,
        cantidad: 10,
        cantidad_entregada: 10,
      } as any)
      repoDev.obtenerTotalDevueltoPreviamente.mockResolvedValue(8) // Disponibles: 10 - 8 = 2. Intenta devolver 3

      await expect(
        DevolucionService.registrarDevolucion(payloadValido as any, 1)
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: expect.stringContaining('supera la cantidad disponible del pedido'),
      })
    })

    it('registra exitosamente una devolución en estado PENDIENTE sin alterar stock ni movimientos', async () => {
      repoDev.obtenerDetallePedido.mockResolvedValue({
        id_detalle_pedido: 1,
        id_pedido: 10,
        id_producto: 5,
        cantidad: 10,
        cantidad_entregada: 10,
      } as any)
      repoDev.obtenerTotalDevueltoPreviamente.mockResolvedValue(0)

      const devolucionCreada = {
        id_devolucion: 99,
        id_pedido: 10,
        id_producto: 5,
        id_lote: null,
        id_usuario: 1,
        cantidad_devuelta: 3,
        motivo: 'Pan aplastado en transporte',
        fecha: '2026-10-28',
        estado: 'PENDIENTE' as const,
        observaciones: null,
      }
      repoDev.crear.mockResolvedValue(devolucionCreada)

      const res = await DevolucionService.registrarDevolucion(payloadValido as any, 1)

      expect(res).toEqual(devolucionCreada)
      expect(repoDev.crear).toHaveBeenCalled()
      expect(repoProd.sumarStock).not.toHaveBeenCalled()
      expect(repoMov.crear).not.toHaveBeenCalled()
      expect(repoDev.registrarAuditoria).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'REGISTRAR_DEVOLUCION',
          registro_id: 99,
        })
      )
    })

    it('reingresa al inventario y genera movimiento cuando la devolución se registra directamente APROBADA', async () => {
      repoDev.obtenerDetallePedido.mockResolvedValue({
        id_detalle_pedido: 1,
        id_pedido: 10,
        id_producto: 5,
        cantidad: 10,
        cantidad_entregada: 10,
      } as any)
      repoDev.obtenerTotalDevueltoPreviamente.mockResolvedValue(0)

      const devolucionAprobada = {
        id_devolucion: 100,
        id_pedido: 10,
        id_producto: 5,
        id_lote: 7,
        id_usuario: 2,
        cantidad_devuelta: 4,
        motivo: 'Devuelto por error de solicitud',
        fecha: '2026-10-28',
        estado: 'APROBADA' as const,
        observaciones: 'Reingreso verificado en recepción',
      }
      repoDev.crear.mockResolvedValue(devolucionAprobada)
      repoProd.sumarStock.mockResolvedValue({ stock_anterior: 20, stock_nuevo: 24 })

      const res = await DevolucionService.registrarDevolucion(
        { ...payloadValido, estado: 'APROBADA', id_lote: 7 } as any,
        2
      )

      expect(res).toEqual(devolucionAprobada)
      expect(repoProd.sumarStock).toHaveBeenCalledWith(5, 4)
      expect(repoMov.crear).toHaveBeenCalledWith({
        id_producto: 5,
        id_lote: 7,
        id_devolucion: 100,
        id_usuario: 2,
        tipo_movimiento: 'DEVOLUCION',
        cantidad: 4,
        stock_anterior: 20,
        stock_nuevo: 24,
        observaciones: 'Reingreso verificado en recepción',
      })
      expect(repoDev.registrarAuditoria).toHaveBeenCalled()
    })
  })

  describe('cambiarEstadoDevolucion', () => {
    it('falla con 404 si la devolución no existe', async () => {
      repoDev.obtenerPorId.mockResolvedValue(null)

      await expect(
        DevolucionService.cambiarEstadoDevolucion(999, { estado: 'APROBADA' })
      ).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: expect.stringContaining('no existe'),
      })
    })

    it('devuelve el registro intacto si el estado es idéntico al actual', async () => {
      const devExistente = {
        id_devolucion: 50,
        estado: 'PENDIENTE' as const,
      }
      repoDev.obtenerPorId.mockResolvedValue(devExistente as any)

      const res = await DevolucionService.cambiarEstadoDevolucion(50, { estado: 'PENDIENTE' })
      expect(res).toBe(devExistente)
      expect(repoDev.actualizarEstado).not.toHaveBeenCalled()
    })

    it('impide modificar una devolución que ya se encuentra APROBADA', async () => {
      const devAprobada = {
        id_devolucion: 51,
        estado: 'APROBADA' as const,
      }
      repoDev.obtenerPorId.mockResolvedValue(devAprobada as any)

      await expect(
        DevolucionService.cambiarEstadoDevolucion(51, { estado: 'RECHAZADA' })
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: expect.stringContaining('No se puede modificar una devolución que ya fue APROBADA'),
      })
      expect(repoDev.actualizarEstado).not.toHaveBeenCalled()
    })

    it('al cambiar de PENDIENTE a APROBADA: actualiza estado, incrementa stock y genera movimiento', async () => {
      const devPendiente = {
        id_devolucion: 52,
        id_pedido: 8,
        id_producto: 3,
        id_lote: 12,
        id_usuario: 4,
        cantidad_devuelta: 6,
        estado: 'PENDIENTE' as const,
        observaciones: 'Observación inicial',
      }
      repoDev.obtenerPorId.mockResolvedValue(devPendiente as any)
      repoDev.actualizarEstado.mockResolvedValue({
        ...devPendiente,
        estado: 'APROBADA',
      } as any)
      repoProd.sumarStock.mockResolvedValue({ stock_anterior: 10, stock_nuevo: 16 })

      const res = await DevolucionService.cambiarEstadoDevolucion(
        52,
        { estado: 'APROBADA', observaciones: 'Aprobado por jefe de almacén' },
        1
      )

      expect(res.estado).toBe('APROBADA')
      expect(repoDev.actualizarEstado).toHaveBeenCalledWith(52, {
        estado: 'APROBADA',
        observaciones: 'Aprobado por jefe de almacén',
      })
      expect(repoProd.sumarStock).toHaveBeenCalledWith(3, 6)
      expect(repoMov.crear).toHaveBeenCalledWith({
        id_producto: 3,
        id_lote: 12,
        id_devolucion: 52,
        id_usuario: 1,
        tipo_movimiento: 'DEVOLUCION',
        cantidad: 6,
        stock_anterior: 10,
        stock_nuevo: 16,
        observaciones: 'Aprobado por jefe de almacén',
      })
      expect(repoDev.registrarAuditoria).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'CAMBIAR_ESTADO_DEVOLUCION',
          registro_id: 52,
        })
      )
    })

    it('al cambiar de PENDIENTE a RECHAZADA: actualiza estado sin alterar stock', async () => {
      const devPendiente = {
        id_devolucion: 53,
        id_producto: 3,
        cantidad_devuelta: 6,
        estado: 'PENDIENTE' as const,
        id_usuario: 4,
      }
      repoDev.obtenerPorId.mockResolvedValue(devPendiente as any)
      repoDev.actualizarEstado.mockResolvedValue({
        ...devPendiente,
        estado: 'RECHAZADA',
      } as any)

      const res = await DevolucionService.cambiarEstadoDevolucion(53, {
        estado: 'RECHAZADA',
        observaciones: 'El producto fue dañado por mal uso del cliente',
      })

      expect(res.estado).toBe('RECHAZADA')
      expect(repoProd.sumarStock).not.toHaveBeenCalled()
      expect(repoMov.crear).not.toHaveBeenCalled()
      expect(repoDev.registrarAuditoria).toHaveBeenCalled()
    })
  })

  describe('listarDevoluciones', () => {
    it('valida filtros y delega la consulta al repositorio', async () => {
      repoDev.listar.mockResolvedValue([])

      const filtros = {
        estado: 'APROBADA',
        id_producto: '4',
        desde: '2026-10-01',
        hasta: '2026-10-28',
        limite: '50',
      }

      await DevolucionService.listarDevoluciones(filtros)

      expect(repoDev.listar).toHaveBeenCalledWith({
        estado: 'APROBADA',
        id_producto: 4,
        id_pedido: undefined,
        id_destinatario: undefined,
        fechaDesde: '2026-10-01',
        fechaHasta: '2026-10-28',
        limite: 50,
      })
    })

    it('falla con 400 si los filtros son incoherentes (desde > hasta)', async () => {
      await expect(
        DevolucionService.listarDevoluciones({
          desde: '2026-10-28',
          hasta: '2026-10-01',
        })
      ).rejects.toMatchObject({
        statusCode: 400,
      })
    })
  })

  describe('obtenerDevolucionPorId', () => {
    it('falla con 400 si el id no es positivo', async () => {
      await expect(DevolucionService.obtenerDevolucionPorId(0)).rejects.toMatchObject({
        statusCode: 400,
      })
    })

    it('falla con 404 si la devolución no existe', async () => {
      repoDev.obtenerPorId.mockResolvedValue(null)
      await expect(DevolucionService.obtenerDevolucionPorId(777)).rejects.toMatchObject({
        statusCode: 404,
      })
    })

    it('retorna la devolución completa encontrada', async () => {
      const mockDetalle = {
        id_devolucion: 777,
        id_pedido: 1,
        id_producto: 2,
        producto: { nombre: 'Baguette', unidad_medida: 'unidad' },
      }
      repoDev.obtenerPorId.mockResolvedValue(mockDetalle as any)

      const res = await DevolucionService.obtenerDevolucionPorId(777)
      expect(res).toBe(mockDetalle)
    })
  })

  describe('obtenerPedidosElegibles', () => {
    it('delega al repositorio la obtención de pedidos', async () => {
      repoDev.listarPedidosElegibles.mockResolvedValue([{ id_pedido: 1 }] as any)
      const res = await DevolucionService.obtenerPedidosElegibles()
      expect(res).toEqual([{ id_pedido: 1 }])
      expect(repoDev.listarPedidosElegibles).toHaveBeenCalledOnce()
    })
  })
})

