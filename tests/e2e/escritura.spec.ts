/// <reference types="node" />
/**
 * Pruebas E2E que ESCRIBEN en la base compartida (RF-01, RF-04, RF-05, RF-09).
 *
 * Reglas de seguridad (igual que las pruebas de integración):
 *  - Todo lo que se crea lleva el nombre "[QA-TEST] E2E <corrida>".
 *  - Al terminar se borra solo lo creado, en orden: auditoría → movimientos → pérdidas → lotes → producto.
 *  - Los datos reales solo se leen (se usa un usuario activo existente como autor de la pérdida).
 */
import { existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import type { BrowserContext } from '@playwright/test'
import { expect, test } from './helpers'

if (existsSync('.env')) process.loadEnvFile('.env')

const MARCA = '[QA-TEST]'
const corrida = Date.now()
const NOMBRE = `${MARCA} E2E ${corrida}`

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

let usuario: { id_usuario: number; id_rol: number; nombre: string; nombre_usuario: string }
let idProducto: number | null = null

const fechaEnDias = (dias: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica' }).format(new Date(Date.now() + dias * 86_400_000))

// Las mismas cookies que deja un login real: la página lee `usuario_sesion` y la API `usuario_session`.
async function iniciarSesionComoUsuario(context: BrowserContext, baseURL: string) {
  const valor = encodeURIComponent(JSON.stringify(usuario))
  await context.addCookies([
    { name: 'sesion_activa', value: 'true', url: baseURL },
    { name: 'usuario_sesion', value: valor, url: baseURL },
    { name: 'usuario_session', value: valor, url: baseURL, httpOnly: true },
  ])
}

async function buscarProductoCreado() {
  const { data } = await supabase.from('producto').select('id_producto, estado, stock_actual').eq('nombre', NOMBRE).maybeSingle()
  return data
}

test.describe.serial('E2E con escritura · Productos y Pérdidas', () => {
  test.skip(!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY, 'Requiere el .env con la clave de servicio para limpiar')

  test.beforeAll(async () => {
    // Solo lectura: usuario activo existente que firmará la pérdida.
    const { data, error } = await supabase
      .from('usuario')
      .select('id_usuario, id_rol, nombre, nombre_usuario')
      .eq('estado', true)
      .not('nombre_usuario', 'like', 'qa-test-%')
      .limit(1)
      .single()
    if (error || !data) throw new Error('No hay un usuario activo para las pruebas.')
    usuario = data
  })

  test.afterAll(async () => {
    // Recupera el producto aunque alguna prueba haya fallado antes de guardar su id.
    const { data: productos } = await supabase.from('producto').select('id_producto').eq('nombre', NOMBRE)
    const ids = (productos ?? []).map((p) => p.id_producto)
    if (!ids.length) return

    const errores: string[] = []
    const revisar = (tabla: string, error: { message: string } | null) => { if (error) errores.push(`${tabla}: ${error.message}`) }

    const { data: perdidas } = await supabase.from('perdida').select('id_perdida').in('id_producto', ids)
    const idsPerdida = (perdidas ?? []).map((p) => p.id_perdida)

    if (idsPerdida.length) {
      revisar('auditoria', (await supabase.from('auditoria').delete()
        .eq('accion', 'REGISTRAR_PERDIDA').eq('tabla_afectada', 'perdida').in('registro_id', idsPerdida)).error)
    }
    revisar('movimiento_inventario', (await supabase.from('movimiento_inventario').delete().in('id_producto', ids)).error)
    revisar('perdida', (await supabase.from('perdida').delete().in('id_producto', ids)).error)
    revisar('lote', (await supabase.from('lote').delete().in('id_producto', ids)).error)
    revisar('producto', (await supabase.from('producto').delete().in('id_producto', ids)).error)

    if (errores.length) throw new Error(`Limpieza incompleta (revisar registros ${MARCA}): ${errores.join(' | ')}`)
  })

  test('RF-01 + RF-05: registrar un producto y verlo en otra pestaña sin recargar', async ({ context, baseURL, page, erroresJs }) => {
    await iniciarSesionComoUsuario(context, baseURL!)

    // Pestaña B: solo observa el listado (tiempo real).
    const pestanaB = await context.newPage()
    await pestanaB.goto('/productos', { waitUntil: 'networkidle' })
    await expect(pestanaB.getByText(NOMBRE)).toHaveCount(0)

    // Pestaña A: registra el producto.
    await page.goto('/productos', { waitUntil: 'networkidle' })
    await page.locator('#nombre').fill(NOMBRE)
    await page.locator('#categoria').fill('QA')
    await page.locator('#unidad_medida').fill('unidad')
    await page.locator('#stock_actual').fill('10')
    await page.locator('#fecha_vencimiento').fill(fechaEnDias(30))
    await page.getByRole('button', { name: 'Registrar producto' }).click()

    await expect(page.getByText(/creado exitosamente|registrado exitosamente/i)).toBeVisible()
    await expect(page.locator('tbody tr', { hasText: NOMBRE })).toBeVisible()

    // RF-05: aparece en la pestaña B sin recargarla.
    await expect(pestanaB.locator('tbody tr', { hasText: NOMBRE })).toBeVisible({ timeout: 20_000 })

    const creado = await buscarProductoCreado()
    expect(creado).toMatchObject({ estado: true, stock_actual: 10 })
    idProducto = creado!.id_producto

    await pestanaB.close()
    expect(erroresJs).toEqual([])
  })

  test('RF-04: dar de baja y reactivar el producto', async ({ context, baseURL, page, erroresJs }) => {
    test.skip(!idProducto, 'Depende del producto creado en la prueba anterior')
    await iniciarSesionComoUsuario(context, baseURL!)
    await page.goto('/productos', { waitUntil: 'networkidle' })

    const fila = page.locator('tbody tr', { hasText: NOMBRE })

    await fila.getByTitle('Dar de baja producto').click()
    await page.getByRole('button', { name: 'Confirmar Baja' }).click()
    await expect(fila).toContainText('Inactivo')
    expect((await buscarProductoCreado())?.estado).toBe(false)

    await fila.getByTitle('Reactivar producto').click()
    await page.getByRole('button', { name: 'Confirmar Reactivación' }).click()
    await expect(fila).toContainText(/\bActivo\b/)
    expect((await buscarProductoCreado())?.estado).toBe(true)

    expect(erroresJs).toEqual([])
  })

  test('RF-09: registrar una pérdida descuenta el stock y deja el movimiento', async ({ context, baseURL, page, erroresJs }) => {
    test.skip(!idProducto, 'Depende del producto creado en la primera prueba')
    await iniciarSesionComoUsuario(context, baseURL!)
    await page.goto('/perdidas', { waitUntil: 'networkidle' })

    await page.locator('#producto').selectOption(String(idProducto))
    await page.locator('#cantidad').fill('2')
    await page.locator('#tipo').selectOption('DAÑO')
    await page.locator('#motivo').fill(`${MARCA} E2E`)
    await page.locator('#observaciones').fill(`${MARCA} prueba automática`)
    await page.getByRole('button', { name: 'Registrar Pérdida' }).click()

    await expect(page.getByText('Pérdida registrada exitosamente.')).toBeVisible()

    expect((await buscarProductoCreado())?.stock_actual).toBe(8)

    const { data: movimientos } = await supabase
      .from('movimiento_inventario')
      .select('tipo_movimiento, cantidad, stock_anterior, stock_nuevo, id_usuario')
      .eq('id_producto', idProducto!)
    expect(movimientos).toEqual([
      { tipo_movimiento: 'PERDIDA', cantidad: 2, stock_anterior: 10, stock_nuevo: 8, id_usuario: usuario.id_usuario },
    ])

    expect(erroresJs).toEqual([])
  })
})
