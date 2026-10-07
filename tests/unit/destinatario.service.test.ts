import { beforeEach, describe, expect, it, vi } from 'vitest'

const crear = vi.fn()
const obtenerTodos = vi.fn()

vi.mock('../../server/repositories/destinatario.repository', () => ({
  DestinatarioRepository: class {
    crear = crear
    obtenerTodos = obtenerTodos
  },
}))

import { DestinatarioService } from '../../server/services/destinatario.service'

describe('RF-12 · DestinatarioService', () => {
  let service: DestinatarioService

  beforeEach(() => {
    vi.resetAllMocks()
    obtenerTodos.mockResolvedValue([])
    service = new DestinatarioService()
  })

  it('registra un destinatario y devuelve success true', async () => {
    const datos = { nombre_empresa: 'Soda Doña Ana' }
    crear.mockResolvedValue({ id_destinatario: 1, ...datos, estado: true })

    const resultado = await service.registrarDestinatario(datos)

    expect(resultado).toEqual({ success: true, data: { id_destinatario: 1, ...datos, estado: true } })
    expect(crear).toHaveBeenCalledWith(datos)
  })

  // D-07 (corregido): no se permiten empresas duplicadas.
  it.each([
    ['mismo nombre', 'Soda Doña Ana'],
    ['otras mayúsculas', 'SODA DOÑA ANA'],
    ['espacios alrededor', '  soda doña ana  '],
  ])('rechaza un duplicado (%s) y no lo guarda', async (_caso, nombre) => {
    obtenerTodos.mockResolvedValue([{ id_destinatario: 5, nombre_empresa: 'Soda Doña Ana' }])

    const resultado = await service.registrarDestinatario({ nombre_empresa: nombre })

    expect(resultado).toEqual({
      success: false,
      error: 'Ya existe un destinatario registrado con ese nombre de empresa.',
    })
    expect(crear).not.toHaveBeenCalled()
  })

  // D-08 (corregido): "_", "%" y "*" no actúan como comodines.
  it.each(['Soda_Doña Ana', 'Soda%', 'Soda*'])('permite "%s" aunque exista "Soda Doña Ana"', async (nombre) => {
    obtenerTodos.mockResolvedValue([{ id_destinatario: 5, nombre_empresa: 'Soda Doña Ana' }])
    crear.mockResolvedValue({ id_destinatario: 6, nombre_empresa: nombre })

    const resultado = await service.registrarDestinatario({ nombre_empresa: nombre })

    expect(resultado.success).toBe(true)
    expect(crear).toHaveBeenCalledOnce()
  })

  it('devuelve success false si falla la consulta de duplicados', async () => {
    obtenerTodos.mockRejectedValue(new Error('sin conexión'))

    const resultado = await service.registrarDestinatario({ nombre_empresa: 'X' })

    expect(resultado).toEqual({ success: false, error: 'sin conexión' })
    expect(crear).not.toHaveBeenCalled()
  })

  it('devuelve success false con el mensaje si el repositorio falla', async () => {
    crear.mockRejectedValue(new Error('duplicate key'))

    const resultado = await service.registrarDestinatario({ nombre_empresa: 'X' })

    expect(resultado).toEqual({ success: false, error: 'duplicate key' })
  })

  it('lista los destinatarios', async () => {
    obtenerTodos.mockResolvedValue([{ id_destinatario: 2, nombre_empresa: 'B' }])

    await expect(service.listarDestinatarios()).resolves.toEqual({
      success: true,
      data: [{ id_destinatario: 2, nombre_empresa: 'B' }],
    })
  })

  it('devuelve success false si falla el listado', async () => {
    obtenerTodos.mockRejectedValue(new Error('sin conexión'))

    await expect(service.listarDestinatarios()).resolves.toEqual({ success: false, error: 'sin conexión' })
  })
})
