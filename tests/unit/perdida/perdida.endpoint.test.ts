import { beforeEach, describe, expect, it, vi } from 'vitest'

let mockCookies: Record<string, string | undefined> = {}
let mockBody: any = {}

vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    getCookie: vi.fn((_event: any, name: string) => mockCookies[name]),
    readBody: vi.fn(async () => mockBody),
  }
})

vi.mock('../../../server/services/perdida.service', () => ({
  crearPerdida: vi.fn(),
}))

import { crearPerdida } from '../../../server/services/perdida.service'
import handler from '../../../server/api/perdida/index.post'

const mockCrearPerdida = vi.mocked(crearPerdida)

describe('RF-09 · POST /api/perdida (Defectos D-18 y D-19)', () => {
  const dummyEvent = {} as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockCookies = {}
    mockBody = {
      id_producto: 1,
      cantidad: 5,
      motivo: 'Deterioro',
      tipo_perdida: 'MERMA',
      fecha: '2026-10-07',
    }
    mockCrearPerdida.mockResolvedValue({
      id_perdida: 1,
      id_producto: 1,
      id_lote: null,
      id_usuario: 5,
      cantidad: 5,
      stock_anterior: 20,
      stock_nuevo: 15,
      motivo: 'Deterioro',
      tipo_perdida: 'MERMA',
      fecha: '2026-10-07',
      observaciones: null,
    })
  })

  describe('D-18 · Validación de sesión y rechazo no autenticado (401)', () => {
    it('rechaza con 401 "No hay sesión activa." si no existe cookie de sesión', async () => {
      mockCookies = {}

      await expect(handler(dummyEvent)).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'No hay sesión activa.',
      })
      expect(mockCrearPerdida).not.toHaveBeenCalled()
    })

    it('rechaza con 401 "La sesión está dañada o es inválida." si la cookie no es JSON', async () => {
      mockCookies = { usuario_session: 'no-es-json-valido' }

      await expect(handler(dummyEvent)).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'La sesión está dañada o es inválida.',
      })
      expect(mockCrearPerdida).not.toHaveBeenCalled()
    })

    it('rechaza con 401 "Sesión inválida." si la cookie es JSON pero no contiene id_usuario', async () => {
      mockCookies = { usuario_session: JSON.stringify({ nombre_usuario: 'sin_id' }) }

      await expect(handler(dummyEvent)).rejects.toMatchObject({
        statusCode: 401,
        statusMessage: 'Sesión inválida.',
      })
      expect(mockCrearPerdida).not.toHaveBeenCalled()
    })

    it('permite registrar la pérdida con cookie usuario_session válida', async () => {
      mockCookies = {
        usuario_session: JSON.stringify({ id_usuario: 5, nombre_usuario: 'admin' }),
      }

      const res = await handler(dummyEvent)
      expect(res).toMatchObject({ id_perdida: 1 })
      expect(mockCrearPerdida).toHaveBeenCalledWith(
        expect.objectContaining({ id_usuario: 5 }),
        5
      )
    })

    it('permite registrar la pérdida con cookie usuario_sesion como fallback', async () => {
      mockCookies = {
        usuario_sesion: JSON.stringify({ id_usuario: 8, nombre_usuario: 'operario' }),
      }

      await handler(dummyEvent)
      expect(mockCrearPerdida).toHaveBeenCalledWith(
        expect.objectContaining({ id_usuario: 8 }),
        8
      )
    })
  })

  describe('D-19 · Prevención de suplantación de identidad (id_usuario)', () => {
    it('ignora y sobrescribe el id_usuario enviado en el body con el de la sesión', async () => {
      mockCookies = {
        usuario_session: JSON.stringify({ id_usuario: 5, nombre_usuario: 'usuario_autenticado' }),
      }
      // Intento de suplantación: el body envía id_usuario: 999
      mockBody = {
        id_producto: 1,
        id_usuario: 999,
        cantidad: 5,
        motivo: 'Deterioro',
        tipo_perdida: 'MERMA',
        fecha: '2026-10-07',
      }

      await handler(dummyEvent)

      // Debe ejecutarse con id_usuario: 5 (sesión), IGNORANDO el 999 del body
      expect(mockCrearPerdida).toHaveBeenCalledWith(
        expect.objectContaining({ id_usuario: 5 }),
        5
      )
    })

    it('asigna el id_usuario de la sesión aunque el body no envíe id_usuario', async () => {
      mockCookies = {
        usuario_session: JSON.stringify({ id_usuario: 7, nombre_usuario: 'usuario7' }),
      }
      mockBody = {
        id_producto: 2,
        cantidad: 3,
        motivo: 'Rotura',
        tipo_perdida: 'MERMA',
      }

      await handler(dummyEvent)

      expect(mockCrearPerdida).toHaveBeenCalledWith(
        expect.objectContaining({ id_usuario: 7 }),
        7
      )
    })
  })
})
