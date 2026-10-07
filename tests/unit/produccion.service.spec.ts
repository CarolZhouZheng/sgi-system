import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProduccionService } from '../../server/services/produccion.service'
import { ProduccionRepository } from '../../server/repositories/produccion.repository'
import type { ProduccionDetalle } from '../../server/models/produccion.model'

vi.mock('../../server/repositories/produccion.repository', () => ({
  ProduccionRepository: {
    listarCola: vi.fn(),
    obtenerPorId: vi.fn(),
    crear: vi.fn(),
    cambiarEstado: vi.fn(),
    actualizar: vi.fn(),
    productoActivoExiste: vi.fn(),
    usuarioActivoExiste: vi.fn(),
    pedidoExiste: vi.fn(),
    registrarAuditoria: vi.fn(),
  },
}))

describe('ProduccionService - Lógica de Negocio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listarColaProduccion', () => {
    it('debe ordenar la cola priorizando EN_PROCESO > PENDIENTE > COMPLETADA y por prioridad de pedido (URGENTE > ALTA > NORMAL > BAJA)', async () => {
      const mockLista: ProduccionDetalle[] = [
        {
          id_produccion: 1,
          id_producto: 1,
          id_usuario: 1,
          cantidad_planificada: 10,
          cantidad_producida: 0,
          estado: 'PENDIENTE',
          fecha_produccion: '2026-10-06',
          pedido: { id_pedido: 1, prioridad: 'NORMAL', estado: 'PENDIENTE' },
        },
        {
          id_produccion: 2,
          id_producto: 1,
          id_usuario: 1,
          cantidad_planificada: 10,
          cantidad_producida: 5,
          estado: 'EN_PROCESO',
          fecha_produccion: '2026-10-06',
          pedido: { id_pedido: 2, prioridad: 'NORMAL', estado: 'EN_PROCESO' },
        },
        {
          id_produccion: 3,
          id_producto: 1,
          id_usuario: 1,
          cantidad_planificada: 20,
          cantidad_producida: 0,
          estado: 'PENDIENTE',
          fecha_produccion: '2026-10-06',
          pedido: { id_pedido: 3, prioridad: 'URGENTE', estado: 'PENDIENTE' },
        },
        {
          id_produccion: 4,
          id_producto: 1,
          id_usuario: 1,
          cantidad_planificada: 20,
          cantidad_producida: 20,
          estado: 'COMPLETADA',
          fecha_produccion: '2026-10-06',
          pedido: null,
        },
      ]

      vi.mocked(ProduccionRepository.listarCola).mockResolvedValue(mockLista)

      const resultado = await ProduccionService.listarColaProduccion()

      // 1. EN_PROCESO primero (id 2)
      // 2. PENDIENTE URGENTE (id 3)
      // 3. PENDIENTE NORMAL (id 1)
      // 4. COMPLETADA (id 4)
      expect(resultado.map((r) => r.id_produccion)).toEqual([2, 3, 1, 4])
    })
  })

  describe('obtenerProduccionPorId', () => {
    it('debe retornar la orden si existe', async () => {
      const mockProduccion = {
        id_produccion: 10,
        id_producto: 1,
        id_usuario: 1,
        cantidad_planificada: 50,
        cantidad_producida: 0,
        estado: 'PENDIENTE' as const,
        fecha_produccion: '2026-10-06',
      }
      vi.mocked(ProduccionRepository.obtenerPorId).mockResolvedValue(mockProduccion as ProduccionDetalle)

      const result = await ProduccionService.obtenerProduccionPorId(10)
      expect(result).toEqual(mockProduccion)
      expect(ProduccionRepository.obtenerPorId).toHaveBeenCalledWith(10)
    })

    it('debe arrojar error 404 si la orden no existe', async () => {
      vi.mocked(ProduccionRepository.obtenerPorId).mockResolvedValue(null)

      await expect(ProduccionService.obtenerProduccionPorId(999)).rejects.toMatchObject({
        statusCode: 404,
      })
    })
  })

  describe('registrarOrdenProduccion', () => {
    it('debe validar existencia de producto y usuario, crear orden y registrar auditoría', async () => {
      vi.mocked(ProduccionRepository.productoActivoExiste).mockResolvedValue(true)
      vi.mocked(ProduccionRepository.usuarioActivoExiste).mockResolvedValue(true)
      vi.mocked(ProduccionRepository.pedidoExiste).mockResolvedValue(true)

      const nuevaOrden = {
        id_produccion: 101,
        id_producto: 2,
        id_usuario: 1,
        id_pedido: 5,
        cantidad_planificada: 100,
        cantidad_producida: 0,
        estado: 'PENDIENTE' as const,
        fecha_produccion: '2026-10-06',
      }
      vi.mocked(ProduccionRepository.crear).mockResolvedValue(nuevaOrden)

      const datos = {
        id_producto: 2,
        id_usuario: 1,
        id_pedido: 5,
        cantidad_planificada: 100,
        cantidad_producida: 0,
        estado: 'PENDIENTE' as const,
      }

      const res = await ProduccionService.registrarOrdenProduccion(datos)

      expect(res.id_produccion).toBe(101)
      expect(ProduccionRepository.productoActivoExiste).toHaveBeenCalledWith(2)
      expect(ProduccionRepository.usuarioActivoExiste).toHaveBeenCalledWith(1)
      expect(ProduccionRepository.pedidoExiste).toHaveBeenCalledWith(5)
      expect(ProduccionRepository.crear).toHaveBeenCalled()
      expect(ProduccionRepository.registrarAuditoria).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: 'REGISTRAR_ORDEN_PRODUCCION',
          tabla_afectada: 'produccion',
          registro_id: 101,
        })
      )
    })

    it('debe lanzar error 400 si el producto no existe o está inactivo', async () => {
      vi.mocked(ProduccionRepository.productoActivoExiste).mockResolvedValue(false)

      await expect(
        ProduccionService.registrarOrdenProduccion({
          id_producto: 999,
          id_usuario: 1,
          cantidad_planificada: 50,
          cantidad_producida: 0,
          estado: 'PENDIENTE',
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'El producto seleccionado no existe o se encuentra inactivo.',
      })
    })

    it('debe lanzar error 400 si el usuario no existe o está inactivo', async () => {
      vi.mocked(ProduccionRepository.productoActivoExiste).mockResolvedValue(true)
      vi.mocked(ProduccionRepository.usuarioActivoExiste).mockResolvedValue(false)

      await expect(
        ProduccionService.registrarOrdenProduccion({
          id_producto: 1,
          id_usuario: 999,
          cantidad_planificada: 50,
          cantidad_producida: 0,
          estado: 'PENDIENTE',
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'El usuario especificado no existe o se encuentra inactivo.',
      })
    })

    it('debe lanzar error 400 si el pedido asociado no existe', async () => {
      vi.mocked(ProduccionRepository.productoActivoExiste).mockResolvedValue(true)
      vi.mocked(ProduccionRepository.usuarioActivoExiste).mockResolvedValue(true)
      vi.mocked(ProduccionRepository.pedidoExiste).mockResolvedValue(false)

      await expect(
        ProduccionService.registrarOrdenProduccion({
          id_producto: 1,
          id_usuario: 1,
          id_pedido: 888,
          cantidad_planificada: 50,
          cantidad_producida: 0,
          estado: 'PENDIENTE',
        })
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'El pedido con ID #888 no existe.',
      })
    })
  })

  describe('cambiarEstadoProduccion', () => {
    it('debe cambiar estado de PENDIENTE a EN_PROCESO correctamente', async () => {
      const ordenActual: ProduccionDetalle = {
        id_produccion: 5,
        id_producto: 1,
        id_usuario: 1,
        cantidad_planificada: 30,
        cantidad_producida: 0,
        estado: 'PENDIENTE',
        fecha_produccion: '2026-10-06',
      }
      vi.mocked(ProduccionRepository.obtenerPorId).mockResolvedValue(ordenActual)
      vi.mocked(ProduccionRepository.cambiarEstado).mockResolvedValue({
        ...ordenActual,
        estado: 'EN_PROCESO',
      })

      const resultado = await ProduccionService.cambiarEstadoProduccion(5, {
        estado: 'EN_PROCESO',
      })

      expect(resultado.estado).toBe('EN_PROCESO')
      expect(ProduccionRepository.cambiarEstado).toHaveBeenCalledWith(5, {
        estado: 'EN_PROCESO',
        cantidad_producida: undefined,
      })
      expect(ProduccionRepository.registrarAuditoria).toHaveBeenCalled()
    })

    it('debe asignar automáticamente cantidad_planificada si pasa a COMPLETADA y no se envió cantidad_producida', async () => {
      const ordenActual: ProduccionDetalle = {
        id_produccion: 5,
        id_producto: 1,
        id_usuario: 1,
        cantidad_planificada: 45,
        cantidad_producida: 0,
        estado: 'EN_PROCESO',
        fecha_produccion: '2026-10-06',
      }
      vi.mocked(ProduccionRepository.obtenerPorId).mockResolvedValue(ordenActual)
      vi.mocked(ProduccionRepository.cambiarEstado).mockResolvedValue({
        ...ordenActual,
        estado: 'COMPLETADA',
        cantidad_producida: 45,
      })

      await ProduccionService.cambiarEstadoProduccion(5, {
        estado: 'COMPLETADA',
      })

      expect(ProduccionRepository.cambiarEstado).toHaveBeenCalledWith(5, {
        estado: 'COMPLETADA',
        cantidad_producida: 45,
      })
    })

    it('no debe permitir cambiar estado de una orden ya COMPLETADA', async () => {
      const ordenCompletada: ProduccionDetalle = {
        id_produccion: 5,
        id_producto: 1,
        id_usuario: 1,
        cantidad_planificada: 45,
        cantidad_producida: 45,
        estado: 'COMPLETADA',
        fecha_produccion: '2026-10-06',
      }
      vi.mocked(ProduccionRepository.obtenerPorId).mockResolvedValue(ordenCompletada)

      await expect(
        ProduccionService.cambiarEstadoProduccion(5, { estado: 'EN_PROCESO' })
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'No se puede modificar una orden de producción que ya ha sido completada.',
      })
    })

    it('no debe permitir cambiar estado de una orden CANCELADA', async () => {
      const ordenCancelada: ProduccionDetalle = {
        id_produccion: 6,
        id_producto: 1,
        id_usuario: 1,
        cantidad_planificada: 45,
        cantidad_producida: 0,
        estado: 'CANCELADA',
        fecha_produccion: '2026-10-06',
      }
      vi.mocked(ProduccionRepository.obtenerPorId).mockResolvedValue(ordenCancelada)

      await expect(
        ProduccionService.cambiarEstadoProduccion(6, { estado: 'EN_PROCESO' })
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'No se puede modificar una orden de producción cancelada.',
      })
    })
  })

  describe('actualizarOrdenProduccion', () => {
    it('debe rechazar la edición si la orden ya está COMPLETADA o CANCELADA', async () => {
      const orden = {
        id_produccion: 7,
        id_producto: 1,
        id_usuario: 1,
        cantidad_planificada: 10,
        cantidad_producida: 10,
        estado: 'COMPLETADA' as const,
        fecha_produccion: '2026-10-06',
      }
      vi.mocked(ProduccionRepository.obtenerPorId).mockResolvedValue(orden as ProduccionDetalle)

      await expect(
        ProduccionService.actualizarOrdenProduccion(7, { cantidad_planificada: 20 })
      ).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'No se pueden editar datos de una orden con estado COMPLETADA.',
      })
    })

    it('debe actualizar orden si está en estado PENDIENTE o EN_PROCESO', async () => {
      const orden = {
        id_produccion: 8,
        id_producto: 1,
        id_usuario: 1,
        cantidad_planificada: 10,
        cantidad_producida: 0,
        estado: 'PENDIENTE' as const,
        fecha_produccion: '2026-10-06',
      }
      vi.mocked(ProduccionRepository.obtenerPorId).mockResolvedValue(orden as ProduccionDetalle)
      vi.mocked(ProduccionRepository.actualizar).mockResolvedValue({
        ...orden,
        cantidad_planificada: 25,
      })

      const res = await ProduccionService.actualizarOrdenProduccion(8, {
        cantidad_planificada: 25,
      })

      expect(res.cantidad_planificada).toBe(25)
      expect(ProduccionRepository.actualizar).toHaveBeenCalledWith(8, {
        cantidad_planificada: 25,
      })
      expect(ProduccionRepository.registrarAuditoria).toHaveBeenCalled()
    })
  })
})
