/**
 * Pruebas de integración · Sprint 3 (RF-20)
 * Cola de producción en tiempo real (Jose Carlos)
 * Responsable de QA: Armando
 *
 * Levantan la app Nuxt completa y prueban endpoints reales contra Supabase:
 * API → DTO (Zod) → Service → Repository → Supabase
 *
 * Reglas de seguridad sobre la base compartida:
 *  - Todos los datos creados llevan la marca [QA-TEST].
 *  - afterAll elimina estrictamente los registros creados en orden.
 *  - Los registros existentes de la base solo se leen.
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
  producciones: [] as number[],
  pedidos: [] as number[],
  destinatarios: [] as number[],
  productos: [] as number[],
}

const cookieSesion = (sesion: { id_usuario: number } | null): Record<string, string> =>
  sesion ? { cookie: `usuario_session=${encodeURIComponent(JSON.stringify(sesion))}` } : {}

const post = async (ruta: string, body: unknown, sesion?: { id_usuario: number } | null, cookieCruda?: string) => {
  const respuesta = await fetch(ruta, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookieCruda ? { cookie: cookieCruda } : cookieSesion(sesion === undefined ? sesionPorDefecto() : sesion)),
    },
    body: JSON.stringify(body),
  })
  return { status: respuesta.status, json: await respuesta.json() }
}

const patch = async (ruta: string, body: unknown, sesion?: { id_usuario: number } | null) => {
  const respuesta = await fetch(ruta, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      ...cookieSesion(sesion === undefined ? sesionPorDefecto() : sesion),
    },
    body: JSON.stringify(body),
  })
  return { status: respuesta.status, json: await respuesta.json() }
}

const put = async (ruta: string, body: unknown, sesion?: { id_usuario: number } | null) => {
  const respuesta = await fetch(ruta, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      ...cookieSesion(sesion === undefined ? sesionPorDefecto() : sesion),
    },
    body: JSON.stringify(body),
  })
  return { status: respuesta.status, json: await respuesta.json() }
}

const get = async (ruta: string) => {
  const respuesta = await fetch(ruta)
  return { status: respuesta.status, json: await respuesta.json() }
}

describe.skipIf(!hayCredenciales)('Integración · RF-20 Cola de Producción', async () => {
  if (!hayCredenciales) return

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  let idUsuario: number
  let idProductoActivo: number
  let idProductoInactivo: number
  let idDestinatario: number
  let idPedidoUrgente: number
  let idPedidoBaja: number

  await setup({ server: true })

  beforeAll(async () => {
    // 1. Obtener usuario activo existente (solo lectura)
    const { data: usuario, error: errUsuario } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('estado', true)
      .limit(1)
      .single()
    if (errUsuario || !usuario) throw new Error('No hay usuario activo disponible.')
    idUsuario = usuario.id_usuario
    idUsuarioSesion = idUsuario

    // 2. Crear productos para pruebas
    const { data: prodA, error: errProdA } = await supabase
      .from('producto')
      .insert({ nombre: `${MARCA} Pan Francés ${corrida}`, unidad_medida: 'unidad', estado: true, stock_actual: 50 })
      .select('id_producto')
      .single()
    if (errProdA) throw errProdA
    idProductoActivo = prodA.id_producto
    creados.productos.push(idProductoActivo)

    const { data: prodInac, error: errProdInac } = await supabase
      .from('producto')
      .insert({ nombre: `${MARCA} Pan Descontinuado ${corrida}`, unidad_medida: 'unidad', estado: false, stock_actual: 0 })
      .select('id_producto')
      .single()
    if (errProdInac) throw errProdInac
    idProductoInactivo = prodInac.id_producto
    creados.productos.push(idProductoInactivo)

    // 3. Crear destinatario y pedidos con diferente prioridad para verificar ordenamiento
    const { data: dest, error: errDest } = await supabase
      .from('destinatario')
      .insert({ nombre_empresa: `${MARCA} Cafetería Central ${corrida}`, estado: true })
      .select('id_destinatario')
      .single()
    if (errDest) throw errDest
    idDestinatario = dest.id_destinatario
    creados.destinatarios.push(idDestinatario)

    const { data: pedUrgente, error: errPedUrg } = await supabase
      .from('pedido')
      .insert({
        id_destinatario: idDestinatario,
        id_usuario: idUsuario,
        prioridad: 'URGENTE',
        estado: 'PENDIENTE',
        encargado_entrega: MARCA,
      })
      .select('id_pedido')
      .single()
    if (errPedUrg) throw errPedUrg
    idPedidoUrgente = pedUrgente.id_pedido
    creados.pedidos.push(idPedidoUrgente)

    const { data: pedBaja, error: errPedBaja } = await supabase
      .from('pedido')
      .insert({
        id_destinatario: idDestinatario,
        id_usuario: idUsuario,
        prioridad: 'BAJA',
        estado: 'PENDIENTE',
        encargado_entrega: MARCA,
      })
      .select('id_pedido')
      .single()
    if (errPedBaja) throw errPedBaja
    idPedidoBaja = pedBaja.id_pedido
    creados.pedidos.push(idPedidoBaja)
  })

  afterAll(async () => {
    const errores: string[] = []
    const borrar = async (tabla: string, columna: string, ids: number[]) => {
      if (!ids.length) return
      const { error } = await supabase.from(tabla).delete().in(columna, ids)
      if (error) errores.push(`${tabla}: ${error.message}`)
    }

    // 1. Borrar auditorías creadas
    if (creados.producciones.length) {
      const { error } = await supabase
        .from('auditoria')
        .delete()
        .eq('tabla_afectada', 'produccion')
        .in('registro_id', creados.producciones)
      if (error) errores.push(`auditoria (produccion): ${error.message}`)
    }

    // 2. Borrar órdenes de producción
    await borrar('produccion', 'id_produccion', creados.producciones)

    // 3. Borrar pedidos auxiliares
    await borrar('detalle_pedido', 'id_pedido', creados.pedidos)
    await borrar('pedido', 'id_pedido', creados.pedidos)

    // 4. Borrar destinatarios y productos auxiliares
    await borrar('destinatario', 'id_destinatario', creados.destinatarios)
    await borrar('producto', 'id_producto', creados.productos)

    if (errores.length) {
      throw new Error(`Limpieza incompleta en base compartida: ${errores.join(' | ')}`)
    }
  })

  describe('RF-20 · Registro de órdenes en cola de producción (POST /api/produccion)', () => {
    it('IPR-01 registra una orden válida en cola con valores por defecto', async () => {
      const payload = {
        id_producto: idProductoActivo,
        id_usuario: idUsuario,
        cantidad_planificada: 30,
        observaciones: `${MARCA} orden 1`,
      }

      const { status, json } = await post('/api/produccion', payload)
      if (json.data?.id_produccion) creados.producciones.push(json.data.id_produccion)

      expect(status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data.id_producto).toBe(idProductoActivo)
      expect(json.data.cantidad_planificada).toBe(30)
      expect(json.data.cantidad_producida).toBe(0)
      expect(json.data.estado).toBe('PENDIENTE')
    })

    it('IPR-02 registra auditoría en Supabase al crear la orden', async () => {
      const payload = {
        id_producto: idProductoActivo,
        id_usuario: idUsuario,
        cantidad_planificada: 15,
        observaciones: `${MARCA} orden auditoria`,
      }

      const { status, json } = await post('/api/produccion', payload)
      if (json.data?.id_produccion) creados.producciones.push(json.data.id_produccion)

      expect(status).toBe(201)
      const idCreado = json.data.id_produccion

      const { data: audit, error } = await supabase
        .from('auditoria')
        .select('*')
        .eq('tabla_afectada', 'produccion')
        .eq('registro_id', idCreado)
        .eq('accion', 'REGISTRAR_ORDEN_PRODUCCION')
        .maybeSingle()

      expect(error).toBeNull()
      expect(audit).toBeDefined()
      expect(audit?.id_usuario).toBe(idUsuario)
    })

    it('IPR-03 vincula correctamente un pedido asociado a la orden', async () => {
      const payload = {
        id_producto: idProductoActivo,
        id_usuario: idUsuario,
        id_pedido: idPedidoUrgente,
        cantidad_planificada: 25,
        observaciones: `${MARCA} orden vinculada a pedido urgente`,
      }

      const { status, json } = await post('/api/produccion', payload)
      if (json.data?.id_produccion) creados.producciones.push(json.data.id_produccion)

      expect(status).toBe(201)
      expect(json.data.id_pedido).toBe(idPedidoUrgente)
    })

    it('IPR-04 rechaza registrar con producto inexistente (400)', async () => {
      const payload = {
        id_producto: 999_999_999,
        id_usuario: idUsuario,
        cantidad_planificada: 10,
      }

      const { status, json } = await post('/api/produccion', payload)
      if (json.data?.id_produccion) creados.producciones.push(json.data.id_produccion)

      expect(status).toBe(400)
      expect(json.statusMessage || json.message).toContain('El producto seleccionado no existe o se encuentra inactivo.')
    })

    it('IPR-05 rechaza registrar con producto inactivo (400)', async () => {
      const payload = {
        id_producto: idProductoInactivo,
        id_usuario: idUsuario,
        cantidad_planificada: 10,
      }

      const { status, json } = await post('/api/produccion', payload)
      if (json.data?.id_produccion) creados.producciones.push(json.data.id_produccion)

      expect(status).toBe(400)
      expect(json.statusMessage || json.message).toContain('El producto seleccionado no existe o se encuentra inactivo.')
    })

    it('IPR-06 rechaza si el pedido especificado no existe (400)', async () => {
      const payload = {
        id_producto: idProductoActivo,
        id_usuario: idUsuario,
        id_pedido: 999_999_999,
        cantidad_planificada: 10,
      }

      const { status, json } = await post('/api/produccion', payload)
      if (json.data?.id_produccion) creados.producciones.push(json.data.id_produccion)

      expect(status).toBe(400)
      expect(json.statusMessage || json.message).toContain('El pedido con ID #999999999 no existe.')
    })

    it('IPR-07 rechaza cantidad planificada cero o negativa (400)', async () => {
      const { status: statusCero, json: jsonCero } = await post('/api/produccion', {
        id_producto: idProductoActivo,
        id_usuario: idUsuario,
        cantidad_planificada: 0,
      })
      if (jsonCero.data?.id_produccion) creados.producciones.push(jsonCero.data.id_produccion)
      expect(statusCero).toBe(400)

      const { status: statusNeg, json: jsonNeg } = await post('/api/produccion', {
        id_producto: idProductoActivo,
        id_usuario: idUsuario,
        cantidad_planificada: -10,
      })
      if (jsonNeg.data?.id_produccion) creados.producciones.push(jsonNeg.data.id_produccion)
      expect(statusNeg).toBe(400)
    })
  })

  describe('RF-20 · Consulta y Ordenamiento inteligente de la cola (GET /api/produccion)', () => {
    let idOrdEnProceso: number
    let idOrdPendienteUrgente: number
    let idOrdPendienteBaja: number

    it('IPR-08 devuelve la lista con relaciones cargadas (producto, pedido, destinatario)', async () => {
      // 1. Crear una orden y pasarla a EN_PROCESO
      const res1 = await post('/api/produccion', {
        id_producto: idProductoActivo,
        id_usuario: idUsuario,
        id_pedido: idPedidoBaja,
        cantidad_planificada: 10,
        estado: 'EN_PROCESO',
        observaciones: `${MARCA} orden en proceso`,
      })
      idOrdEnProceso = res1.json.data.id_produccion
      creados.producciones.push(idOrdEnProceso)

      // 2. Crear una orden PENDIENTE con pedido URGENTE
      const res2 = await post('/api/produccion', {
        id_producto: idProductoActivo,
        id_usuario: idUsuario,
        id_pedido: idPedidoUrgente,
        cantidad_planificada: 10,
        estado: 'PENDIENTE',
        observaciones: `${MARCA} orden pendiente urgente`,
      })
      idOrdPendienteUrgente = res2.json.data.id_produccion
      creados.producciones.push(idOrdPendienteUrgente)

      // 3. Crear una orden PENDIENTE con pedido BAJA
      const res3 = await post('/api/produccion', {
        id_producto: idProductoActivo,
        id_usuario: idUsuario,
        id_pedido: idPedidoBaja,
        cantidad_planificada: 10,
        estado: 'PENDIENTE',
        observaciones: `${MARCA} orden pendiente baja`,
      })
      idOrdPendienteBaja = res3.json.data.id_produccion
      creados.producciones.push(idOrdPendienteBaja)

      const { status, json } = await get('/api/produccion')

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)

      const orden = json.data.find((o: any) => o.id_produccion === idOrdPendienteUrgente)
      expect(orden).toBeDefined()
      expect(orden.producto?.nombre).toContain(MARCA)
      expect(orden.pedido?.prioridad).toBe('URGENTE')
      expect(orden.pedido?.destinatario?.nombre_empresa).toContain(MARCA)
    })

    it('IPR-09 respeta el ordenamiento: EN_PROCESO antes que PENDIENTE, y mayor prioridad antes que menor', async () => {
      const { status, json } = await get('/api/produccion')
      expect(status).toBe(200)

      const idxEnProceso = json.data.findIndex((o: any) => o.id_produccion === idOrdEnProceso)
      const idxUrgente = json.data.findIndex((o: any) => o.id_produccion === idOrdPendienteUrgente)
      const idxBaja = json.data.findIndex((o: any) => o.id_produccion === idOrdPendienteBaja)

      expect(idxEnProceso).toBeGreaterThanOrEqual(0)
      expect(idxUrgente).toBeGreaterThanOrEqual(0)
      expect(idxBaja).toBeGreaterThanOrEqual(0)

      // EN_PROCESO debe aparecer antes que PENDIENTE
      expect(idxEnProceso).toBeLessThan(idxUrgente)
      expect(idxEnProceso).toBeLessThan(idxBaja)

      // En igualdad de estado PENDIENTE, el pedido URGENTE debe ir antes que el BAJA
      expect(idxUrgente).toBeLessThan(idxBaja)
    })

    it('IPR-10 filtra correctamente por estado via query param (?estado=EN_PROCESO)', async () => {
      const { status, json } = await get('/api/produccion?estado=EN_PROCESO')

      expect(status).toBe(200)
      expect(json.data.every((o: any) => o.estado === 'EN_PROCESO')).toBe(true)
      expect(json.data.some((o: any) => o.id_produccion === idOrdEnProceso)).toBe(true)
    })

    it('IPR-11 filtra correctamente por id_producto via query param', async () => {
      const { status, json } = await get(`/api/produccion?id_producto=${idProductoActivo}`)

      expect(status).toBe(200)
      expect(json.data.every((o: any) => o.id_producto === idProductoActivo)).toBe(true)
    })
  })

  describe('RF-20 · Transiciones de estado (PATCH /api/produccion/:id/estado)', () => {
    let idOrdenTransicion: number

    it('IPR-12 pasa de PENDIENTE a EN_PROCESO y registra auditoría', async () => {
      const res = await post('/api/produccion', {
        id_producto: idProductoActivo,
        id_usuario: idUsuario,
        cantidad_planificada: 50,
        observaciones: `${MARCA} orden transiciones`,
      })
      idOrdenTransicion = res.json.data.id_produccion
      creados.producciones.push(idOrdenTransicion)

      const { status, json } = await patch(`/api/produccion/${idOrdenTransicion}/estado`, {
        estado: 'EN_PROCESO',
      })

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.estado).toBe('EN_PROCESO')

      const { data: audit } = await supabase
        .from('auditoria')
        .select('*')
        .eq('tabla_afectada', 'produccion')
        .eq('registro_id', idOrdenTransicion)
        .eq('accion', 'CAMBIAR_ESTADO_PRODUCCION')
        .order('id_auditoria', { ascending: false })
        .limit(1)
        .single()

      expect(audit).toBeDefined()
      expect(audit?.detalle).toContain('EN_PROCESO')
    })

    it('IPR-13 pasa a COMPLETADA y asigna automáticamente la cantidad planificada si no se envió cantidad_producida', async () => {
      const { status, json } = await patch(`/api/produccion/${idOrdenTransicion}/estado`, {
        estado: 'COMPLETADA',
      })

      expect(status).toBe(200)
      expect(json.data.estado).toBe('COMPLETADA')
      expect(json.data.cantidad_producida).toBe(50) // Debe igualar la planificada
    })

    it('IPR-14 rechaza modificar una orden que ya está COMPLETADA (400)', async () => {
      const { status, json } = await patch(`/api/produccion/${idOrdenTransicion}/estado`, {
        estado: 'PENDIENTE',
      })

      expect(status).toBe(400)
      expect(json.statusMessage || json.message).toContain('No se puede modificar una orden de producción que ya ha sido completada.')
    })

    it('IPR-15 rechaza modificar una orden CANCELADA (400)', async () => {
      const resCancel = await post('/api/produccion', {
        id_producto: idProductoActivo,
        id_usuario: idUsuario,
        cantidad_planificada: 10,
        estado: 'CANCELADA',
      })
      const idCancelada = resCancel.json.data.id_produccion
      creados.producciones.push(idCancelada)

      const { status, json } = await patch(`/api/produccion/${idCancelada}/estado`, {
        estado: 'EN_PROCESO',
      })

      expect(status).toBe(400)
      expect(json.statusMessage || json.message).toContain('No se puede modificar una orden de producción cancelada.')
    })
  })

  describe('RF-20 · Consulta individual y Actualización (GET / PUT /api/produccion/:id)', () => {
    let idOrdenEdicion: number

    it('IPR-16 GET /api/produccion/:id devuelve los datos detallados', async () => {
      const res = await post('/api/produccion', {
        id_producto: idProductoActivo,
        id_usuario: idUsuario,
        cantidad_planificada: 20,
        observaciones: `${MARCA} orden para GET y PUT`,
      })
      idOrdenEdicion = res.json.data.id_produccion
      creados.producciones.push(idOrdenEdicion)

      const { status, json } = await get(`/api/produccion/${idOrdenEdicion}`)

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.id_produccion).toBe(idOrdenEdicion)
      expect(json.data.producto.id_producto).toBe(idProductoActivo)
    })

    it('IPR-17 GET /api/produccion/999999999 responde 404', async () => {
      const { status, json } = await get('/api/produccion/999999999')

      expect(status).toBe(404)
      expect(json.statusMessage || json.message).toContain('No se encontró')
    })

    it('IPR-18 PUT /api/produccion/:id actualiza cantidad planificada y observaciones', async () => {
      const { status, json } = await put(`/api/produccion/${idOrdenEdicion}`, {
        cantidad_planificada: 45,
        observaciones: `${MARCA} observaciones editadas`,
      })

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.cantidad_planificada).toBe(45)
      expect(json.data.observaciones).toBe(`${MARCA} observaciones editadas`)
    })
  })

  describe('RF-20 · Seguridad y Control de Sesión (D-16 / D-17)', () => {
    // En Sprint 2 (D-03 / IT-29), se estableció que las operaciones de mutación exigen cookie de sesión.
    // Actualmente POST /api/produccion acepta peticiones sin cookie si el body incluye id_usuario.
    it.fails('IPR-19 rechaza registrar orden de producción sin sesión activa (401)', async () => {
      const payload = {
        id_producto: idProductoActivo,
        id_usuario: idUsuario,
        cantidad_planificada: 10,
      }

      const { status, json } = await post('/api/produccion', payload, null)
      if (json.data?.id_produccion) creados.producciones.push(json.data.id_produccion)

      expect(status).toBe(401)
      expect(json.statusMessage || json.message).toContain('No hay sesión activa')
    })

    // Si hay sesión activa, el servidor debe forzar id_usuario de la sesión e ignorar cualquier id_usuario ajeno en el body
    it.fails('IPR-20 ignora id_usuario del body y asigna el de la cookie de sesión', async () => {
      const payload = {
        id_producto: idProductoActivo,
        id_usuario: 999_999_999, // Intentando suplantar usuario
        cantidad_planificada: 10,
      }

      const { status, json } = await post('/api/produccion', payload, { id_usuario: idUsuario })
      if (json.data?.id_produccion) creados.producciones.push(json.data.id_produccion)

      expect(status).toBe(201)
      expect(json.data.id_usuario).toBe(idUsuario)
    })
  })
})
