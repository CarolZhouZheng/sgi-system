import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../server/repositories/perdida.repository', () => ({
  registrarPerdida: vi.fn(),
}))

import { registrarPerdida } from '../../../server/repositories/perdida.repository'
import { crearPerdida } from '../../../server/services/perdida.service'

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

  beforeEach(() => {
    vi.resetAllMocks()
    mockRepo.mockResolvedValue({
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
    })
  })

  it('registra la pérdida llamando al repositorio con datos validados', async () => {
    const resultado = await crearPerdida(payloadBase)
    expect(mockRepo).toHaveBeenCalledWith(expect.objectContaining({
      id_producto: 3,
      id_usuario: 10,
      cantidad: 5,
    }))
    expect(resultado.id_perdida).toBe(1)
  })

  it('D-19: sobrescribe id_usuario con idUsuarioSesion si se proporciona', async () => {
    await crearPerdida(payloadBase, 99)
    expect(mockRepo).toHaveBeenCalledWith(expect.objectContaining({
      id_usuario: 99,
    }))
  })
})
