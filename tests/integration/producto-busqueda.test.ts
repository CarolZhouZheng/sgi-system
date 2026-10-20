/**
 * Pruebas de integración · Sprint 4 (RF-07)
 * Búsqueda Avanzada y Filtros de Productos (Carolina)
 * Responsable de QA: Manuel
 *
 * Flujo probado:
 * API (GET /api/productos) → DTO (FiltroProductosSchema) → Service → Repository → Supabase (PostgreSQL)
 *
 * Reglas de seguridad sobre la base compartida:
 *  - Todos los datos creados llevan la marca [QA-TEST].
 *  - afterAll elimina estrictamente los registros creados en orden de dependencias.
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
  productos: [] as number[],
}

const getProductos = async (query = '') => {
  const url = query ? `/api/productos?${query}` : '/api/productos'
  const respuesta = await fetch(url, {
    method: 'GET',
    headers: { 'content-type': 'application/json' },
  })
  return { status: respuesta.status, json: await respuesta.json() }
}

describe.skipIf(!hayCredenciales)('Integración · RF-07 Búsqueda Avanzada de Productos', async () => {
  if (!hayCredenciales) return

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  let idPan: number
  let idPastel: number
  let idGalleta: number
  let idInactivo: number

  await setup({ server: true })

  beforeAll(async () => {
    // 1. Producto A: Pan (Disponible, Stock Normal, Activo, Panadería)
    const { data: pPan, error: errPan } = await supabase
      .from('producto')
      .insert({
        nombre: `${MARCA} Pan Frances Crujiente ${corrida}`,
        descripcion: 'Elaborado con masa madre tradicional',
        categoria: 'Panaderia',
        unidad_medida: 'unidad',
        stock_actual: 50,
        stock_minimo: 10,
        estado: true,
      })
      .select('id_producto')
      .single()
    if (errPan) throw new Error(`Error creando producto A: ${errPan.message}`)
    idPan = pPan.id_producto
    creados.productos.push(idPan)

    // 2. Producto B: Pastel (Stock Bajo: 4 <= 10, Activo, Repostería)
    const { data: pPastel, error: errPastel } = await supabase
      .from('producto')
      .insert({
        nombre: `${MARCA} Pastel Milhojas ${corrida}`,
        descripcion: 'Relleno de arequipe artesanal y crema',
        categoria: 'Reposteria',
        unidad_medida: 'unidad',
        stock_actual: 4,
        stock_minimo: 10,
        estado: true,
      })
      .select('id_producto')
      .single()
    if (errPastel) throw new Error(`Error creando producto B: ${errPastel.message}`)
    idPastel = pPastel.id_producto
    creados.productos.push(idPastel)

    // 3. Producto C: Galleta (Agotado: stock 0 <= 0, Activo, Galletas)
    const { data: pGalleta, error: errGalleta } = await supabase
      .from('producto')
      .insert({
        nombre: `${MARCA} Galleta de Avena ${corrida}`,
        descripcion: 'Con pasas selectas y toque de canela',
        categoria: 'Galletas',
        unidad_medida: 'paquete',
        stock_actual: 0,
        stock_minimo: 5,
        estado: true,
      })
      .select('id_producto')
      .single()
    if (errGalleta) throw new Error(`Error creando producto C: ${errGalleta.message}`)
    idGalleta = pGalleta.id_producto
    creados.productos.push(idGalleta)

    // 4. Producto D: Donas (Inactivo: estado = false, Repostería)
    const { data: pInactivo, error: errInactivo } = await supabase
      .from('producto')
      .insert({
        nombre: `${MARCA} Donas Glaseadas Inactivas ${corrida}`,
        descripcion: 'Edición limitada fuera de temporada',
        categoria: 'Reposteria',
        unidad_medida: 'docena',
        stock_actual: 20,
        stock_minimo: 5,
        estado: false,
      })
      .select('id_producto')
      .single()
    if (errInactivo) throw new Error(`Error creando producto D: ${errInactivo.message}`)
    idInactivo = pInactivo.id_producto
    creados.productos.push(idInactivo)
  })

  afterAll(async () => {
    if (creados.productos.length) {
      const { error } = await supabase
        .from('producto')
        .delete()
        .in('id_producto', creados.productos)
      if (error) {
        throw new Error(`Limpieza incompleta en Supabase [QA]: ${error.message}`)
      }
    }
  })

  // =========================================================================
  // CASOS DE PRUEBA DE INTEGRACIÓN (RF-07)
  // =========================================================================

  it('IBA-01 · Búsqueda por texto en el nombre devuelve el producto coincidente', async () => {
    const { status, json } = await getProductos(`busqueda=Frances Crujiente ${corrida}`)

    expect(status).toBe(200)
    expect(json.success).toBe(true)

    const ids = json.data.map((p: any) => p.id_producto)
    expect(ids).toContain(idPan)
    expect(ids).not.toContain(idPastel)
    expect(ids).not.toContain(idGalleta)
  })

  it('IBA-02 · Búsqueda por texto en la descripción devuelve el producto correspondiente', async () => {
    const { status, json } = await getProductos('busqueda=arequipe artesanal')

    expect(status).toBe(200)
    const ids = json.data.map((p: any) => p.id_producto)
    expect(ids).toContain(idPastel)
    expect(ids).not.toContain(idPan)
  })

  it('IBA-03 · Búsqueda insensible a mayúsculas y minúsculas (ilike)', async () => {
    const { status, json } = await getProductos('busqueda=mIlHoJaS')

    expect(status).toBe(200)
    const ids = json.data.map((p: any) => p.id_producto)
    expect(ids).toContain(idPastel)
  })

  it('IBA-04 · Filtro por categoría exacta devuelve solo productos de esa categoría', async () => {
    const { status, json } = await getProductos('categoria=Reposteria')

    expect(status).toBe(200)
    const ids = json.data.map((p: any) => p.id_producto)
    expect(ids).toContain(idPastel)
    expect(ids).toContain(idInactivo)
    expect(ids).not.toContain(idPan)
    expect(ids).not.toContain(idGalleta)
  })

  it('IBA-05 · Filtro por estado activo (estado=true) excluye productos inactivos', async () => {
    const { status, json } = await getProductos('estado=true')

    expect(status).toBe(200)
    const ids = json.data.map((p: any) => p.id_producto)
    expect(ids).toContain(idPan)
    expect(ids).toContain(idPastel)
    expect(ids).toContain(idGalleta)
    expect(ids).not.toContain(idInactivo)
  })

  it('IBA-06 · Filtro por estado inactivo (estado=false) incluye el producto dado de baja', async () => {
    const { status, json } = await getProductos('estado=false')

    expect(status).toBe(200)
    const ids = json.data.map((p: any) => p.id_producto)
    expect(ids).toContain(idInactivo)
    expect(ids).not.toContain(idPan)
    expect(ids).not.toContain(idPastel)
  })

  it('IBA-07 · Filtro de stock disponible (stock=disponible) excluye productos agotados (stock 0)', async () => {
    const { status, json } = await getProductos('stock=disponible')

    expect(status).toBe(200)
    const ids = json.data.map((p: any) => p.id_producto)
    expect(ids).toContain(idPan)
    expect(ids).toContain(idPastel)
    expect(ids).not.toContain(idGalleta)
  })

  it('IBA-08 · Filtro de stock agotado (stock=agotado) devuelve productos con stock_actual <= 0', async () => {
    const { status, json } = await getProductos('stock=agotado')

    expect(status).toBe(200)
    const ids = json.data.map((p: any) => p.id_producto)
    expect(ids).toContain(idGalleta)
    expect(ids).not.toContain(idPan)
    expect(ids).not.toContain(idPastel)
  })

  it('IBA-09 · Filtro de stock bajo (stock=bajo) filtra productos donde stock_actual <= stock_minimo', async () => {
    const { status, json } = await getProductos('stock=bajo')

    expect(status).toBe(200)
    const ids = json.data.map((p: any) => p.id_producto)
    // Pastel: stock 4 <= stock_min 10 (califica como bajo)
    expect(ids).toContain(idPastel)
    // Galleta: stock 0 <= stock_min 5 (califica como bajo)
    expect(ids).toContain(idGalleta)
    // Pan: stock 50 > stock_min 10 (NO debe calificar como bajo)
    expect(ids).not.toContain(idPan)
  })

  it('IBA-10 · Búsqueda combinada multicriterio filtra con precisión cruzada', async () => {
    const query = `busqueda=Milhojas&categoria=Reposteria&estado=true&stock=bajo`
    const { status, json } = await getProductos(query)

    expect(status).toBe(200)
    const ids = json.data.map((p: any) => p.id_producto)
    expect(ids).toEqual([idPastel])
  })

  it('IBA-11 · Rechaza con HTTP 400 Bad Request si el parámetro stock es inválido', async () => {
    const { status, json } = await getProductos('stock=invalido')

    expect(status).toBe(400)
    expect(json.statusMessage).toBe('Parámetros de búsqueda inválidos')
    expect(json.data.errores).toBeDefined()
  })

  it('IBA-12 · El total reportado coincide con la longitud del arreglo data devuelto', async () => {
    const { status, json } = await getProductos()

    expect(status).toBe(200)
    expect(json.total).toBe(json.data.length)
  })
})
