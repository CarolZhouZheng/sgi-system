import { existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { fetch } from '@nuxt/test-utils/e2e'

if (existsSync('.env')) process.loadEnvFile('.env')

/** Marca de todos los datos creados por las pruebas en la base compartida. */
export const MARCA = '[QA-TEST]'
export const corrida = Date.now()
export const hayCredenciales = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)

export const crearClienteServicio = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

/** Cliente con la clave pública, como el que usa el navegador. */
export const crearClientePublico = () =>
  createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

export const pedir = async (metodo: string, ruta: string, body?: unknown) => {
  const respuesta = await fetch(ruta, {
    method: metodo,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: respuesta.status, json: await respuesta.json() }
}
