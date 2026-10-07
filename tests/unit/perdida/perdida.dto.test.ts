import { describe, expect, it } from 'vitest'
import { registrarPerdidaSchema } from '../../../server/dtos/perdida.dto'

describe('RF-09 · registrarPerdidaSchema', () => {
  const perdidaValida = {
    id_producto: 1,
    id_usuario: 5,
    cantidad: 10,
    motivo: 'Caducado',
    tipo_perdida: 'VENCIMIENTO',
    fecha: '2026-10-07',
    observaciones: 'Lote caducó ayer',
  }

  it('valida exitosamente un payload completo y correcto', () => {
    const resultado = registrarPerdidaSchema.safeParse(perdidaValida)
    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data.id_producto).toBe(1)
      expect(resultado.data.id_usuario).toBe(5)
      expect(resultado.data.cantidad).toBe(10)
      expect(resultado.data.motivo).toBe('Caducado')
    }
  })

  it('acepta id_lote nulo u opcional', () => {
    expect(registrarPerdidaSchema.safeParse({ ...perdidaValida, id_lote: null }).success).toBe(true)
    expect(registrarPerdidaSchema.safeParse({ ...perdidaValida, id_lote: undefined }).success).toBe(true)
    expect(registrarPerdidaSchema.safeParse({ ...perdidaValida, id_lote: 2 }).success).toBe(true)
  })

  it('rechaza cantidades menores o iguales a cero', () => {
    expect(registrarPerdidaSchema.safeParse({ ...perdidaValida, cantidad: 0 }).success).toBe(false)
    expect(registrarPerdidaSchema.safeParse({ ...perdidaValida, cantidad: -5 }).success).toBe(false)
  })

  it('rechaza motivos vacíos o con solo espacios', () => {
    expect(registrarPerdidaSchema.safeParse({ ...perdidaValida, motivo: '' }).success).toBe(false)
    expect(registrarPerdidaSchema.safeParse({ ...perdidaValida, motivo: '   ' }).success).toBe(false)
  })

  it('rechaza tipo de pérdida vacío', () => {
    expect(registrarPerdidaSchema.safeParse({ ...perdidaValida, tipo_perdida: '' }).success).toBe(false)
    expect(registrarPerdidaSchema.safeParse({ ...perdidaValida, tipo_perdida: '   ' }).success).toBe(false)
  })

  it('rechaza id_producto no positivo o no entero', () => {
    expect(registrarPerdidaSchema.safeParse({ ...perdidaValida, id_producto: 0 }).success).toBe(false)
    expect(registrarPerdidaSchema.safeParse({ ...perdidaValida, id_producto: -1 }).success).toBe(false)
    expect(registrarPerdidaSchema.safeParse({ ...perdidaValida, id_producto: 1.5 }).success).toBe(false)
  })
})
