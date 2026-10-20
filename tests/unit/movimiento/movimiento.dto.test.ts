import { describe, expect, it } from 'vitest'
import { ConsultaMovimientosSchema } from '../../../server/dtos/movimiento.dto'

describe('RF-08 · ConsultaMovimientosSchema (DTO Unitario)', () => {
  it('aplica defaults correctos cuando no se envían parámetros', () => {
    const res = ConsultaMovimientosSchema.safeParse({})
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.limite).toBe(500)
      expect(res.data.desde).toBeUndefined()
      expect(res.data.hasta).toBeUndefined()
      expect(res.data.id_producto).toBeUndefined()
      expect(res.data.tipo).toBeUndefined()
    }
  })

  it('trata cadenas vacías o espacios como undefined', () => {
    const res = ConsultaMovimientosSchema.safeParse({
      desde: '',
      hasta: '   ',
      id_producto: '',
      tipo: '',
      limite: '',
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.desde).toBeUndefined()
      expect(res.data.hasta).toBeUndefined()
      expect(res.data.id_producto).toBeUndefined()
      expect(res.data.tipo).toBeUndefined()
      expect(res.data.limite).toBe(500)
    }
  })

  it('valida fechas en formato ISO AAAA-MM-DD', () => {
    const res = ConsultaMovimientosSchema.safeParse({
      desde: '2026-10-01',
      hasta: '2026-10-15',
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.desde).toBe('2026-10-01')
      expect(res.data.hasta).toBe('2026-10-15')
    }
  })

  it('rechaza formatos de fecha inválidos', () => {
    const fechaInvalida = ConsultaMovimientosSchema.safeParse({ desde: '01/10/2026' })
    expect(fechaInvalida.success).toBe(false)

    const textoInvalido = ConsultaMovimientosSchema.safeParse({ hasta: 'ayer' })
    expect(textoInvalido.success).toBe(false)
  })

  it('rechaza si la fecha "desde" es posterior a la fecha "hasta"', () => {
    const res = ConsultaMovimientosSchema.safeParse({
      desde: '2026-10-20',
      hasta: '2026-10-10',
    })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.issues[0].message).toBe(
        'La fecha "desde" no puede ser posterior a la fecha "hasta"'
      )
    }
  })

  it('permite que la fecha "desde" sea igual a la fecha "hasta" (consulta de un solo día)', () => {
    const res = ConsultaMovimientosSchema.safeParse({
      desde: '2026-10-15',
      hasta: '2026-10-15',
    })
    expect(res.success).toBe(true)
  })

  it('coacciona y valida id_producto positivo', () => {
    const res = ConsultaMovimientosSchema.safeParse({ id_producto: '42' })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.id_producto).toBe(42)
    }

    const cero = ConsultaMovimientosSchema.safeParse({ id_producto: '0' })
    expect(cero.success).toBe(false)

    const negativo = ConsultaMovimientosSchema.safeParse({ id_producto: '-5' })
    expect(negativo.success).toBe(false)
  })

  it('normaliza tipo a mayúsculas y quita espacios', () => {
    const res = ConsultaMovimientosSchema.safeParse({ tipo: '  perdida  ' })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.tipo).toBe('PERDIDA')
    }
  })

  it('valida límites mínimo (1) y máximo (1000)', () => {
    const min = ConsultaMovimientosSchema.safeParse({ limite: '1' })
    expect(min.success).toBe(true)
    if (min.success) expect(min.data.limite).toBe(1)

    const max = ConsultaMovimientosSchema.safeParse({ limite: '1000' })
    expect(max.success).toBe(true)
    if (max.success) expect(max.data.limite).toBe(1000)

    const menorQueUno = ConsultaMovimientosSchema.safeParse({ limite: '0' })
    expect(menorQueUno.success).toBe(false)

    const mayorQueMil = ConsultaMovimientosSchema.safeParse({ limite: '1001' })
    expect(mayorQueMil.success).toBe(false)
  })
})
