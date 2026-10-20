/**
 * Pruebas de integración · Sprint 4 (RF-08)
 * Reporte de Movimientos de Inventario (Alessandro)
 * Responsable de QA: Manuel
 *
 * Flujo probado:
 * API (GET /api/movimientos) → DTO (ConsultaMovimientosSchema) → Service → Repository → Supabase (movimiento_inventario + producto + usuario)
 *
 * Reglas de seguridad sobre la base compartida:
 *  - Todos los datos creados llevan la marca [QA-TEST].
 *  - afterAll elimina estrictamente los registros creados en orden de dependencias:
 *    movimiento_inventario → producto.
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
  movimientos: [] as number[],
  productos: [] as number[],
}

const hoyStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Tegucigalpa' }).format(new Date())

const getMovimientos = async (query = '') => {
  const url = query ? `/api/movimientos?${query}` : '/api/movimientos'
  const respuesta = await fetch(url, {
    method: 'GET',
    headers: { 'content-type': 'application/json' },
  })
  return { status: respuesta.status, json: await respuesta.json() }
}

describe.skipIf(!hayCredenciales)('Integración · RF-08 Reporte de Movimientos de Inventario', async () => {
  if (!hayCredenciales) return

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  let idUsuario: number
  let idProductoA: number
  let idProductoB: number
  let idMovimientoEntradaA: number
  let idMovimientoSalidaA: number
  let idMovimientoEntradaB: number

  await setup({ server: true })

  beforeAll(async () => {
    // 1. Obtener usuario activo existente para asociar los movimientos (solo lectura)
    const { data: usuario, error: errUsuario } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('estado', true)
      .limit(1)
      .single()
    if (errUsuario || !usuario) throw new Error('No hay usuario activo en la base de datos.')
    idUsuario = usuario.id_usuario

    // 2. Crear Productos auxiliares A y B
    const { data: prodA, error: errProdA } = await supabase
      .from('producto')
      .insert({
        nombre: `${MARCA} Pan Canilla ${corrida}`,
        categoria: 'Panaderia',
        unidad_medida: 'unidad',
        stock_actual: 25,
        stock_minimo: 5,
        estado: true,
      })
      .select('id_producto')
      .single()
    if (errProdA) throw errProdA
    idProductoA = prodA.id_producto
    creados.productos.push(idProductoA)

    const { data: prodB, error: errProdB } = await supabase
      .from('producto')
      .insert({
        nombre: `${MARCA} Torta Selva ${corrida}`,
        categoria: 'Reposteria',
        unidad_medida: 'unidad',
        stock_actual: 10,
        stock_minimo: 2,
        estado: true,
      })
      .select('id_producto')
      .single()
    if (errProdB) throw errProdB
    idProductoB = prodB.id_producto
    creados.productos.push(idProductoB)

    // 3. Crear 3 movimientos de prueba
    // Movimiento 1: Prod A, Entrada de producción (+30)
    const { data: mov1, error: errMov1 } = await supabase
      .from('movimiento_inventario')
      .insert({
        id_producto: idProductoA,
        id_usuario: idUsuario,
        tipo_movimiento: 'PRODUCCION',
        cantidad: 30,
        stock_anterior: 0,
        stock_nuevo: 30,
        observaciones: `${MARCA} Entrada produccion lote 1`,
      })
      .select('id_movimiento')
      .single()
    if (errMov1) throw errMov1
    idMovimientoEntradaA = mov1.id_movimiento
    creados.movimientos.push(idMovimientoEntradaA)

    // Movimiento 2: Prod A, Salida por pérdida (-5)
    const { data: mov2, error: errMov2 } = await supabase
      .from('movimiento_inventario')
      .insert({
        id_producto: idProductoA,
        id_usuario: idUsuario,
        tipo_movimiento: 'PERDIDA',
        cantidad: 5,
        stock_anterior: 30,
        stock_nuevo: 25,
        observaciones: `${MARCA} Merma por horneado`,
      })
      .select('id_movimiento')
      .single()
    if (errMov2) throw errMov2
    idMovimientoSalidaA = mov2.id_movimiento
    creados.movimientos.push(idMovimientoSalidaA)

    // Movimiento 3: Prod B, Entrada de producción (+10)
    const { data: mov3, error: errMov3 } = await supabase
      .from('movimiento_inventario')
      .insert({
        id_producto: idProductoB,
        id_usuario: idUsuario,
        tipo_movimiento: 'PRODUCCION',
        cantidad: 10,
        stock_anterior: 0,
        stock_nuevo: 10,
        observaciones: `${MARCA} Entrada pasteleria`,
      })
      .select('id_movimiento')
      .single()
    if (errMov3) throw errMov3
    idMovimientoEntradaB = mov3.id_movimiento
    creados.movimientos.push(idMovimientoEntradaB)
  })

  afterAll(async () => {
    const errores: string[] = []

    // 1. Limpieza de movimientos de inventario creados
    if (creados.movimientos.length) {
      const { error } = await supabase
        .from('movimiento_inventario')
        .delete()
        .in('id_movimiento', creados.movimientos)
      if (error) errores.push(`movimiento_inventario: ${error.message}`)
    }

    // 2. Limpieza de productos auxiliares
    if (creados.productos.length) {
      const { error } = await supabase
        .from('producto')
        .delete()
        .in('id_producto', creados.productos)
      if (error) errores.push(`producto: ${error.message}`)
    }

    if (errores.length) {
      throw new Error(`Limpieza incompleta en Supabase [QA]: ${errores.join('; ')}`)
    }
  })

  // =========================================================================
  // CASOS DE PRUEBA DE INTEGRACIÓN (RF-08)
  // =========================================================================

  it('IMO-01 · Responde 200 con estructura { success, total, data, resumen, tipos_disponibles }', async () => {
    const { status, json } = await getMovimientos()

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.resumen).toBeDefined()
    expect(Array.isArray(json.tipos_disponibles)).toBe(true)
    expect(typeof json.total).toBe('number')
  })

  it('IMO-02 · Filtra movimientos por id_producto específico', async () => {
    const { status, json } = await getMovimientos(`id_producto=${idProductoA}`)

    expect(status).toBe(200)
    const ids = json.data.map((m: any) => m.id_movimiento)
    expect(ids).toContain(idMovimientoEntradaA)
    expect(ids).toContain(idMovimientoSalidaA)
    expect(ids).not.toContain(idMovimientoEntradaB)
  })

  it('IMO-03 · Filtra movimientos por tipo específico (ej. PERDIDA)', async () => {
    const { status, json } = await getMovimientos('tipo=PERDIDA')

    expect(status).toBe(200)
    const ids = json.data.map((m: any) => m.id_movimiento)
    expect(ids).toContain(idMovimientoSalidaA)
    expect(ids).not.toContain(idMovimientoEntradaA)
    expect(ids).not.toContain(idMovimientoEntradaB)
    expect(json.data.every((m: any) => m.tipo_movimiento === 'PERDIDA')).toBe(true)
  })

  it('IMO-04 · Filtra movimientos dentro de un rango de fechas válido', async () => {
    const { status, json } = await getMovimientos(`desde=${hoyStr}&hasta=${hoyStr}`)

    expect(status).toBe(200)
    const ids = json.data.map((m: any) => m.id_movimiento)
    expect(ids).toContain(idMovimientoEntradaA)
    expect(ids).toContain(idMovimientoSalidaA)
    expect(ids).toContain(idMovimientoEntradaB)
  })

  it('IMO-05 · Rechaza con 400 Bad Request si fecha desde es posterior a fecha hasta', async () => {
    const { status, json } = await getMovimientos('desde=2026-10-25&hasta=2026-10-10')

    expect(status).toBe(400)
    expect(json.statusMessage).toBe('La fecha "desde" no puede ser posterior a la fecha "hasta"')
  })

  it('IMO-06 · Rechaza con 400 Bad Request si límite es inválido (0 o > 1000)', async () => {
    const resCero = await getMovimientos('limite=0')
    expect(resCero.status).toBe(400)

    const resMil = await getMovimientos('limite=1500')
    expect(resMil.status).toBe(400)
  })

  it('IMO-07 · Calcula correctamente la dirección ENTRADA y SALIDA con su variación', async () => {
    const { status, json } = await getMovimientos(`id_producto=${idProductoA}`)

    expect(status).toBe(200)
    const movEntrada = json.data.find((m: any) => m.id_movimiento === idMovimientoEntradaA)
    expect(movEntrada).toBeDefined()
    expect(movEntrada.direccion).toBe('ENTRADA')
    expect(movEntrada.variacion).toBe(30)
    expect(movEntrada.stock_anterior).toBe(0)
    expect(movEntrada.stock_nuevo).toBe(30)

    const movSalida = json.data.find((m: any) => m.id_movimiento === idMovimientoSalidaA)
    expect(movSalida).toBeDefined()
    expect(movSalida.direccion).toBe('SALIDA')
    expect(movSalida.variacion).toBe(-5)
    expect(movSalida.stock_anterior).toBe(30)
    expect(movSalida.stock_nuevo).toBe(25)
  })

  it('IMO-08 · Resumen general concuerda con los totales calculados', async () => {
    const { status, json } = await getMovimientos(`id_producto=${idProductoA}`)

    expect(status).toBe(200)
    const { resumen } = json
    expect(resumen.total_movimientos).toBe(2)
    expect(resumen.total_entradas).toBe(1)
    expect(resumen.total_salidas).toBe(1)
    expect(resumen.productos_afectados).toBe(1)
  })

  it('IMO-09 · Resumen por producto calcula entradas, salidas y neto acumulado', async () => {
    const { status, json } = await getMovimientos(`id_producto=${idProductoA}`)

    expect(status).toBe(200)
    const porProducto = json.resumen.por_producto.find((p: any) => p.id_producto === idProductoA)
    expect(porProducto).toBeDefined()
    expect(porProducto.entradas).toBe(30)
    expect(porProducto.salidas).toBe(5)
    expect(porProducto.neto).toBe(25)
  })

  it('IMO-10 · Resumen por tipo agrupa las ocurrencias ordenadas de mayor a menor', async () => {
    const { status, json } = await getMovimientos()

    expect(status).toBe(200)
    expect(Array.isArray(json.resumen.por_tipo)).toBe(true)
    const tipos = json.resumen.por_tipo.map((t: any) => t.tipo_movimiento)
    expect(tipos).toContain('PRODUCCION')
  })

  it('IMO-11 · Devuelve lista completa de tipos_disponibles únicos', async () => {
    const { status, json } = await getMovimientos()

    expect(status).toBe(200)
    expect(json.tipos_disponibles).toContain('PRODUCCION')
    expect(json.tipos_disponibles).toContain('PERDIDA')
  })

  it('IMO-12 · Concatena correctamente el nombre del usuario responsable', async () => {
    const { status, json } = await getMovimientos(`id_producto=${idProductoA}`)

    expect(status).toBe(200)
    const mov = json.data.find((m: any) => m.id_movimiento === idMovimientoEntradaA)
    expect(mov).toBeDefined()
    expect(typeof mov.usuario).toBe('string')
    expect(mov.usuario.length).toBeGreaterThan(0)
  })
})
