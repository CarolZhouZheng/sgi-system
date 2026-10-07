import { describe, it, expect } from 'vitest'
import {
  CrearProduccionSchema,
  CambiarEstadoProduccionSchema,
  ActualizarProduccionSchema,
  ProduccionIdParamSchema,
  EstadoProduccionEnum,
} from '../../../server/dtos/produccion.dto'

describe('Validaciones DTO - Módulo de Producción', () => {
  describe('EstadoProduccionEnum', () => {
    it('debe aceptar estados válidos en mayúsculas o minúsculas con espacios', () => {
      expect(EstadoProduccionEnum.parse('PENDIENTE')).toBe('PENDIENTE')
      expect(EstadoProduccionEnum.parse('en_proceso')).toBe('EN_PROCESO')
      expect(EstadoProduccionEnum.parse(' completada ')).toBe('COMPLETADA')
      expect(EstadoProduccionEnum.parse('CANCELADA')).toBe('CANCELADA')
    })

    it('debe rechazar estados no permitidos', () => {
      const result = EstadoProduccionEnum.safeParse('ESTADO_INEXISTENTE')
      expect(result.success).toBe(false)
    })
  })

  describe('CrearProduccionSchema', () => {
    it('debe validar exitosamente datos completos y correctos', () => {
      const payloadValido = {
        id_producto: 10,
        id_usuario: 5,
        id_pedido: 2,
        cantidad_planificada: 100,
        cantidad_producida: 0,
        estado: 'PENDIENTE',
        fecha_produccion: '2026-10-06',
        observaciones: 'Lote de prueba',
      }

      const result = CrearProduccionSchema.safeParse(payloadValido)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id_producto).toBe(10)
        expect(result.data.cantidad_planificada).toBe(100)
        expect(result.data.estado).toBe('PENDIENTE')
      }
    })

    it('debe aplicar valores por defecto para estado y cantidad producida', () => {
      const payloadMinimo = {
        id_producto: '10', // coercible
        id_usuario: '5',
        cantidad_planificada: '50',
      }

      const result = CrearProduccionSchema.safeParse(payloadMinimo)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id_producto).toBe(10)
        expect(result.data.id_usuario).toBe(5)
        expect(result.data.cantidad_planificada).toBe(50)
        expect(result.data.cantidad_producida).toBe(0)
        expect(result.data.estado).toBe('PENDIENTE')
      }
    })

    it('debe fallar si cantidad_planificada es <= 0', () => {
      const payloadInvalido = {
        id_producto: 1,
        id_usuario: 1,
        cantidad_planificada: 0,
      }
      const result = CrearProduccionSchema.safeParse(payloadInvalido)
      expect(result.success).toBe(false)
    })

    it('debe fallar si cantidad_producida es negativa', () => {
      const payloadInvalido = {
        id_producto: 1,
        id_usuario: 1,
        cantidad_planificada: 10,
        cantidad_producida: -5,
      }
      const result = CrearProduccionSchema.safeParse(payloadInvalido)
      expect(result.success).toBe(false)
    })

    it('debe fallar si los IDs no son enteros positivos', () => {
      const payloadInvalido = {
        id_producto: -1,
        id_usuario: 0,
        cantidad_planificada: 10,
      }
      const result = CrearProduccionSchema.safeParse(payloadInvalido)
      expect(result.success).toBe(false)
    })
  })

  describe('CambiarEstadoProduccionSchema', () => {
    it('debe validar el cambio de estado con observaciones y tiempo real', () => {
      const payload = {
        estado: 'EN_PROCESO',
        tiempo_real: '2h 30m',
        observaciones: 'Iniciando fase 1',
      }
      const result = CambiarEstadoProduccionSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.estado).toBe('EN_PROCESO')
        expect(result.data.tiempo_real).toBe('2h 30m')
      }
    })

    it('debe rechazar si no se envía un estado válido', () => {
      const payload = {
        tiempo_real: '1h',
      }
      const result = CambiarEstadoProduccionSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })
  })

  describe('ActualizarProduccionSchema', () => {
    it('debe permitir actualizaciones parciales de campos válidos', () => {
      const payload = {
        cantidad_planificada: 200,
        observaciones: 'Ajuste de meta',
      }
      const result = ActualizarProduccionSchema.safeParse(payload)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.cantidad_planificada).toBe(200)
        expect(result.data.observaciones).toBe('Ajuste de meta')
      }
    })
  })

  describe('ProduccionIdParamSchema', () => {
    it('debe aceptar enteros positivos coercibles', () => {
      const result = ProduccionIdParamSchema.safeParse({ id: '42' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(42)
      }
    })

    it('debe rechazar strings no numéricos o negativos', () => {
      expect(ProduccionIdParamSchema.safeParse({ id: 'abc' }).success).toBe(false)
      expect(ProduccionIdParamSchema.safeParse({ id: '-5' }).success).toBe(false)
      expect(ProduccionIdParamSchema.safeParse({ id: '0' }).success).toBe(false)
    })
  })
})
