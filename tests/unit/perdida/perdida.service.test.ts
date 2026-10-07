import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../server/repositories/perdida.repository', () => ({
  registrarPerdida: vi.fn(),
}))

import { registrarPerdida } from '../../../server/repositories/perdida.repository'
import { crearPerdida } from '../../../server/services/perdida.service'
import type { ResultadoPerdida } from '../../../server/models/perdida.model'

const mockRepo = vi.mocked(registrarPerdida)

describe('RF-09 · PerdidaService.crearPerdida', () => {
  const payloadBase = {
    id_producto: 3,
    id_usuario: 10,
    cantidad: 5,
    motivo: 'Deterioro',
    tipo_perdida: 'MERMA',
    fecha: '2026-10-07',
    observaciones: 'Fruta magullada',
  }

  const mockResultado: ResultadoPerdida = {
    id_perdida: 1,
    id_producto: 3,
    id_lote: null,
    id_usuario: 10,
    cantidad: 5,
    stock_anterior: 20,
    stock_nuevo: 15,
    motivo: 'Deterioro',
    tipo_perdida: 'MERMA',
    fecha: '2026-10-07',
    observaciones: 'Fruta magullada',
  }

  beforeEach(() => {
    vi.resetAllMocks()
    mockRepo.mockResolvedValue(mockResultado)
  })

  it('USERV-01: registra la pérdida llamando al repositorio con datos validados', async () => {
    const resultado = await crearPerdida(payloadBase)
    expect(mockRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        id_producto: 3,
        id_usuario: 10,
        cantidad: 5,
        motivo: 'Deterioro',
        tipo_perdida: 'MERMA',
      })
    )
    expect(resultado.id_perdida).toBe(1)
  })

  it('USERV-02: rechaza con error de validación si faltan datos requeridos (no llama al repositorio)', async () => {
    const payloadInvalido = {
      id_producto: 1,
      cantidad: 10,
      motivo: 'Falta usuario',
      tipo_perdida: 'VENCIMIENTO',
    } as any

    await expect(crearPerdida(payloadInvalido)).rejects.toThrow()
    expect(mockRepo).not.toHaveBeenCalled()
  })

  it('USERV-03: rechaza con error de validación si la cantidad es cero o negativa', async () => {
    const payloadInvalido = {
      id_producto: 1,
      id_usuario: 1,
      cantidad: -1,
      motivo: 'Cantidad inválida',
      tipo_perdida: 'VENCIMIENTO',
    }

    await expect(crearPerdida(payloadInvalido)).rejects.toThrow()
    expect(mockRepo).not.toHaveBeenCalled()
  })

  it('USERV-04: propaga errores arrojados por el repositorio (ej. stock insuficiente)', async () => {
    mockRepo.mockRejectedValueOnce(
      new Error('Stock insuficiente. Stock disponible: 5, cantidad solicitada: 10.')
    )

    const payload = {
      id_producto: 1,
      id_usuario: 1,
      cantidad: 10,
      motivo: 'Supera stock',
      tipo_perdida: 'VENCIMIENTO',
    }

    await expect(crearPerdida(payload)).rejects.toThrow('Stock insuficiente')
    expect(mockRepo).toHaveBeenCalledTimes(1)
  })

  it('D-19: sobrescribe id_usuario con idUsuarioSesion si se proporciona', async () => {
    await crearPerdida(payloadBase, 99)
    expect(mockRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        id_usuario: 99,
      })
    )
  })
})
