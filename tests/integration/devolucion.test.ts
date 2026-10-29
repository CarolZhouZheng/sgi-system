/**
 * Pruebas de integración · Sprint 4 (RF-11)
 * Gestión de Devoluciones (Armando)
 * Responsable de QA: Manuel
 *
 * Flujo probado:
 * API (/api/devoluciones) → DTO (Zod) → Service → Repository → Supabase (devolucion + producto + movimiento_inventario + auditoria)
 *
 * Reglas de seguridad sobre la base compartida:
 *  - Todos los datos creados llevan la marca [QA-TEST].
 *  - afterAll elimina estrictamente los registros creados en orden de dependencias foráneas:
 *    movimiento_inventario → auditoria → devolucion → detalle_pedido → pedido → destinatario → producto.
 *  - 0 registros residuales garantizados tras la ejecución.
 */
import { existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

if (existsSync('.env')) process.loadEnvFile('.env')

const MARCA = '[QA-TEST]'
const corrida = Date.now()
const hayCredenciales = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)

let idUsuarioSesion = 0
const sesionPorDefecto = () => (idUsuarioSesion ? { id_usuario: idUsuarioSesion } : null)

const creados = {
  devoluciones: [] as number[],
  movimientos: [] as number[],
  pedidos: [] as number[],
  destinatarios: [] as number[],
  productos: [] as number[],
}

const cookieSesion = (sesion: { id_usuario: number } | null): Record<string, string> =>
  sesion ? { cookie: `usuario_session=${encodeURIComponent(JSON.stringify(sesion))}` } : {}

const get = async (ruta: string, sesion?: { id_usuario: number } | null) => {
  const respuesta = await fetch(ruta, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      ...cookieSesion(sesion === undefined ? sesionPorDefecto() : sesion),
    },
  })
  return { status: respuesta.status, json: await respuesta.json() }
}

const post = async (
  ruta: string,
  body: unknown,
  sesion?: { id_usuario: number } | null,
  cookieCruda?: string
) => {
  const respuesta = await fetch(ruta, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookieCruda
        ? { cookie: cookieCruda }
        : cookieSesion(sesion === undefined ? sesionPorDefecto() : sesion)),
    },
    body: JSON.stringify(body),
  })
  return { status: respuesta.status, json: await respuesta.json() }
}

const patch = async (
  ruta: string,
  body: unknown,
  sesion?: { id_usuario: number } | null,
  cookieCruda?: string
) => {
  const respuesta = await fetch(ruta, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      ...(cookieCruda
        ? { cookie: cookieCruda }
        : cookieSesion(sesion === undefined ? sesionPorDefecto() : sesion)),
    },
    body: JSON.stringify(body),
  })
  return { status: respuesta.status, json: await respuesta.json() }
}

