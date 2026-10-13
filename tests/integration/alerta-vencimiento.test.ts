/**
 * Pruebas de integración · Sprint 4 (RF-06)
 * Alertas de Vencimiento de Lotes (Jose Carlos)
 * Responsable de QA: Manuel
 *
 * Flujo probado:
 * API (GET /api/alertas/vencimientos) → DTO → Service → Repository → Supabase (lote + producto + configuracion)
 *
 * Reglas de seguridad sobre la base compartida:
 *  - Todos los datos creados llevan la marca [QA-TEST].
 *  - afterAll elimina estrictamente los registros creados en orden de dependencias:
 *    lote → producto.
 *  - Los registros existentes de la base solo se consultan en modo lectura.
 */
import { existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

if (existsSync('.env')) process.loadEnvFile('.env')

const MARCA = '[QA-TEST]'
const corrida = Date.now()
const hayCredenciales = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)

const creados = {
  lotes: [] as number[],
  productos: [] as number[],
}

const calcularFechaIso = (diasOffset: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + diasOffset)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tegucigalpa' }).format(d)
}

const getApi = async (query = '') => {
  const url = query ? `/api/alertas/vencimientos?${query}` : '/api/alertas/vencimientos'
  const respuesta = await fetch(url, {
    method: 'GET',
    headers: { 'content-type': 'application/json' },
  })
  return { status: respuesta.status, json: await respuesta.json() }
}

