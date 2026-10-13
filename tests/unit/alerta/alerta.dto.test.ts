import { describe, expect, it } from 'vitest'
import { ConsultaAlertasSchema } from '../../../server/dtos/alerta.dto'

describe('RF-06 · ConsultaAlertasSchema (DTO Unitario)', () => {
  it('valida parámetros vacíos asignando undefined a campos opcionales', () => {
    const parsed = ConsultaAlertasSchema.safeParse({})
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.dias_anticipacion).toBeUndefined()
      expect(parsed.data.solo_vencidos).toBeUndefined()
      expect(parsed.data.solo_por_vencer).toBeUndefined()
    }
  })

  it('transforma strings numéricos a números enteros para dias_anticipacion', () => {
    const parsed = ConsultaAlertasSchema.safeParse({
      dias_anticipacion: '7',
      solo_vencidos: 'true',
      solo_por_vencer: 'false',
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.dias_anticipacion).toBe(7)
      expect(parsed.data.solo_vencidos).toBe(true)
      expect(parsed.data.solo_por_vencer).toBe(false)
    }
  })

  it('permite valores booleanos nativos para los flags de filtrado', () => {
    const parsed = ConsultaAlertasSchema.safeParse({
      solo_vencidos: true,
      solo_por_vencer: true,
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.solo_vencidos).toBe(true)
      expect(parsed.data.solo_por_vencer).toBe(true)
    }
  })

  it('acepta dias_anticipacion en el límite inferior permitido (1 día)', () => {
    const parsed = ConsultaAlertasSchema.safeParse({ dias_anticipacion: 1 })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.dias_anticipacion).toBe(1)
    }
  })

  it('acepta dias_anticipacion en el límite superior permitido (365 días)', () => {
    const parsed = ConsultaAlertasSchema.safeParse({ dias_anticipacion: 365 })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.dias_anticipacion).toBe(365)
    }
  })

  it('rechaza dias_anticipacion si es 0 o negativo', () => {
    const menorQueUno = ConsultaAlertasSchema.safeParse({ dias_anticipacion: 0 })
    expect(menorQueUno.success).toBe(false)

    const negativo = ConsultaAlertasSchema.safeParse({ dias_anticipacion: -5 })
    expect(negativo.success).toBe(false)
  })

  it('rechaza dias_anticipacion mayores a 365', () => {
    const exceso = ConsultaAlertasSchema.safeParse({ dias_anticipacion: 366 })
    expect(exceso.success).toBe(false)
  })

  it('ignora strings vacíos o no numéricos asignando undefined en dias_anticipacion', () => {
    const vacio = ConsultaAlertasSchema.safeParse({ dias_anticipacion: '' })
    expect(vacio.success).toBe(true)
    if (vacio.success) {
      expect(vacio.data.dias_anticipacion).toBeUndefined()
    }

    const textoInvalido = ConsultaAlertasSchema.safeParse({ dias_anticipacion: 'invalido' })
    expect(textoInvalido.success).toBe(true)
    if (textoInvalido.success) {
      expect(textoInvalido.data.dias_anticipacion).toBeUndefined()
    }
  })
})
