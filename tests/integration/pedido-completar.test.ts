/**
 * Pruebas de integración · Sprint 3 (RF-21)
 * Marcar Pedido como Completado (Manuel)
 * Responsable de QA: Armando Solis
 *
 * Flujo probado:
 * API (PATCH /api/pedidos/:id/estado) → Service → Repository → Supabase (pedido + auditoria)
 *
 * Reglas de seguridad sobre la base compartida:
 *  - Todos los datos creados llevan la marca [QA-TEST].
 *  - afterAll elimina estrictamente los registros creados en orden de dependencias:
 *    auditoria → detalle_pedido → pedido → destinatario → producto.
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
  pedidos: [] as number[],
  destinatarios: [] as number[],
  productos: [] as number[],
}

const cookieSesion = (sesion: { id_usuario: number } | null): Record<string, string> =>
  sesion ? { cookie: `usuario_session=${encodeURIComponent(JSON.stringify(sesion))}` } : {}

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

describe.skipIf(!hayCredenciales)('Integración · RF-21 Marcar Pedido como Completado', async () => {
  if (!hayCredenciales) return

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  let idUsuario: number
  let idDestinatario: number
  let idProducto: number
  let idPedidoPendiente: number
  let idPedidoEnProceso: number
  let idPedidoYaCompletado: number
  let idPedidoCancelado: number

  await setup({ server: true })

  beforeAll(async () => {
    // 1. Obtener usuario activo existente (solo lectura)
    const { data: usuario, error: errUsuario } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('estado', true)
      .limit(1)
      .single()
    if (errUsuario || !usuario) throw new Error('No hay usuario activo disponible en la base.')
    idUsuario = usuario.id_usuario
    idUsuarioSesion = idUsuario

    // 2. Crear destinatario y producto auxiliares
    const { data: dest, error: errDest } = await supabase
      .from('destinatario')
      .insert({
        nombre_empresa: `${MARCA} Supermercado Norte ${corrida}`,
        telefono: '8888-9999',
        estado: true,
      })
      .select('id_destinatario')
      .single()
    if (errDest) throw errDest
    idDestinatario = dest.id_destinatario
    creados.destinatarios.push(idDestinatario)

    const { data: prod, error: errProd } = await supabase
      .from('producto')
      .insert({
        nombre: `${MARCA} Pan Cuadrado Integral ${corrida}`,
        unidad_medida: 'unidad',
        estado: true,
        stock_actual: 50,
      })
      .select('id_producto')
      .single()
    if (errProd) throw errProd
    idProducto = prod.id_producto
    creados.productos.push(idProducto)

    // 3. Crear pedidos de prueba en diferentes estados iniciales
    // 3.1 Pedido PENDIENTE para completar
    const { data: pedPend, error: errPedPend } = await supabase
      .from('pedido')
      .insert({
        id_destinatario: idDestinatario,
        id_usuario: idUsuario,
        estado: 'PENDIENTE',
        prioridad: 'NORMAL',
        observaciones: `${MARCA} Pedido pendiente inicial`,
      })
      .select('id_pedido')
      .single()
    if (errPedPend) throw errPedPend
    idPedidoPendiente = pedPend.id_pedido
    creados.pedidos.push(idPedidoPendiente)

    await supabase.from('detalle_pedido').insert({
      id_pedido: idPedidoPendiente,
      id_producto: idProducto,
      cantidad: 10,
    })

    // 3.2 Pedido EN_PROCESO para completar
    const { data: pedProc, error: errPedProc } = await supabase
      .from('pedido')
      .insert({
        id_destinatario: idDestinatario,
        id_usuario: idUsuario,
        estado: 'EN_PROCESO',
        prioridad: 'ALTA',
        observaciones: `${MARCA} Pedido en proceso`,
      })
      .select('id_pedido')
      .single()
    if (errPedProc) throw errPedProc
    idPedidoEnProceso = pedProc.id_pedido
    creados.pedidos.push(idPedidoEnProceso)

    await supabase.from('detalle_pedido').insert({
      id_pedido: idPedidoEnProceso,
      id_producto: idProducto,
      cantidad: 5,
    })

    // 3.3 Pedido YA COMPLETADO (para probar bloqueo de repetición)
    const { data: pedComp, error: errPedComp } = await supabase
      .from('pedido')
      .insert({
        id_destinatario: idDestinatario,
        id_usuario: idUsuario,
        estado: 'COMPLETADO',
        prioridad: 'NORMAL',
        observaciones: `${MARCA} Pedido ya completado`,
      })
      .select('id_pedido')
      .single()
    if (errPedComp) throw errPedComp
    idPedidoYaCompletado = pedComp.id_pedido
    creados.pedidos.push(idPedidoYaCompletado)

    await supabase.from('detalle_pedido').insert({
      id_pedido: idPedidoYaCompletado,
      id_producto: idProducto,
      cantidad: 2,
    })

    // 3.4 Pedido CANCELADO (para probar bloqueo de pedidos cancelados)
    const { data: pedCanc, error: errPedCanc } = await supabase
      .from('pedido')
      .insert({
        id_destinatario: idDestinatario,
        id_usuario: idUsuario,
        estado: 'CANCELADO',
        prioridad: 'BAJA',
        observaciones: `${MARCA} Pedido cancelado`,
      })
      .select('id_pedido')
      .single()
    if (errPedCanc) throw errPedCanc
    idPedidoCancelado = pedCanc.id_pedido
    creados.pedidos.push(idPedidoCancelado)

    await supabase.from('detalle_pedido').insert({
      id_pedido: idPedidoCancelado,
      id_producto: idProducto,
      cantidad: 1,
    })
  })

  afterAll(async () => {
    const errores: string[] = []

    // 1. Borrar auditorías generadas para los pedidos creados
    if (creados.pedidos.length) {
      const { error } = await supabase
        .from('auditoria')
        .delete()
        .eq('tabla_afectada', 'pedido')
        .in('registro_id', creados.pedidos)
      if (error) errores.push(`auditoria: ${error.message}`)
    }

    // 2. Borrar detalles de pedidos
    if (creados.pedidos.length) {
      const { error } = await supabase
        .from('detalle_pedido')
        .delete()
        .in('id_pedido', creados.pedidos)
      if (error) errores.push(`detalle_pedido: ${error.message}`)
    }

    // 3. Borrar pedidos creados
    if (creados.pedidos.length) {
      const { error } = await supabase
        .from('pedido')
        .delete()
        .in('id_pedido', creados.pedidos)
      if (error) errores.push(`pedido: ${error.message}`)
    }

    // 4. Borrar destinatarios
    if (creados.destinatarios.length) {
      const { error } = await supabase
        .from('destinatario')
        .delete()
        .in('id_destinatario', creados.destinatarios)
      if (error) errores.push(`destinatario: ${error.message}`)
    }

    // 5. Borrar productos
    if (creados.productos.length) {
      const { error } = await supabase
        .from('producto')
        .delete()
        .in('id_producto', creados.productos)
      if (error) errores.push(`producto: ${error.message}`)
    }

    if (errores.length) {
      console.error('Errores en limpieza afterAll:', errores)
    }
  })

  describe('RF-21 · Flujo Exitoso: Marcar Pedido PENDIENTE como COMPLETADO', () => {
    it('IPED-01 responde 200 OK y devuelve el pedido con estado COMPLETADO', async () => {
      const { status, json } = await patch(`/api/pedidos/${idPedidoPendiente}/estado`, {
        estado: 'COMPLETADO',
      })

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.message).toBe('Pedido completado con éxito.')
      expect(json.data.id_pedido).toBe(idPedidoPendiente)
      expect(json.data.estado).toBe('COMPLETADO')
    })

    it('IPED-02 verifica en Supabase que el estado en la tabla pedido cambió a COMPLETADO', async () => {
      const { data: ped, error } = await supabase
        .from('pedido')
        .select('estado')
        .eq('id_pedido', idPedidoPendiente)
        .single()

      expect(error).toBeNull()
      expect(ped?.estado).toBe('COMPLETADO')
    })

    it('IPED-03 verifica en Supabase que se generó el registro en la tabla auditoria', async () => {
      const { data: audit, error } = await supabase
        .from('auditoria')
        .select('*')
        .eq('tabla_afectada', 'pedido')
        .eq('registro_id', idPedidoPendiente)
        .eq('accion', 'COMPLETAR_PEDIDO')
        .single()

      expect(error).toBeNull()
      expect(audit).toBeDefined()
      expect(audit.accion).toBe('COMPLETAR_PEDIDO')
      expect(audit.id_usuario).toBe(idUsuario)
      expect(audit.detalle).toContain(`El pedido #${idPedidoPendiente} fue marcado como completado manualmente`)
    })
  })

  describe('RF-21 · Flujo Exitoso: Marcar Pedido EN_PROCESO como COMPLETADO', () => {
    it('IPED-04 responde 200 OK y actualiza pedido de EN_PROCESO a COMPLETADO con auditoría', async () => {
      const { status, json } = await patch(`/api/pedidos/${idPedidoEnProceso}/estado`, {
        estado: 'COMPLETADO',
      })

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.estado).toBe('COMPLETADO')

      // Verificar en BD
      const { data: ped } = await supabase
        .from('pedido')
        .select('estado')
        .eq('id_pedido', idPedidoEnProceso)
        .single()
      expect(ped?.estado).toBe('COMPLETADO')

      // Verificar auditoría
      const { data: audit } = await supabase
        .from('auditoria')
        .select('accion, id_usuario')
        .eq('registro_id', idPedidoEnProceso)
        .eq('accion', 'COMPLETAR_PEDIDO')
        .single()
      expect(audit?.accion).toBe('COMPLETAR_PEDIDO')
      expect(audit?.id_usuario).toBe(idUsuario)
    })
  })

  describe('RF-21 · Bloqueos y Reglas de Negocio', () => {
    it('IPED-05 rechaza completar un pedido que YA está completado (400)', async () => {
      const { status, json } = await patch(`/api/pedidos/${idPedidoYaCompletado}/estado`, {
        estado: 'COMPLETADO',
      })

      expect(status).toBe(400)
      expect(json.statusMessage || json.message).toBe('El pedido ya se encuentra completado.')
    })

    it('IPED-06 rechaza completar un pedido que está cancelado (400)', async () => {
      const { status, json } = await patch(`/api/pedidos/${idPedidoCancelado}/estado`, {
        estado: 'COMPLETADO',
      })

      expect(status).toBe(400)
      expect(json.statusMessage || json.message).toBe('No se puede completar un pedido que está cancelado.')
    })

    it('IPED-07 rechaza completar un pedido inexistente (404)', async () => {
      const { status, json } = await patch('/api/pedidos/999999999/estado', {
        estado: 'COMPLETADO',
      })

      expect(status).toBe(404)
      expect(json.statusMessage || json.message).toBe('El pedido especificado no existe.')
    })

    it('IPED-08 rechaza solicitud si el parámetro id no es numérico o es inválido (400)', async () => {
      const { status: stLetras } = await patch('/api/pedidos/abc/estado', { estado: 'COMPLETADO' })
      expect(stLetras).toBe(400)

      const { status: stCero } = await patch('/api/pedidos/0/estado', { estado: 'COMPLETADO' })
      expect(stCero).toBe(400)
    })

    it('IPED-09 rechaza solicitud si el estado enviado no es COMPLETADO (400)', async () => {
      const { status, json } = await patch(`/api/pedidos/${idPedidoPendiente}/estado`, {
        estado: 'PENDIENTE',
      })

      expect(status).toBe(400)
      expect(json.statusMessage || json.message).toBe('Solo se permite marcar como COMPLETADO a través de este endpoint.')
    })

    it('IPED-10 rechaza solicitud si el cuerpo está vacío o no especifica estado (400)', async () => {
      const { status, json } = await patch(`/api/pedidos/${idPedidoPendiente}/estado`, {})

      expect(status).toBe(400)
      expect(json.statusMessage || json.message).toBe('Solo se permite marcar como COMPLETADO a través de este endpoint.')
    })
  })

  describe('RF-21 · Seguridad y Control de Sesión', () => {
    it('IPED-11 rechaza solicitud sin cookie de sesión activa (401)', async () => {
      const { status, json } = await patch(
        `/api/pedidos/${idPedidoPendiente}/estado`,
        { estado: 'COMPLETADO' },
        null // sin sesión
      )

      expect(status).toBe(401)
      expect(json.statusMessage || json.message).toBe('No hay sesión activa.')
    })

    it('IPED-12 rechaza solicitud con cookie de sesión corrupta / no JSON (401)', async () => {
      const { status, json } = await patch(
        `/api/pedidos/${idPedidoPendiente}/estado`,
        { estado: 'COMPLETADO' },
        undefined,
        'usuario_session=corrupto-no-json'
      )

      expect(status).toBe(401)
      expect(json.statusMessage || json.message).toBe('La sesión está dañada o es inválida.')
    })
  })
})
