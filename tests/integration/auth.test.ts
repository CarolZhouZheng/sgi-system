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

    // D-12 (corregido en ronda 8)
    it('IA-05 rechaza a un usuario sin contraseña guardada con el mensaje genérico', async () => {
      const { status, json } = await login(usuarios.sinClave, 'cualquiera')

      expect(status).toBe(401)
      expect(json.message).toContain('Credenciales inv')
    })

    // D-13 (corregido en ronda 8)
    it('IA-06 rechaza campos vacíos con 400 y un mensaje legible', async () => {
      const { status, json } = await login('', '')

      expect(status).toBe(400)
      expect(json.message).toBe('Por favor, completa correctamente el usuario y la contraseña.')
    })

    it('IA-08 el login crea la cookie de sesión usuario_session con el id del usuario', async () => {
      const respuesta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nombre_usuario: usuarios.activo, contrasena }),
      })
      const cookie = respuesta.headers.get('set-cookie') || ''
      const valor = decodeURIComponent(cookie.match(/usuario_session=([^;]+)/)?.[1] || '')

      expect(JSON.parse(valor)).toMatchObject({ id_usuario: creados[0], nombre_usuario: usuarios.activo })
      expect(cookie).toContain('Path=/')
    })

    // D-03 (en parte, ronda 9): la cookie de sesión ya es HttpOnly; sigue sin firma (ver IT-33).
    it('IA-09 la cookie de sesión es HttpOnly y la cookie pública sesion_activa no lleva datos', async () => {
      const respuesta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nombre_usuario: usuarios.activo, contrasena }),
      })

      const cookies = respuesta.headers.getSetCookie()
      const sesion = cookies.find((c) => c.startsWith('usuario_session=')) || ''
      const activa = cookies.find((c) => c.startsWith('sesion_activa=')) || ''

      expect(sesion).toMatch(/HttpOnly/i)
      expect(activa).toMatch(/^sesion_activa=true;/)
    })

    it('IA-10 un login fallido no crea cookie de sesión', async () => {
      const respuesta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nombre_usuario: usuarios.activo, contrasena: 'incorrecta' }),
      })

      expect(respuesta.headers.get('set-cookie') || '').not.toContain('usuario_session')
    })

    it('IA-14 cerrar sesión elimina las cookies de sesión', async () => {
      const respuesta = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      expect(respuesta.status).toBe(200)
      const cookies = respuesta.headers.getSetCookie()
      const sesion = cookies.find((c) => c.startsWith('usuario_session=')) || ''
      const activa = cookies.find((c) => c.startsWith('sesion_activa=')) || ''

      expect(sesion).toMatch(/Max-Age=0/i)
      expect(activa).toMatch(/Max-Age=0/i)
    })
  })

  describe('Protección de páginas (D-14, ronda 8)', () => {
    // Desde la ronda 9 el middleware de páginas revisa la cookie pública `sesion_activa`.
    const sesion = () => ({ cookie: 'sesion_activa=true' })
    const esRedireccion = (estado: number) => [301, 302, 303, 307, 308].includes(estado)

    it.each(['/pedidos', '/productos', '/destinatarios'])('IA-07 redirige al login al abrir %s sin sesión', async (ruta) => {
      const respuesta = await fetch(ruta, { redirect: 'manual' })

      expect(esRedireccion(respuesta.status)).toBe(true)
      expect(respuesta.headers.get('location')).toContain('/login')
    })

    it('IA-11 la página de login se abre sin sesión', async () => {
      const respuesta = await fetch('/login', { redirect: 'manual' })
      expect(respuesta.status).toBe(200)
    })

    it('IA-12 con sesión se puede abrir /pedidos', async () => {
      const respuesta = await fetch('/pedidos', { redirect: 'manual', headers: sesion() })
      expect(respuesta.status).toBe(200)
    })

    it('IA-13 con sesión, abrir /login redirige a /productos', async () => {
      const respuesta = await fetch('/login', { redirect: 'manual', headers: sesion() })

      expect(esRedireccion(respuesta.status)).toBe(true)
      expect(respuesta.headers.get('location')).toContain('/productos')
    })
  })
})