describe.skipIf(!hayCredenciales)('Integración · RF-11 Gestión de Devoluciones (Armando)', async () => {
  if (!hayCredenciales) return

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  let idUsuario: number
  let idDestinatario: number
  let idProductoPrincipal: number
  let idProductoAjeno: number
  let idPedido: number

  await setup({ server: true })

  beforeAll(async () => {
    // 1. Obtener usuario activo
    const { data: usuario, error: errUsuario } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('estado', true)
      .limit(1)
      .single()
    if (errUsuario || !usuario) throw new Error('No hay usuario activo en la base de datos.')
    idUsuario = usuario.id_usuario
    idUsuarioSesion = idUsuario

    // 2. Crear destinatario de prueba
    const { data: dest, error: errDest } = await supabase
      .from('destinatario')
      .insert({
        nombre_empresa: `${MARCA} Panadería Central ${corrida}`,
        telefono: '7777-8888',
        estado: true,
      })
      .select('id_destinatario')
      .single()
    if (errDest) throw errDest
    idDestinatario = dest.id_destinatario
    creados.destinatarios.push(idDestinatario)

    // 3. Crear Producto Principal y Producto Ajeno
    const { data: prodP, error: errProdP } = await supabase
      .from('producto')
      .insert({
        nombre: `${MARCA} Pan Baguette ${corrida}`,
        categoria: 'Panadería',
        unidad_medida: 'unidad',
        stock_actual: 50,
        stock_minimo: 10,
        estado: true,
      })
      .select('id_producto')
      .single()
    if (errProdP) throw errProdP
    idProductoPrincipal = prodP.id_producto
    creados.productos.push(idProductoPrincipal)

    const { data: prodA, error: errProdA } = await supabase
      .from('producto')
      .insert({
        nombre: `${MARCA} Croissant Mantequilla ${corrida}`,
        categoria: 'Pastelería',
        unidad_medida: 'unidad',
        stock_actual: 30,
        stock_minimo: 5,
        estado: true,
      })
      .select('id_producto')
      .single()
    if (errProdA) throw errProdA
    idProductoAjeno = prodA.id_producto
    creados.productos.push(idProductoAjeno)

    // 4. Crear Pedido con detalle para Producto Principal (cantidad: 20, entregada: 20)
    const { data: ped, error: errPed } = await supabase
      .from('pedido')
      .insert({
        id_destinatario: idDestinatario,
        id_usuario: idUsuario,
        estado: 'COMPLETADO',
        prioridad: 'NORMAL',
        observaciones: `${MARCA} Pedido para prueba devolucion`,
      })
      .select('id_pedido')
      .single()
    if (errPed) throw errPed
    idPedido = ped.id_pedido
    creados.pedidos.push(idPedido)

    const { error: errDetalle } = await supabase.from('detalle_pedido').insert({
      id_pedido: idPedido,
      id_producto: idProductoPrincipal,
      cantidad: 20,
      cantidad_entregada: 20,
    })
    if (errDetalle) throw errDetalle
  })

  afterAll(async () => {
    const errores: string[] = []

    // 1. Limpieza de movimientos de inventario asociados a devoluciones creadas o productos creados
    if (creados.devoluciones.length) {
      const { error: errMovDev } = await supabase
        .from('movimiento_inventario')
        .delete()
        .in('id_devolucion', creados.devoluciones)
      if (errMovDev) errores.push(`movimiento_inventario (devolucion): ${errMovDev.message}`)
    }

    if (creados.productos.length) {
      const { error: errMovProd } = await supabase
        .from('movimiento_inventario')
        .delete()
        .in('id_producto', creados.productos)
      if (errMovProd) errores.push(`movimiento_inventario (producto): ${errMovProd.message}`)
    }

    // 2. Limpieza de auditoría
    if (creados.devoluciones.length) {
      const { error: errAud } = await supabase
        .from('auditoria')
        .delete()
        .eq('tabla_afectada', 'devolucion')
        .in('registro_id', creados.devoluciones)
      if (errAud) errores.push(`auditoria: ${errAud.message}`)
    }

    // 3. Limpieza de devoluciones
    if (creados.devoluciones.length) {
      const { error: errDev } = await supabase
        .from('devolucion')
        .delete()
        .in('id_devolucion', creados.devoluciones)
      if (errDev) errores.push(`devolucion: ${errDev.message}`)
    }

    // 4. Limpieza de detalle_pedido
    if (creados.pedidos.length) {
      const { error: errDet } = await supabase
        .from('detalle_pedido')
        .delete()
        .in('id_pedido', creados.pedidos)
      if (errDet) errores.push(`detalle_pedido: ${errDet.message}`)
    }

    // 5. Limpieza de pedidos
    if (creados.pedidos.length) {
      const { error: errPed } = await supabase
        .from('pedido')
        .delete()
        .in('id_pedido', creados.pedidos)
      if (errPed) errores.push(`pedido: ${errPed.message}`)
    }

    // 6. Limpieza de destinatarios
    if (creados.destinatarios.length) {
      const { error: errDest } = await supabase
        .from('destinatario')
        .delete()
        .in('id_destinatario', creados.destinatarios)
      if (errDest) errores.push(`destinatario: ${errDest.message}`)
    }

    // 7. Limpieza de productos
    if (creados.productos.length) {
      const { error: errProd } = await supabase
        .from('producto')
        .delete()
        .in('id_producto', creados.productos)
      if (errProd) errores.push(`producto: ${errProd.message}`)
    }

    if (errores.length) {
      throw new Error(`Limpieza incompleta en Supabase [QA]: ${errores.join('; ')}`)
    }
  })

  // =========================================================================
  // CASOS DE PRUEBA DE INTEGRACIÓN (RF-11)
  // =========================================================================

  it('IDEV-01 · Consulta pedidos elegibles para selección rápida', async () => {
    const { status, json } = await get('/api/devoluciones/pedidos-elegibles')
    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)

    const encontrado = json.data.find((p: any) => p.id_pedido === idPedido)
    expect(encontrado).toBeDefined()
    expect(encontrado.destinatario?.id_destinatario).toBe(idDestinatario)
    expect(encontrado.detalle_pedido?.length).toBeGreaterThan(0)
  })

  it('IDEV-02 · Rechaza registro sin sesión activa con HTTP 401', async () => {
    const { status, json } = await post(
      '/api/devoluciones',
      {
        id_pedido: idPedido,
        id_producto: idProductoPrincipal,
        cantidad_devuelta: 2,
        motivo: `${MARCA} Prueba sin sesion`,
      },
      null
    )

    expect(status).toBe(401)
    expect(json.statusMessage || json.message).toContain('No hay sesión activa')
  })

  it('IDEV-03 · Rechaza registro con cookie de sesión corrupta con HTTP 401', async () => {
    const { status, json } = await post(
      '/api/devoluciones',
      {
        id_pedido: idPedido,
        id_producto: idProductoPrincipal,
        cantidad_devuelta: 2,
        motivo: `${MARCA} Sesion corrupta`,
      },
      undefined,
      'usuario_session=json-invalido'
    )

    expect(status).toBe(401)
    expect(json.statusMessage || json.message).toContain('dañada')
  })

  it('IDEV-04 · Rechaza si el producto no pertenece al pedido indicado con HTTP 400', async () => {
    const { status, json } = await post('/api/devoluciones', {
      id_pedido: idPedido,
      id_producto: idProductoAjeno, // No está en el pedido
      cantidad_devuelta: 1,
      motivo: `${MARCA} Producto no perteneciente`,
    })

    expect(status).toBe(400)
    expect(json.statusMessage || json.message).toContain('no forma parte del pedido')
  })

  it('IDEV-05 · Rechaza si la cantidad devuelta supera la disponible del pedido con HTTP 400', async () => {
    const { status, json } = await post('/api/devoluciones', {
      id_pedido: idPedido,
      id_producto: idProductoPrincipal,
      cantidad_devuelta: 999, // Despachado fue 20
      motivo: `${MARCA} Cantidad excesiva`,
    })

    expect(status).toBe(400)
    expect(json.statusMessage || json.message).toContain('supera la cantidad disponible')
  })

  let idDevolucionCreada: number

  it('IDEV-06 · Registra exitosamente devolución PENDIENTE sin alterar stock ni crear movimiento', async () => {
    // Verificar stock inicial
    const { data: prodAntes } = await supabase
      .from('producto')
      .select('stock_actual')
      .eq('id_producto', idProductoPrincipal)
      .single()
    expect(prodAntes?.stock_actual).toBe(50)

    const { status, json } = await post('/api/devoluciones', {
      id_pedido: idPedido,
      id_producto: idProductoPrincipal,
      cantidad_devuelta: 5,
      motivo: `${MARCA} Pan con corteza rota`,
      observaciones: 'Pendiente de inspección de calidad',
    })

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.id_devolucion).toBeDefined()
    expect(json.data.estado).toBe('PENDIENTE')

    idDevolucionCreada = json.data.id_devolucion
    creados.devoluciones.push(idDevolucionCreada)

    // Verificar que stock permanece en 50
    const { data: prodDespues } = await supabase
      .from('producto')
      .select('stock_actual')
      .eq('id_producto', idProductoPrincipal)
      .single()
    expect(prodDespues?.stock_actual).toBe(50)

    // Verificar que NO existe movimiento_inventario
    const { data: movs } = await supabase
      .from('movimiento_inventario')
      .select('id_movimiento')
      .eq('id_devolucion', idDevolucionCreada)
    expect(movs?.length).toBe(0)
  })

  it('IDEV-07 · Lista devoluciones registradas aplicando filtros', async () => {
    const { status, json } = await get(`/api/devoluciones?id_pedido=${idPedido}&estado=PENDIENTE`)
    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.total).toBeGreaterThanOrEqual(1)

    const dev = json.data.find((d: any) => d.id_devolucion === idDevolucionCreada)
    expect(dev).toBeDefined()
    expect(dev.motivo).toContain('Pan con corteza rota')
  })

  it('IDEV-08 · Consulta detalle completo de devolución por ID con relaciones', async () => {
    const { status, json } = await get(`/api/devoluciones/${idDevolucionCreada}`)
    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.id_devolucion).toBe(idDevolucionCreada)
    expect(json.data.producto?.id_producto).toBe(idProductoPrincipal)
    expect(json.data.pedido?.id_pedido).toBe(idPedido)
    expect(json.data.pedido?.destinatario?.id_destinatario).toBe(idDestinatario)
    expect(json.data.usuario?.id_usuario).toBe(idUsuario)
  })

  it('IDEV-09 · Cambia estado a APROBADA: suma stock (+5) y registra movimiento_inventario', async () => {
    const { status, json } = await patch(`/api/devoluciones/${idDevolucionCreada}/estado`, {
      estado: 'APROBADA',
      observaciones: `${MARCA} Aprobada por control de calidad, reingresado`,
    })

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.estado).toBe('APROBADA')

    // Verificar incremento de stock de 50 a 55
    const { data: prodDespues } = await supabase
      .from('producto')
      .select('stock_actual')
      .eq('id_producto', idProductoPrincipal)
      .single()
    expect(prodDespues?.stock_actual).toBe(55)

    // Verificar creación de movimiento_inventario de tipo DEVOLUCION
    const { data: movs } = await supabase
      .from('movimiento_inventario')
      .select('*')
      .eq('id_devolucion', idDevolucionCreada)
    expect(movs?.length).toBe(1)
    expect(movs![0].tipo_movimiento).toBe('DEVOLUCION')
    expect(Number(movs![0].cantidad)).toBe(5)
    expect(Number(movs![0].stock_anterior)).toBe(50)
    expect(Number(movs![0].stock_nuevo)).toBe(55)
  })

  it('IDEV-10 · Impide modificar una devolución que ya fue APROBADA con HTTP 400', async () => {
    const { status, json } = await patch(`/api/devoluciones/${idDevolucionCreada}/estado`, {
      estado: 'RECHAZADA',
    })

    expect(status).toBe(400)
    expect(json.statusMessage || json.message).toContain(
      'No se puede modificar una devolución que ya fue APROBADA'
    )
  })

  it('IDEV-11 · Registra devolución directa como APROBADA sumando stock y creando movimiento de inmediato', async () => {
    const { status, json } = await post('/api/devoluciones', {
      id_pedido: idPedido,
      id_producto: idProductoPrincipal,
      cantidad_devuelta: 3,
      motivo: `${MARCA} Sobrante entregado intacto`,
      estado: 'APROBADA',
    })

    expect(status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.estado).toBe('APROBADA')

    const idDirecta = json.data.id_devolucion
    creados.devoluciones.push(idDirecta)

    // Stock sube de 55 a 58
    const { data: prod } = await supabase
      .from('producto')
      .select('stock_actual')
      .eq('id_producto', idProductoPrincipal)
      .single()
    expect(prod?.stock_actual).toBe(58)

    // Movimiento registrado
    const { data: movs } = await supabase
      .from('movimiento_inventario')
      .select('*')
      .eq('id_devolucion', idDirecta)
    expect(movs?.length).toBe(1)
    expect(movs![0].tipo_movimiento).toBe('DEVOLUCION')
    expect(Number(movs![0].cantidad)).toBe(3)
  })

  it('IDEV-12 · Transición de PENDIENTE a RECHAZADA: actualiza estado sin alterar stock', async () => {
    const { json: devCreada } = await post('/api/devoluciones', {
      id_pedido: idPedido,
      id_producto: idProductoPrincipal,
      cantidad_devuelta: 2,
      motivo: `${MARCA} Producto dañado por mal manejo externo`,
      estado: 'PENDIENTE',
    })
    const idRechazada = devCreada.data.id_devolucion
    creados.devoluciones.push(idRechazada)

    const { status, json } = await patch(`/api/devoluciones/${idRechazada}/estado`, {
      estado: 'RECHAZADA',
      observaciones: 'Rechazado por estar fuera de política',
    })

    expect(status).toBe(200)
    expect(json.data.estado).toBe('RECHAZADA')

    // Stock se mantiene en 58
    const { data: prod } = await supabase
      .from('producto')
      .select('stock_actual')
      .eq('id_producto', idProductoPrincipal)
      .single()
    expect(prod?.stock_actual).toBe(58)

    // Sin movimiento creado
    const { data: movs } = await supabase
      .from('movimiento_inventario')
      .select('id_movimiento')
      .eq('id_devolucion', idRechazada)
    expect(movs?.length).toBe(0)
  })

  it('IDEV-13 · Valida coherencia de fechas en filtros y rechaza cuando desde > hasta con HTTP 400', async () => {
    const { status, json } = await get('/api/devoluciones?desde=2026-10-28&hasta=2026-10-01')
    expect(status).toBe(400)
    expect(json.statusMessage || json.message).toContain('La fecha \'desde\' no puede ser posterior')
  })
})

