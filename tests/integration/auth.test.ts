/**
 * Pruebas de integración · RF-15 Autenticación (login nativo)
 *
 * Se crean usuarios temporales con nombre [QA-TEST] y una contraseña aleatoria por corrida.
 * Se borran al terminar. Los usuarios y roles existentes solo se leen.
 */
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MARCA, corrida, crearClienteServicio, hayCredenciales, pedir } from './helpers'

describe.skipIf(!hayCredenciales)('Integración · Autenticación', async () => {
  if (!hayCredenciales) return

  const supabase = crearClienteServicio()
  const contrasena = randomBytes(12).toString('hex')
  const creados: number[] = []
  const usuarios = {
    activo: `qa-test-activo-${corrida}`,
    inactivo: `qa-test-inactivo-${corrida}`,
    sinClave: `qa-test-sinclave-${corrida}`,
  }

  await setup({ server: true })

  beforeAll(async () => {
    const { data: rol, error: errorRol } = await supabase.from('rol').select('id_rol').limit(1).single()
    if (errorRol || !rol) throw new Error('No hay roles para crear el usuario de prueba.')

    const hash = await bcrypt.hash(contrasena, 10)
    const { data, error } = await supabase
      .from('usuario')
      .insert([
        { id_rol: rol.id_rol, nombre: MARCA, nombre_usuario: usuarios.activo, contrasena_hash: hash, estado: true },
        { id_rol: rol.id_rol, nombre: MARCA, nombre_usuario: usuarios.inactivo, contrasena_hash: hash, estado: false },
        { id_rol: rol.id_rol, nombre: MARCA, nombre_usuario: usuarios.sinClave, contrasena_hash: null, estado: true },
      ])
      .select('id_usuario')
    if (error) throw error
    creados.push(...data.map((u) => u.id_usuario))
  })

  afterAll(async () => {
    if (!creados.length) return
    const { error } = await supabase.from('usuario').delete().in('id_usuario', creados)
    if (error) throw new Error(`Limpieza incompleta (revisar usuarios ${MARCA}): ${error.message}`)
  })

  const login = (nombre_usuario: string, clave: string) =>
    pedir('POST', '/api/auth/login', { nombre_usuario, contrasena: clave })

  describe('RF-15 · Login nativo', () => {
    it('IA-01 inicia sesión con credenciales correctas y no devuelve el hash', async () => {
      const { status, json } = await login(usuarios.activo, contrasena)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.usuario).toMatchObject({ nombre_usuario: usuarios.activo, estado: true })
      expect(json.usuario).not.toHaveProperty('contrasena_hash')
    })

    it.each([
      ['IA-02', 'contraseña incorrecta', () => login(usuarios.activo, 'incorrecta')],
      ['IA-03', 'usuario inexistente', () => login(`qa-test-no-existe-${corrida}`, contrasena)],
      ['IA-04', 'usuario inactivo', () => login(usuarios.inactivo, contrasena)],
    ])('%s rechaza %s con 401 y un mensaje genérico', async (_id, _caso, accion) => {
      const { status, json } = await accion()

      expect(status).toBe(401)
      expect(json.message).toContain('Credenciales inv')
    })

    // DEFECTO D-12
    it.fails('IA-05 rechaza a un usuario sin contraseña guardada con el mensaje genérico', async () => {
      const { status, json } = await login(usuarios.sinClave, 'cualquiera')

      expect(status).toBe(401)
      expect(json.message).toContain('Credenciales inv')
    })

    // DEFECTO D-13: los errores de validación del login responden 401 con el JSON interno
    // de Zod como mensaje, en vez de 400 con "El usuario es obligatorio".
    it.fails('IA-06 rechaza campos vacíos con 400 y un mensaje legible', async () => {
      const { status, json } = await login('', '')

      expect(status).toBe(400)
      expect(json.message).toBe('El usuario es obligatorio')
    })
  })

  describe('Protección de páginas', () => {
    // DEFECTO D-14: ninguna página exige sesión. middleware/auth.ts tiene
    // isAuthenticated = true fijo y está fuera de app/, así que Nuxt 4 no lo carga.
    it.fails('IA-07 redirige al login al abrir /pedidos sin sesión', async () => {
      const respuesta = await fetch('/pedidos', { redirect: 'manual' })

      expect([301, 302, 303, 307, 308]).toContain(respuesta.status)
      expect(respuesta.headers.get('location')).toContain('/login')
    })
  })
})
