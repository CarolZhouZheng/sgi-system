import { describe, it, expect } from 'vitest'
import { registrarPerdidaSchema } from '../../server/dtos/perdida.dto'

describe('RF-09 · DTO registrarPerdidaSchema (Mermas / Pérdidas)', () => {
  it('UDTO-01: acepta datos válidos y completos con lote', () => {
    const payload = {
      id_producto: 1,
      id_lote: 2,
      id_usuario: 3,
      cantidad: 15.5,
      motivo: 'Vencimiento prematuro',
      tipo_perdida: 'VENCIMIENTO',
      fecha: '2026-10-06',
      observaciones: 'Detectado en inspección matutina',
    }

    const resultado = registrarPerdidaSchema.safeParse(payload)
    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data.id_producto).toBe(1)
      expect(resultado.data.id_lote).toBe(2)
      expect(resultado.data.id_usuario).toBe(3)
      expect(resultado.data.cantidad).toBe(15.5)
      expect(resultado.data.motivo).toBe('Vencimiento prematuro')
      expect(resultado.data.tipo_perdida).toBe('VENCIMIENTO')
    }
  })

  it('UDTO-02: acepta payload mínimo sin lote, fecha ni observaciones', () => {
    const payload = {
      id_producto: 5,
      id_usuario: 1,
      cantidad: 10,
      motivo: 'Pan quemado en horneado',
      tipo_perdida: 'DANO_PRODUCCION',
    }

    const resultado = registrarPerdidaSchema.safeParse(payload)
    expect(resultado.success).toBe(true)
  })

  it('UDTO-03: acepta id_lote explícitamente en null', () => {
    const payload = {
      id_producto: 2,
      id_lote: null,
      id_usuario: 1,
      cantidad: 5,
      motivo: 'Caída de bandeja',
      tipo_perdida: 'ACCIDENTE',
    }

    const resultado = registrarPerdidaSchema.safeParse(payload)
    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data.id_lote).toBeNull()
    }
  })

  it('UDTO-04: hace trim de motivo y tipo_perdida', () => {
    const payload = {
      id_producto: 1,
      id_usuario: 1,
      cantidad: 3,
      motivo: '   Empaque roto   ',
      tipo_perdida: '   DETERIORO   ',
    }

    const resultado = registrarPerdidaSchema.safeParse(payload)
    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data.motivo).toBe('Empaque roto')
      expect(resultado.data.tipo_perdida).toBe('DETERIORO')
    }
  })

  it('UDTO-05: rechaza cantidad cero (debe ser estrictamente positiva)', () => {
    const payload = {
      id_producto: 1,
      id_usuario: 1,
      cantidad: 0,
      motivo: 'Prueba',
      tipo_perdida: 'VENCIMIENTO',
    }

    const resultado = registrarPerdidaSchema.safeParse(payload)
    expect(resultado.success).toBe(false)
  })

  it('UDTO-06: rechaza cantidad negativa', () => {
    const payload = {
      id_producto: 1,
      id_usuario: 1,
      cantidad: -5,
      motivo: 'Prueba',
      tipo_perdida: 'VENCIMIENTO',
    }

    const resultado = registrarPerdidaSchema.safeParse(payload)
    expect(resultado.success).toBe(false)
  })

  it('UDTO-07: rechaza id_producto menor o igual a cero', () => {
    const payload = {
      id_producto: 0,
      id_usuario: 1,
      cantidad: 5,
      motivo: 'Prueba',
      tipo_perdida: 'VENCIMIENTO',
    }

    expect(registrarPerdidaSchema.safeParse(payload).success).toBe(false)
    expect(registrarPerdidaSchema.safeParse({ ...payload, id_producto: -1 }).success).toBe(false)
  })

  it('UDTO-08: rechaza id_producto decimal', () => {
    const payload = {
      id_producto: 1.5,
      id_usuario: 1,
      cantidad: 5,
      motivo: 'Prueba',
      tipo_perdida: 'VENCIMIENTO',
    }

    expect(registrarPerdidaSchema.safeParse(payload).success).toBe(false)
  })

  it('UDTO-09: rechaza id_usuario menor o igual a cero', () => {
    const payload = {
      id_producto: 1,
      id_usuario: 0,
      cantidad: 5,
      motivo: 'Prueba',
      tipo_perdida: 'VENCIMIENTO',
    }

    expect(registrarPerdidaSchema.safeParse(payload).success).toBe(false)
  })

  it('UDTO-10: rechaza id_lote no positivo si se proporciona número', () => {
    const payload = {
      id_producto: 1,
      id_lote: 0,
      id_usuario: 1,
      cantidad: 5,
      motivo: 'Prueba',
      tipo_perdida: 'VENCIMIENTO',
    }

    expect(registrarPerdidaSchema.safeParse(payload).success).toBe(false)
    expect(registrarPerdidaSchema.safeParse({ ...payload, id_lote: -2 }).success).toBe(false)
  })

  it('UDTO-11: rechaza motivo vacío o solo espacios en blanco', () => {
    const payloadVacio = {
      id_producto: 1,
      id_usuario: 1,
      cantidad: 5,
      motivo: '',
      tipo_perdida: 'VENCIMIENTO',
    }
    const payloadEspacios = {
      ...payloadVacio,
      motivo: '    ',
    }

    expect(registrarPerdidaSchema.safeParse(payloadVacio).success).toBe(false)
    expect(registrarPerdidaSchema.safeParse(payloadEspacios).success).toBe(false)
  })

  it('UDTO-12: rechaza tipo_perdida vacío o solo espacios en blanco', () => {
    const payload = {
      id_producto: 1,
      id_usuario: 1,
      cantidad: 5,
      motivo: 'Merma válida',
      tipo_perdida: '   ',
    }

    expect(registrarPerdidaSchema.safeParse(payload).success).toBe(false)
  })

  it('UDTO-13: rechaza si faltan campos obligatorios (sin producto, usuario, cantidad, etc.)', () => {
    expect(registrarPerdidaSchema.safeParse({}).success).toBe(false)
    expect(
      registrarPerdidaSchema.safeParse({
        id_producto: 1,
        cantidad: 5,
        motivo: 'Solo dos campos',
      }).success
    ).toBe(false)
  })
})
