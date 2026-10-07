import bcrypt from 'bcryptjs'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../server/repositories/usuario.repository', () => ({
  UsuarioRepository: { obtenerPorNombreUsuario: vi.fn() },
}))

import { LoginDTO } from '../../../server/dtos/login.dto'
import { UsuarioRepository } from '../../../server/repositories/usuario.repository'
import { AuthService } from '../../../server/services/auth.service'
import { hashPassword, verifyPassword } from '../../../server/utils/password'

const repo = vi.mocked(UsuarioRepository)
let hash: string

const usuario = () => ({
  id_usuario: 4,
  id_rol: 1,
  nombre: 'Ana',
  nombre_usuario: 'ana',
  contrasena_hash: hash,
  estado: true,
})

describe('RF-15 · LoginDTO', () => {
  it('acepta usuario y contraseña', () => {
    expect(LoginDTO.safeParse({ nombre_usuario: 'ana', contrasena: 'secreta' }).success).toBe(true)
  })

  it.each([
    [{ nombre_usuario: '', contrasena: 'x' }, 'El usuario es obligatorio'],
    [{ nombre_usuario: 'ana', contrasena: '' }, 'La contraseña es obligatoria'],
  ])('rechaza campos vacíos (%j)', (datos, mensaje) => {
    const resultado = LoginDTO.safeParse(datos)
    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues[0]?.message).toBe(mensaje)
  })
})

describe('RF-15 · AuthService.login', () => {
  beforeAll(async () => {
    hash = await bcrypt.hash('Clave-Correcta-1', 4)
  })

  beforeEach(() => vi.resetAllMocks())

  it('devuelve el usuario sin el hash de la contraseña', async () => {
    repo.obtenerPorNombreUsuario.mockResolvedValue(usuario() as never)

    const resultado = await AuthService.login('ana', 'Clave-Correcta-1')

    expect(resultado).toMatchObject({ id_usuario: 4, nombre_usuario: 'ana' })
    expect(resultado).not.toHaveProperty('contrasena_hash')
  })

  it('rechaza contraseña incorrecta con "Credenciales inválidas"', async () => {
    repo.obtenerPorNombreUsuario.mockResolvedValue(usuario() as never)

    await expect(AuthService.login('ana', 'otra')).rejects.toThrow('Credenciales inválidas')
  })

  it('rechaza usuario inexistente o inactivo con el mismo mensaje (no revela cuál falló)', async () => {
    repo.obtenerPorNombreUsuario.mockResolvedValue(null as never)

    await expect(AuthService.login('nadie', 'x')).rejects.toThrow('Credenciales inválidas')
  })

  // D-12 (corregido en ronda 8): usuario sin contraseña guardada.
  it('rechaza con "Credenciales inválidas" a un usuario sin contraseña guardada', async () => {
    repo.obtenerPorNombreUsuario.mockResolvedValue({ ...usuario(), contrasena_hash: null } as never)

    await expect(AuthService.login('ana', 'x')).rejects.toThrow('Credenciales inválidas')
  })
})

describe('Utilidad server/utils/password.ts', () => {
  it('verifica la contraseña correcta', () => {
    expect(verifyPassword('secreta', hashPassword('secreta'))).toBe(true)
  })

  it('rechaza una contraseña incorrecta', () => {
    expect(verifyPassword('otra', hashPassword('secreta'))).toBe(false)
  })

  it('genera un hash distinto cada vez (usa sal aleatoria)', () => {
    expect(hashPassword('secreta')).not.toBe(hashPassword('secreta'))
  })

  it.each(['', 'sin-separador', 'sal:zz'])('devuelve false ante un hash mal formado (%j)', (almacenado) => {
    expect(verifyPassword('secreta', almacenado)).toBe(false)
  })
})
