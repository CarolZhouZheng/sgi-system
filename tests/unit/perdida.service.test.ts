import { describe, it, expect, vi, beforeEach } from 'vitest'
import { crearPerdida } from '../../server/services/perdida.service'
import { registrarPerdida } from '../../server/repositories/perdida.repository'
import type { ResultadoPerdida } from '../../server/models/perdida.model'

vi.mock('../../server/repositories/perdida.repository', () => ({
  registrarPerdida: vi.fn(),
}))

describe('RF-09 · Servicio crearPerdida (Mermas / Pérdidas)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('USERV-01: valida y delega correctamente la creación al repositorio', async () => {
    const mockResultado: ResultadoPerdida = {
      id_perdida: 101,
      id_producto: 1,
      id_lote: null,
      id_usuario: 5,
      cantidad: 10,
      stock_anterior: 50,
      stock_nuevo: 40,
      motivo: 'Pan aplastado en transporte',
      tipo_perdida: 'DANO_TRANSPORTE',
      fecha: '2026-10-06',
      observaciones: 'Lote QA',
    }

    vi.mocked(registrarPerdida).mockResolvedValueOnce(mockResultado)

    const payload = {
      id_producto: 1,
      id_usuario: 5,
      cantidad: 10,
      motivo: 'Pan aplastado en transporte',
      tipo_perdida: 'DANO_TRANSPORTE',
      fecha: '2026-10-06',
      observaciones: 'Lote QA',
    }

    const resultado = await crearPerdida(payload)

    expect(registrarPerdida).toHaveBeenCalledTimes(1)
    expect(registrarPerdida).toHaveBeenCalledWith(
      expect.objectContaining({
        id_producto: 1,
        id_usuario: 5,
        cantidad: 10,
        motivo: 'Pan aplastado en transporte',
        tipo_perdida: 'DANO_TRANSPORTE',
      })
    )
    expect(resultado).toEqual(mockResultado)
  })

  it('USERV-02: rechaza con error de validación si faltan datos requeridos (no llama al repositorio)', async () => {
    const payloadInvalido = {
      id_producto: 1,
      // id_usuario faltante
      cantidad: 10,
      motivo: 'Falta usuario',
      tipo_perdida: 'VENCIMIENTO',
    } as any

    await expect(crearPerdida(payloadInvalido)).rejects.toThrow()
    expect(registrarPerdida).not.toHaveBeenCalled()
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
    expect(registrarPerdida).not.toHaveBeenCalled()
  })

  it('USERV-04: propaga errores arrojados por el repositorio (ej. stock insuficiente)', async () => {
    vi.mocked(registrarPerdida).mockRejectedValueOnce(
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
    expect(registrarPerdida).toHaveBeenCalledTimes(1)
  })
})