describe.skipIf(!hayCredenciales)('Integración · RF-06 Alertas de Vencimiento', async () => {
  if (!hayCredenciales) return

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  let idProductoTest: number
  let idLoteVencido: number
  let idLoteHoy: number
  let idLotePronto: number
  let idLoteLejos: number
  let idLoteInactivo: number
  let idLoteSinStock: number

  await setup({ server: true })

  beforeAll(async () => {
    // 1. Crear producto de prueba auxiliar
    const { data: prod, error: errProd } = await supabase
      .from('producto')
      .insert({
        nombre: `${MARCA} Pan Integral Alertas ${corrida}`,
        unidad_medida: 'bolsa',
        categoria: 'Panadería',
        estado: true,
        stock_actual: 50,
        stock_minimo: 5,
      })
      .select('id_producto')
      .single()

    if (errProd) throw new Error(`Error creando producto de prueba: ${errProd.message}`)
    idProductoTest = prod.id_producto
    creados.productos.push(idProductoTest)

    // 2. Crear lote VENCIDO (hace 2 días, activo, con stock)
    const { data: loteVenc, error: errVenc } = await supabase
      .from('lote')
      .insert({
        id_producto: idProductoTest,
        numero_lote: `${MARCA}-VENCIDO-${corrida}`,
        cantidad: 10,
        fecha_produccion: calcularFechaIso(-10),
        fecha_vencimiento: calcularFechaIso(-2),
        estado: true,
      })
      .select('id_lote')
      .single()
    if (errVenc) throw errVenc
    idLoteVencido = loteVenc.id_lote
    creados.lotes.push(idLoteVencido)

    // 3. Crear lote que VENCE HOY (0 días, activo, con stock)
    const { data: loteHoy, error: errHoy } = await supabase
      .from('lote')
      .insert({
        id_producto: idProductoTest,
        numero_lote: `${MARCA}-HOY-${corrida}`,
        cantidad: 5,
        fecha_produccion: calcularFechaIso(-5),
        fecha_vencimiento: calcularFechaIso(0),
        estado: true,
      })
      .select('id_lote')
      .single()
    if (errHoy) throw errHoy
    idLoteHoy = loteHoy.id_lote
    creados.lotes.push(idLoteHoy)

    // 4. Crear lote que VENCE PRONTO (en 2 días, dentro del umbral de 3, activo, con stock)
    const { data: lotePronto, error: errPronto } = await supabase
      .from('lote')
      .insert({
        id_producto: idProductoTest,
        numero_lote: `${MARCA}-PRONTO-${corrida}`,
        cantidad: 15,
        fecha_produccion: calcularFechaIso(-3),
        fecha_vencimiento: calcularFechaIso(2),
        estado: true,
      })
      .select('id_lote')
      .single()
    if (errPronto) throw errPronto
    idLotePronto = lotePronto.id_lote
    creados.lotes.push(idLotePronto)

    // 5. Crear lote que VENCE LEJOS (en 45 días, fuera del umbral estándar de 3 días)
    const { data: loteLejos, error: errLejos } = await supabase
      .from('lote')
      .insert({
        id_producto: idProductoTest,
        numero_lote: `${MARCA}-LEJOS-${corrida}`,
        cantidad: 20,
        fecha_produccion: calcularFechaIso(0),
        fecha_vencimiento: calcularFechaIso(45),
        estado: true,
      })
      .select('id_lote')
      .single()
    if (errLejos) throw errLejos
    idLoteLejos = loteLejos.id_lote
    creados.lotes.push(idLoteLejos)

    // 6. Crear lote INACTIVO (vencido pero dado de baja: estado = false)
    const { data: loteInactivo, error: errInactivo } = await supabase
      .from('lote')
      .insert({
        id_producto: idProductoTest,
        numero_lote: `${MARCA}-INACTIVO-${corrida}`,
        cantidad: 10,
        fecha_produccion: calcularFechaIso(-10),
        fecha_vencimiento: calcularFechaIso(-1),
        estado: false,
      })
      .select('id_lote')
      .single()
    if (errInactivo) throw errInactivo
    idLoteInactivo = loteInactivo.id_lote
    creados.lotes.push(idLoteInactivo)

    // 7. Crear lote con CANTIDAD CERO (agotado, cantidad = 0)
    const { data: loteCero, error: errCero } = await supabase
      .from('lote')
      .insert({
        id_producto: idProductoTest,
        numero_lote: `${MARCA}-CERO-${corrida}`,
        cantidad: 0,
        fecha_produccion: calcularFechaIso(-10),
        fecha_vencimiento: calcularFechaIso(-1),
        estado: true,
      })
      .select('id_lote')
      .single()
    if (errCero) throw errCero
    idLoteSinStock = loteCero.id_lote
    creados.lotes.push(idLoteSinStock)
  })

  afterAll(async () => {
    const errores: string[] = []

    // 1. Limpieza de lotes creados para pruebas
    if (creados.lotes.length) {
      const { error } = await supabase.from('lote').delete().in('id_lote', creados.lotes)
      if (error) errores.push(`lote: ${error.message}`)
    }

    // 2. Limpieza de productos creados para pruebas
    if (creados.productos.length) {
      const { error } = await supabase.from('producto').delete().in('id_producto', creados.productos)
      if (error) errores.push(`producto: ${error.message}`)
    }

    if (errores.length) {
      throw new Error(`Limpieza incompleta en Supabase [QA]: ${errores.join('; ')}`)
    }
  })

  // =========================================================================
  // CASOS DE PRUEBA DE INTEGRACIÓN
  // =========================================================================

  it('IAL-01 · Responde 200 con formato { success, data, resumen } en consulta estándar', async () => {
    const { status, json } = await getApi()

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.resumen).toBeDefined()
    expect(typeof json.resumen.total).toBe('number')
    expect(typeof json.resumen.total_vencidos).toBe('number')
    expect(typeof json.resumen.total_por_vencer).toBe('number')
    expect(typeof json.resumen.dias_umbral_alerta).toBe('number')
  })

  it('IAL-02 · Detecta los lotes creados en estado vencido, vence hoy y vence pronto', async () => {
    const { status, json } = await getApi()
    expect(status).toBe(200)

    const idsRetornados = json.data.map((a: any) => a.id_lote)

    // Lotes que deben calificar dentro del umbral (<= 3 días o negativos)
    expect(idsRetornados).toContain(idLoteVencido)
    expect(idsRetornados).toContain(idLoteHoy)
    expect(idsRetornados).toContain(idLotePronto)
  })

  it('IAL-03 · Excluye por defecto lotes cuya fecha supera el umbral configurado (ej. 45 días)', async () => {
    const { status, json } = await getApi()
    expect(status).toBe(200)

    const idsRetornados = json.data.map((a: any) => a.id_lote)
    expect(idsRetornados).not.toContain(idLoteLejos)
  })

  it('IAL-04 · Excluye estrictamente lotes inactivos (estado = false) o agotados (cantidad = 0)', async () => {
    const { status, json } = await getApi()
    expect(status).toBe(200)

    const idsRetornados = json.data.map((a: any) => a.id_lote)
    expect(idsRetornados).not.toContain(idLoteInactivo)
    expect(idsRetornados).not.toContain(idLoteSinStock)
  })

  it('IAL-05 · Calcula correctamente la clasificación y mensaje para lote VENCIDO', async () => {
    const { status, json } = await getApi()
    expect(status).toBe(200)

    const alerta = json.data.find((a: any) => a.id_lote === idLoteVencido)
    expect(alerta).toBeDefined()
    expect(alerta.estado_vencimiento).toBe('VENCIDO')
    expect(alerta.nivel_urgencia).toBe('CRITICO')
    expect(alerta.dias_restantes).toBeLessThan(0)
    expect(alerta.mensaje).toMatch(/Venció hace \d+ día/)
    expect(alerta.id_producto).toBe(idProductoTest)
    expect(alerta.nombre_producto).toContain('Pan Integral Alertas')
  })

  it('IAL-06 · Calcula correctamente la clasificación y mensaje para lote que VENCE HOY', async () => {
    const { status, json } = await getApi()
    expect(status).toBe(200)

    const alerta = json.data.find((a: any) => a.id_lote === idLoteHoy)
    expect(alerta).toBeDefined()
    expect(alerta.estado_vencimiento).toBe('POR_VENCER')
    expect(alerta.nivel_urgencia).toBe('CRITICO')
    expect(alerta.dias_restantes).toBe(0)
    expect(alerta.mensaje).toBe('Vence hoy')
  })

  it('IAL-07 · Calcula correctamente la clasificación para lote que VENCE EN 2 DÍAS', async () => {
    const { status, json } = await getApi()
    expect(status).toBe(200)

    const alerta = json.data.find((a: any) => a.id_lote === idLotePronto)
    expect(alerta).toBeDefined()
    expect(alerta.estado_vencimiento).toBe('POR_VENCER')
    expect(alerta.nivel_urgencia).toBe('ALTO')
    expect(alerta.dias_restantes).toBe(2)
    expect(alerta.mensaje).toBe('Vence en 2 días')
  })

  it('IAL-08 · Amplía el umbral con el parámetro dias_anticipacion=60 e incluye el lote lejano', async () => {
    const { status, json } = await getApi('dias_anticipacion=60')
    expect(status).toBe(200)

    const idsRetornados = json.data.map((a: any) => a.id_lote)
    expect(idsRetornados).toContain(idLoteLejos)
    expect(json.resumen.dias_umbral_alerta).toBe(60)

    const alertaLejos = json.data.find((a: any) => a.id_lote === idLoteLejos)
    expect(alertaLejos.estado_vencimiento).toBe('POR_VENCER')
    expect(alertaLejos.nivel_urgencia).toBe('MEDIO')
    expect(alertaLejos.dias_restantes).toBeGreaterThan(3)
  })

  it('IAL-09 · Filtra solo lotes vencidos al consultar con solo_vencidos=true', async () => {
    const { status, json } = await getApi('solo_vencidos=true')
    expect(status).toBe(200)

    expect(json.data.length).toBeGreaterThanOrEqual(1)
    expect(json.data.every((a: any) => a.estado_vencimiento === 'VENCIDO')).toBe(true)

    const idsRetornados = json.data.map((a: any) => a.id_lote)
    expect(idsRetornados).toContain(idLoteVencido)
    expect(idsRetornados).not.toContain(idLoteHoy)
    expect(idsRetornados).not.toContain(idLotePronto)
  })

  it('IAL-10 · Filtra solo lotes por vencer al consultar con solo_por_vencer=true', async () => {
    const { status, json } = await getApi('solo_por_vencer=true')
    expect(status).toBe(200)

    expect(json.data.length).toBeGreaterThanOrEqual(1)
    expect(json.data.every((a: any) => a.estado_vencimiento === 'POR_VENCER')).toBe(true)

    const idsRetornados = json.data.map((a: any) => a.id_lote)
    expect(idsRetornados).not.toContain(idLoteVencido)
    expect(idsRetornados).toContain(idLoteHoy)
    expect(idsRetornados).toContain(idLotePronto)
  })

  it('IAL-11 · Rechaza con 400 Bad Request ante parámetros de consulta inválidos', async () => {
    const resNegativo = await getApi('dias_anticipacion=-10')
    expect(resNegativo.status).toBe(400)
    expect(resNegativo.json.statusMessage).toBe('Parámetros de consulta inválidos.')

    const resCero = await getApi('dias_anticipacion=0')
    expect(resCero.status).toBe(400)
    expect(resCero.json.statusMessage).toBe('Parámetros de consulta inválidos.')

    const resExceso = await getApi('dias_anticipacion=999')
    expect(resExceso.status).toBe(400)
    expect(resExceso.json.statusMessage).toBe('Parámetros de consulta inválidos.')
  })

  it('IAL-12 · El resumen estadístico es congruente con la suma de las alertas encontradas', async () => {
    const { status, json } = await getApi()
    expect(status).toBe(200)

    const { resumen } = json
    expect(resumen.total).toBe(resumen.total_vencidos + resumen.total_por_vencer)
    expect(resumen.total).toBeGreaterThanOrEqual(3)
  })
})
