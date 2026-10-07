/**
 * Pruebas de integración · Sprint 3 (RF-09)
 * Gestión y Registro de Mermas / Desperdicios (Carolina)
 * Responsable de QA: Armando Solis
 *
 * Flujo probado:
 * API (POST /api/perdida) → DTO (Zod) → Service → Repository (RPC Supabase) → Base de datos
 *
 * Reglas de seguridad sobre la base compartida:
 *  - Todos los datos creados llevan la marca [QA-TEST].
 *  - afterAll elimina estrictamente los registros creados en orden de clave foránea:
 *    auditoria → movimiento_inventario → perdida → lote → producto.
 *  - Los usuarios existentes solo se leen.
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
  perdidas: [] as number[],
  lotes: [] as number[],
  productos: [] as number[],
}

const cookieSesion = (sesion: { id_usuario: number } | null): Record<string, string> =>
  sesion ? { cookie: `usuario_session=${encodeURIComponent(JSON.stringify(sesion))}` } : {}

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

describe.skipIf(!hayCredenciales)('Integración · RF-09 Registrar Mermas', async () => {
  if (!hayCredenciales) return

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  let idUsuario: number
  let idProductoPrincipal: number
  let idProductoSecundario: number
  let idProductoInactivo: number
  let idLotePrincipal: number
  let idLoteSecundario: number
  let idLoteConsumibleTotal: number

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

    // 2. Crear productos de prueba con stock conocido
    const { data: prodP, error: errProdP } = await supabase
      .from('producto')
      .insert({
        nombre: `${MARCA} Harina Especial ${corrida}`,
        unidad_medida: 'kg',
        estado: true,
        stock_actual: 100,
        stock_minimo: 10,
      })
      .select('id_producto')
      .single()
    if (errProdP) throw errProdP
    idProductoPrincipal = prodP.id_producto
    creados.productos.push(idProductoPrincipal)

    const { data: prodS, error: errProdS } = await supabase
      .from('producto')
      .insert({
        nombre: `${MARCA} Azúcar Refinada ${corrida}`,
        unidad_medida: 'kg',
        estado: true,
        stock_actual: 50,
        stock_minimo: 5,
      })
      .select('id_producto')
      .single()
    if (errProdS) throw errProdS
    idProductoSecundario = prodS.id_producto
    creados.productos.push(idProductoSecundario)

    const { data: prodInac, error: errProdInac } = await supabase
      .from('producto')
      .insert({
        nombre: `${MARCA} Levadura Descontinuada ${corrida}`,
        unidad_medida: 'kg',
        estado: false,
        stock_actual: 20,
        stock_minimo: 2,
      })
      .select('id_producto')
      .single()
    if (errProdInac) throw errProdInac
    idProductoInactivo = prodInac.id_producto
    creados.productos.push(idProductoInactivo)

    // 3. Crear lotes de prueba asociados a los productos
    const { data: loteP, error: errLoteP } = await supabase
      .from('lote')
      .insert({
        id_producto: idProductoPrincipal,
        numero_lote: `LOT-HAR-${corrida}`,
        cantidad: 40,
        fecha_produccion: '2026-10-01',
        fecha_vencimiento: '2026-11-01',
        estado: true,
      })
      .select('id_lote')
      .single()
    if (errLoteP) throw errLoteP
    idLotePrincipal = loteP.id_lote
    creados.lotes.push(idLotePrincipal)

    const { data: loteS, error: errLoteS } = await supabase
      .from('lote')
      .insert({
        id_producto: idProductoSecundario,
        numero_lote: `LOT-AZU-${corrida}`,
        cantidad: 25,
        fecha_produccion: '2026-10-01',
        fecha_vencimiento: '2026-11-01',
        estado: true,
      })
      .select('id_lote')
      .single()
    if (errLoteS) throw errLoteS
    idLoteSecundario = loteS.id_lote
    creados.lotes.push(idLoteSecundario)

    const { data: loteTotal, error: errLoteTotal } = await supabase
      .from('lote')
      .insert({
        id_producto: idProductoPrincipal,
        numero_lote: `LOT-CONS-${corrida}`,
        cantidad: 5,
        fecha_produccion: '2026-10-01',
        fecha_vencimiento: '2026-11-01',
        estado: true,
      })
      .select('id_lote')
      .single()
    if (errLoteTotal) throw errLoteTotal
    idLoteConsumibleTotal = loteTotal.id_lote
    creados.lotes.push(idLoteConsumibleTotal)
  })

  afterAll(async () => {
    const errores: string[] = []

    // 0. Recolectar cualquier pérdida residual asociada a los productos de prueba
    if (creados.productos.length) {
      const { data: perds } = await supabase
        .from('perdida')
        .select('id_perdida')
        .in('id_producto', creados.productos)
      if (perds) {
        for (const p of perds) {
          if (!creados.perdidas.includes(p.id_perdida)) {
            creados.perdidas.push(p.id_perdida)
          }
        }
      }
    }

    // 1. Borrar auditoría asociada a las pérdidas creadas
    if (creados.perdidas.length) {
      const { error } = await supabase
        .from('auditoria')
        .delete()
        .eq('tabla_afectada', 'perdida')
        .in('registro_id', creados.perdidas)
      if (error) errores.push(`auditoria (perdida): ${error.message}`)
    }

    // 2. Borrar movimientos de inventario asociados
    if (creados.perdidas.length) {
      const { error } = await supabase
        .from('movimiento_inventario')
        .delete()
        .in('id_perdida', creados.perdidas)
      if (error) errores.push(`movimiento_inventario: ${error.message}`)
    }

    // 3. Borrar registros de mermas / pérdidas
    if (creados.perdidas.length) {
      const { error } = await supabase
        .from('perdida')
        .delete()
        .in('id_perdida', creados.perdidas)
      if (error) errores.push(`perdida: ${error.message}`)
    }

    // 4. Borrar lotes creados
    if (creados.lotes.length) {
      const { error } = await supabase
        .from('lote')
        .delete()
        .in('id_lote', creados.lotes)
      if (error) errores.push(`lote: ${error.message}`)
    }

    // 5. Borrar productos creados
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

  describe('RF-09 · Flujo Básico: Registro de Mermas Exitoso (CU09)', () => {
    it('IPER-01 registra merma válida sin lote y retorna resultado completo', async () => {
      const payload = {
        id_producto: idProductoPrincipal,
        id_usuario: idUsuario,
        cantidad: 10,
        motivo: `${MARCA} Saco roto durante transporte`,
        tipo_perdida: 'DANO_TRANSPORTE',
        observaciones: `${MARCA} merma IPER-01`,
      }

      const { status, json } = await post('/api/perdida', payload)

      expect(status).toBe(200)
      expect(json).toBeDefined()
      expect(json.id_perdida).toBeTypeOf('number')
      expect(json.id_producto).toBe(idProductoPrincipal)
      expect(json.id_lote).toBeNull()
      expect(json.cantidad).toBe(10)
      expect(json.stock_anterior).toBe(100)
      expect(json.stock_nuevo).toBe(90)
      expect(json.motivo).toBe(`${MARCA} Saco roto durante transporte`)
      expect(json.tipo_perdida).toBe('DANO_TRANSPORTE')

      creados.perdidas.push(json.id_perdida)
    })

    it('IPER-02 descuenta el stock actual del producto en la tabla producto de Supabase', async () => {
      const { data: prod } = await supabase
        .from('producto')
        .select('stock_actual')
        .eq('id_producto', idProductoPrincipal)
        .single()

      expect(prod).toBeDefined()
      expect(Number(prod?.stock_actual)).toBe(90)
    })

    it('IPER-03 verifica persistencia exacta en la tabla perdida de Supabase', async () => {
      const idPerdida = creados.perdidas[0]
      const { data: perdida } = await supabase
        .from('perdida')
        .select('*')
        .eq('id_perdida', idPerdida)
        .single()

      expect(perdida).toBeDefined()
      expect(perdida.id_producto).toBe(idProductoPrincipal)
      expect(perdida.id_usuario).toBe(idUsuario)
      expect(Number(perdida.cantidad)).toBe(10)
      expect(perdida.motivo).toBe(`${MARCA} Saco roto durante transporte`)
      expect(perdida.tipo_perdida).toBe('DANO_TRANSPORTE')
    })

    it('IPER-04 crea fila en movimiento_inventario con tipo_movimiento PERDIDA', async () => {
      const idPerdida = creados.perdidas[0]
      const { data: mov } = await supabase
        .from('movimiento_inventario')
        .select('*')
        .eq('id_perdida', idPerdida)
        .single()

      expect(mov).toBeDefined()
      expect(mov.id_producto).toBe(idProductoPrincipal)
      expect(mov.tipo_movimiento).toBe('PERDIDA')
      expect(Number(mov.cantidad)).toBe(10)
      expect(Number(mov.stock_anterior)).toBe(100)
      expect(Number(mov.stock_nuevo)).toBe(90)
    })

    it('IPER-05 genera bitácora en la tabla auditoria con acción REGISTRAR_PERDIDA', async () => {
      const idPerdida = creados.perdidas[0]
      const { data: audit } = await supabase
        .from('auditoria')
        .select('*')
        .eq('tabla_afectada', 'perdida')
        .eq('registro_id', idPerdida)
        .single()

      expect(audit).toBeDefined()
      expect(audit.accion).toBe('REGISTRAR_PERDIDA')
      expect(audit.id_usuario).toBe(idUsuario)
      expect(audit.detalle).toContain('Se registró una pérdida')
    })
  })

  describe('RF-09 · Registro de Merma con Lote e Inactivación', () => {
    it('IPER-06 descuenta tanto el stock del producto como la cantidad del lote', async () => {
      const payload = {
        id_producto: idProductoPrincipal,
        id_lote: idLotePrincipal,
        id_usuario: idUsuario,
        cantidad: 15,
        motivo: `${MARCA} Humedad detectada en lote`,
        tipo_perdida: 'DETERIORO',
      }

      const { status, json } = await post('/api/perdida', payload)

      expect(status).toBe(200)
      expect(json.id_lote).toBe(idLotePrincipal)
      expect(json.stock_anterior).toBe(90)
      expect(json.stock_nuevo).toBe(75)

      creados.perdidas.push(json.id_perdida)

      // Verificar lote actualizado (40 - 15 = 25)
      const { data: lote } = await supabase
        .from('lote')
        .select('cantidad, estado')
        .eq('id_lote', idLotePrincipal)
        .single()

      expect(Number(lote?.cantidad)).toBe(25)
      expect(lote?.estado).toBe(true)
    })

    it('IPER-07 inactiva automáticamente el lote (estado: false) al consumir el 100% de su stock', async () => {
      // idLoteConsumibleTotal tiene cantidad 5
      const payload = {
        id_producto: idProductoPrincipal,
        id_lote: idLoteConsumibleTotal,
        id_usuario: idUsuario,
        cantidad: 5,
        motivo: `${MARCA} Merma total de lote por caducidad`,
        tipo_perdida: 'VENCIMIENTO',
      }

      const { status, json } = await post('/api/perdida', payload)

      expect(status).toBe(200)
      creados.perdidas.push(json.id_perdida)

      const { data: lote } = await supabase
        .from('lote')
        .select('cantidad, estado')
        .eq('id_lote', idLoteConsumibleTotal)
        .single()

      expect(Number(lote?.cantidad)).toBe(0)
      expect(lote?.estado).toBe(false)
    })
  })

  describe('RF-09 · Reglas de Negocio y Flujos Alternos (CU09)', () => {
    it('IPER-08 rechaza merma si la cantidad supera el stock disponible del producto (400)', async () => {
      // Stock actual de idProductoPrincipal es 70
      const payload = {
        id_producto: idProductoPrincipal,
        id_usuario: idUsuario,
        cantidad: 500, // Supera stock disponible
        motivo: `${MARCA} Intento de merma excesiva`,
        tipo_perdida: 'VENCIMIENTO',
      }

      const { status, json } = await post('/api/perdida', payload)

      expect(status).toBe(400)
      expect(json.message || json.statusMessage).toMatch(/Stock insuficiente/i)
    })

    it('IPER-09 rechaza merma si la cantidad supera la disponible en el lote (400)', async () => {
      // Lote principal tiene 25 restantes
      const payload = {
        id_producto: idProductoPrincipal,
        id_lote: idLotePrincipal,
        id_usuario: idUsuario,
        cantidad: 30, // Supera lote disponible
        motivo: `${MARCA} Supera cantidad de lote`,
        tipo_perdida: 'DETERIORO',
      }

      const { status, json } = await post('/api/perdida', payload)

      expect(status).toBe(400)
      expect(json.message || json.statusMessage).toMatch(/Cantidad insuficiente en el lote/i)
    })

    it('IPER-10 rechaza merma si el lote indicado no pertenece al producto seleccionado (400)', async () => {
      // idLoteSecundario pertenece a idProductoSecundario, no a idProductoPrincipal
      const payload = {
        id_producto: idProductoPrincipal,
        id_lote: idLoteSecundario,
        id_usuario: idUsuario,
        cantidad: 5,
        motivo: `${MARCA} Lote cruzado`,
        tipo_perdida: 'DETERIORO',
      }

      const { status, json } = await post('/api/perdida', payload)

      expect(status).toBe(400)
      expect(json.message || json.statusMessage).toMatch(/El lote indicado no pertenece al producto/i)
    })

    it('IPER-11 rechaza merma si el lote no existe o está inactivo (400)', async () => {
      const payload = {
        id_producto: idProductoPrincipal,
        id_lote: 999999999,
        id_usuario: idUsuario,
        cantidad: 5,
        motivo: `${MARCA} Lote inexistente`,
        tipo_perdida: 'VENCIMIENTO',
      }

      const { status, json } = await post('/api/perdida', payload)

      expect(status).toBe(400)
      expect(json.message || json.statusMessage).toMatch(/El lote no existe o está inactivo/i)
    })

    it('IPER-12 rechaza merma de producto inexistente (400)', async () => {
      const payload = {
        id_producto: 999999999,
        id_usuario: idUsuario,
        cantidad: 5,
        motivo: `${MARCA} Producto inexistente`,
        tipo_perdida: 'VENCIMIENTO',
      }

      const { status, json } = await post('/api/perdida', payload)

      expect(status).toBe(400)
      expect(json.message || json.statusMessage).toMatch(/El producto no existe o está inactivo/i)
    })

    it('IPER-13 rechaza merma de producto inactivo (400)', async () => {
      const payload = {
        id_producto: idProductoInactivo,
        id_usuario: idUsuario,
        cantidad: 5,
        motivo: `${MARCA} Producto inactivo`,
        tipo_perdida: 'VENCIMIENTO',
      }

      const { status, json } = await post('/api/perdida', payload)

      expect(status).toBe(400)
      expect(json.message || json.statusMessage).toMatch(/El producto no existe o está inactivo/i)
    })

    it('IPER-14 rechaza merma con usuario inexistente o inactivo (400)', async () => {
      const payload = {
        id_producto: idProductoPrincipal,
        id_usuario: 999999999,
        cantidad: 5,
        motivo: `${MARCA} Usuario falso`,
        tipo_perdida: 'VENCIMIENTO',
      }

      const { status, json } = await post('/api/perdida', payload)

      expect(status).toBe(400)
      expect(json.message || json.statusMessage).toMatch(/El usuario no existe o está inactivo/i)
    })
  })

  describe('RF-09 · Validaciones de Datos de Entrada (DTO Zod)', () => {
    it('IPER-15 rechaza cantidad cero o negativa (400)', async () => {
      const { status: stCero } = await post('/api/perdida', {
        id_producto: idProductoPrincipal,
        id_usuario: idUsuario,
        cantidad: 0,
        motivo: 'Cero',
        tipo_perdida: 'VENCIMIENTO',
      })
      expect(stCero).toBe(400)

      const { status: stNeg } = await post('/api/perdida', {
        id_producto: idProductoPrincipal,
        id_usuario: idUsuario,
        cantidad: -10,
        motivo: 'Negativa',
        tipo_perdida: 'VENCIMIENTO',
      })
      expect(stNeg).toBe(400)
    })

    it('IPER-16 rechaza motivo vacío o compuesto solo por espacios (400)', async () => {
      const { status } = await post('/api/perdida', {
        id_producto: idProductoPrincipal,
        id_usuario: idUsuario,
        cantidad: 5,
        motivo: '    ',
        tipo_perdida: 'VENCIMIENTO',
      })

      expect(status).toBe(400)
    })

    it('IPER-17 rechaza tipo de pérdida vacío o no enviado (400)', async () => {
      const { status } = await post('/api/perdida', {
        id_producto: idProductoPrincipal,
        id_usuario: idUsuario,
        cantidad: 5,
        motivo: 'Motivo válido',
        tipo_perdida: '',
      })

      expect(status).toBe(400)
    })

    it('IPER-18 registra merma con fecha explícita y observaciones opcionales', async () => {
      const fechaPersonalizada = '2026-10-05'
      const observaciones = `${MARCA} Observación detallada de merma`

      const payload = {
        id_producto: idProductoSecundario,
        id_usuario: idUsuario,
        cantidad: 2,
        motivo: `${MARCA} Paquete roto`,
        tipo_perdida: 'ACCIDENTE',
        fecha: fechaPersonalizada,
        observaciones,
      }

      const { status, json } = await post('/api/perdida', payload)

      expect(status).toBe(200)
      expect(json.fecha).toBe(fechaPersonalizada)
      expect(json.observaciones).toBe(observaciones)

      creados.perdidas.push(json.id_perdida)
    })
  })

  describe('RF-09 · Seguridad y Control de Sesión (Defectos D-18 / D-19)', () => {
    // D-18: POST /api/perdida actualmente no exige cookie de sesión (permite peticiones no autenticadas).
    // Con it.fails verificamos que el endpoint NO cumple el estándar de seguridad acordado (401).
    it.fails('IPER-19 rechaza registrar merma sin sesión activa (401)', async () => {
      const payload = {
        id_producto: idProductoPrincipal,
        id_usuario: idUsuario,
        cantidad: 1,
        motivo: `${MARCA} Petición sin cookie`,
        tipo_perdida: 'VENCIMIENTO',
      }

      // Se envía cookie nula (sin cabecera de autenticación)
      const { status, json } = await post('/api/perdida', payload, null)
      if (json?.id_perdida) creados.perdidas.push(json.id_perdida)

      expect(status).toBe(401)
    })

    // D-19: POST /api/perdida respeta el id_usuario del body en lugar de forzar el de la cookie.
    it.fails('IPER-20 fuerza el usuario de la sesión y no permite suplantación en el body', async () => {
      const sesionReal = { id_usuario: idUsuario }
      const payload = {
        id_producto: idProductoPrincipal,
        id_usuario: 999999999, // Intentando suplantar con usuario ajeno
        cantidad: 1,
        motivo: `${MARCA} Intento suplantación`,
        tipo_perdida: 'VENCIMIENTO',
      }

      const { status, json } = await post('/api/perdida', payload, sesionReal)
      if (json?.id_perdida) creados.perdidas.push(json.id_perdida)

      // El servidor debería ignorar el id_usuario del body y usar el de la sesión
      expect(status).toBe(200)
      expect(json.id_usuario).toBe(idUsuario)
    })
  })
})
