/**
 * Pruebas de integración · Sprint 2 (RF-12, RF-02)
 *
 * Levantan la app Nuxt y llaman a los endpoints reales contra la base de
 * Supabase COMPARTIDA. Reglas de seguridad:
 *  - Todo dato creado lleva la marca [QA-TEST] en su nombre o encargado.
 *  - Solo se borran los IDs que esta prueba creó (afterAll).
 *  - Los registros existentes solo se leen, nunca se modifican.
 */
import { existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

if (existsSync('.env')) process.loadEnvFile('.env')

const MARCA = '[QA-TEST]'
const corrida = Date.now()
const hayCredenciales = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)

const creados = {
  destinatarios: [] as number[],
  productos: [] as number[],
  pedidos: [] as number[],
}

const post = async (ruta: string, body: unknown) => {
  const respuesta = await fetch(ruta, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: respuesta.status, json: await respuesta.json() }
}

describe.skipIf(!hayCredenciales)('Integración · Destinatarios y Pedidos', async () => {
  if (!hayCredenciales) return

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

  let idUsuario: number
  let idDestinatario: number
  let idDestinatarioInactivo: number
  let idProductoA: number
  let idProductoB: number
  let idProductoInactivo: number
  let idProductoSinStock: number

  const crearProductoQA = async (nombre: string, estado: boolean, stock_actual = 100) => {
    const { data, error } = await supabase
      .from('producto')
      .insert({ nombre: `${MARCA} ${nombre} ${corrida}`, unidad_medida: 'unidad', estado, stock_actual })
      .select('id_producto')
      .single()
    if (error) throw error
    creados.productos.push(data.id_producto)
    return data.id_producto as number
  }

  const pedidoBase = () => ({
    id_destinatario: idDestinatario,
    id_usuario: idUsuario,
    fecha_entrega: null,
    prioridad: 'ALTA',
    encargado_entrega: MARCA,
    detalles: [
      { id_producto: idProductoA, cantidad: 12 },
      { id_producto: idProductoB, cantidad: 2.5 },
    ],
  })

  await setup({ server: true })

  beforeAll(async () => {
    // Solo lectura: se usa un usuario activo existente como autor del pedido.
    const { data: usuario, error } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('estado', true)
      .limit(1)
      .single()
    if (error || !usuario) throw new Error('No hay un usuario activo para las pruebas.')
    idUsuario = usuario.id_usuario

    idProductoA = await crearProductoQA('Pan A', true)
    idProductoB = await crearProductoQA('Pan B', true)
    idProductoInactivo = await crearProductoQA('Pan inactivo', false)
    idProductoSinStock = await crearProductoQA('Pan poco stock', true, 1)

    const { data: inactivo, error: errorInactivo } = await supabase
      .from('destinatario')
      .insert({ nombre_empresa: `${MARCA} Destinatario inactivo ${corrida}`, estado: false })
      .select('id_destinatario')
      .single()
    if (errorInactivo) throw errorInactivo
    idDestinatarioInactivo = inactivo.id_destinatario
    creados.destinatarios.push(idDestinatarioInactivo)
  })

  afterAll(async () => {
    // Recupera también pedidos creados en pruebas que fallaron a medio camino.
    if (creados.destinatarios.length) {
      const { data } = await supabase
        .from('pedido')
        .select('id_pedido')
        .in('id_destinatario', creados.destinatarios)
      for (const fila of data || []) {
        if (!creados.pedidos.includes(fila.id_pedido)) creados.pedidos.push(fila.id_pedido)
      }
    }

    const errores: string[] = []
    const borrar = async (tabla: string, columna: string, ids: number[]) => {
      if (!ids.length) return
      const { error } = await supabase.from(tabla).delete().in(columna, ids)
      if (error) errores.push(`${tabla}: ${error.message}`)
    }

    // La auditoría de los pedidos de prueba (CU02 paso 8) también se elimina.
    if (creados.pedidos.length) {
      const { error } = await supabase
        .from('auditoria')
        .delete()
        .eq('accion', 'REGISTRAR_PEDIDO')
        .eq('tabla_afectada', 'pedido')
        .in('registro_id', creados.pedidos)
      if (error) errores.push(`auditoria: ${error.message}`)
    }

    await borrar('detalle_pedido', 'id_pedido', creados.pedidos)
    await borrar('pedido', 'id_pedido', creados.pedidos)
    await borrar('destinatario', 'id_destinatario', creados.destinatarios)
    await borrar('producto', 'id_producto', creados.productos)

    if (errores.length) {
      throw new Error(`Limpieza incompleta (revisar registros ${MARCA}): ${errores.join(' | ')}`)
    }
  })

  describe('RF-12 · Registro de destinatario', () => {
    it('IT-01 registra un destinatario válido', async () => {
      const { status, json } = await post('/api/destinatarios', {
        nombre_empresa: `${MARCA} Soda Prueba ${corrida}`,
        telefono: '0000-0000',
        correo: 'qa-test@example.com',
        direccion: `${MARCA} dirección`,
      })

      expect(status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data.id_destinatario).toBeTypeOf('number')
      expect(json.data.estado).toBe(true)
      idDestinatario = json.data.id_destinatario
      creados.destinatarios.push(idDestinatario)
    })

    it('IT-02 el destinatario aparece en el listado', async () => {
      const json = await $fetch<{ success: boolean; data: { id_destinatario: number }[] }>('/api/destinatarios')

      expect(json.success).toBe(true)
      expect(json.data.map((d) => d.id_destinatario)).toContain(idDestinatario)
    })

    it('IT-03 rechaza destinatario sin nombre', async () => {
      const { status, json } = await post('/api/destinatarios', { nombre_empresa: '' })

      expect(status).toBe(400)
      expect(json.message).toContain('nombre de la empresa es obligatorio')
    })

    it('IT-04 rechaza correo inválido', async () => {
      const { status, json } = await post('/api/destinatarios', {
        nombre_empresa: `${MARCA} Correo malo ${corrida}`,
        correo: 'no-es-correo',
      })

      expect(status).toBe(400)
      expect(json.message).toContain('correo v')
    })

    // D-04 (corregido)
    it('IT-17 rechaza nombre de empresa con solo espacios', async () => {
      const { status, json } = await post('/api/destinatarios', { nombre_empresa: '   ' })

      expect(status).toBe(400)
      expect(json.message).toContain('nombre de la empresa es obligatorio')
    })

    // D-07 (corregido)
    it('IT-18 rechaza un destinatario con el mismo nombre de empresa', async () => {
      const { status, json } = await post('/api/destinatarios', {
        nombre_empresa: `${MARCA} Soda Prueba ${corrida}`,
      })

      expect(status).toBe(400)
      expect(json.message).toContain('Ya existe un destinatario')
    })

    it('IT-19 rechaza el duplicado aunque cambien mayúsculas y espacios externos', async () => {
      const { status, json } = await post('/api/destinatarios', {
        nombre_empresa: `  ${MARCA} SODA PRUEBA ${corrida}  `,
      })

      expect(status).toBe(400)
      expect(json.message).toContain('Ya existe un destinatario')
    })

    const registrarSinFalsoDuplicado = async (nombre: string) => {
      const { status, json } = await post('/api/destinatarios', { nombre_empresa: nombre })
      if (json.data?.id_destinatario) creados.destinatarios.push(json.data.id_destinatario)

      expect(json.message).toBeUndefined()
      expect(status).toBe(200)
    }

    // D-08 (corregido): "_", "%" y "*" no deben actuar como comodines al buscar duplicados.
    it.each([
      ['IT-20', '_', `${MARCA} Soda_Prueba ${corrida}`],
      ['IT-21', '%', `${MARCA} Soda%${corrida}`],
      ['IT-22', '*', `${MARCA} Soda*${corrida}`],
    ])('%s permite un nombre distinto que solo coincidiría por comodín (%s)', async (_id, _comodin, nombre) => {
      await registrarSinFalsoDuplicado(nombre)
    })

    it('IT-23 rechaza el duplicado exacto de un nombre que contiene comodines', async () => {
      const { status, json } = await post('/api/destinatarios', {
        nombre_empresa: `${MARCA} Soda_Prueba ${corrida}`,
      })

      expect(status).toBe(400)
      expect(json.message).toContain('Ya existe un destinatario')
    })
  })

  describe('RF-02 · Registro de pedidos', () => {
    it('IT-05 registra un pedido con dos productos', async () => {
      const { status, json } = await post('/api/pedidos', pedidoBase())

      expect(status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data.id_pedido).toBeTypeOf('number')
      expect(json.data.estado).toBe('PENDIENTE')
      expect(json.data.prioridad).toBe('ALTA')
      creados.pedidos.push(json.data.id_pedido)
    })

    it('IT-06 guarda los detalles del pedido en detalle_pedido', async () => {
      const { data, error } = await supabase
        .from('detalle_pedido')
        .select('id_producto, cantidad, cantidad_entregada')
        .eq('id_pedido', creados.pedidos[0])
        .order('id_producto')

      expect(error).toBeNull()
      expect(data).toEqual([
        { id_producto: idProductoA, cantidad: 12, cantidad_entregada: 0 },
        { id_producto: idProductoB, cantidad: 2.5, cantidad_entregada: 0 },
      ])
    })

    it('IT-24 registra la auditoría del pedido (CU02 paso 8)', async () => {
      const { data, error } = await supabase
        .from('auditoria')
        .select('id_usuario, accion, tabla_afectada, registro_id')
        .eq('tabla_afectada', 'pedido')
        .eq('registro_id', creados.pedidos[0])

      expect(error).toBeNull()
      expect(data).toEqual([
        { id_usuario: idUsuario, accion: 'REGISTRAR_PEDIDO', tabla_afectada: 'pedido', registro_id: creados.pedidos[0] },
      ])
    })

    it.each([
      ['IT-07', 'sin productos', { detalles: [] }, 'al menos un producto'],
      ['IT-08', 'con productos repetidos', { detalles: [{ id_producto: 1, cantidad: 1 }, { id_producto: 1, cantidad: 2 }] }, 'No repitas productos'],
      ['IT-09', 'con cantidad cero', { detalles: [{ id_producto: 1, cantidad: 0 }] }, 'mayor que cero'],
    ])('%s rechaza pedido %s (validación DTO)', async (_id, _caso, cambios, mensaje) => {
      const { status, json } = await post('/api/pedidos', { ...pedidoBase(), ...cambios })

      expect(status).toBe(400)
      expect(json.message).toContain(mensaje)
    })

    it('IT-10 rechaza destinatario inexistente', async () => {
      const { status, json } = await post('/api/pedidos', { ...pedidoBase(), id_destinatario: 999_999_999 })

      expect(status).toBe(400)
      expect(json.message).toContain('destinatario no existe')
    })

    it('IT-11 rechaza destinatario inactivo', async () => {
      const { status, json } = await post('/api/pedidos', { ...pedidoBase(), id_destinatario: idDestinatarioInactivo })

      expect(status).toBe(400)
      expect(json.message).toContain('destinatario no existe')
    })

    it('IT-12 rechaza usuario inexistente', async () => {
      const { status, json } = await post('/api/pedidos', { ...pedidoBase(), id_usuario: 999_999_999 })

      expect(status).toBe(400)
      expect(json.message).toContain('usuario no existe')
    })

    it('IT-13 rechaza producto inactivo', async () => {
      const { status, json } = await post('/api/pedidos', {
        ...pedidoBase(),
        detalles: [{ id_producto: idProductoInactivo, cantidad: 1 }],
      })

      expect(status).toBe(400)
      expect(json.message).toContain('productos no existen')
    })

    // D-05 (corregido)
    it('IT-25 rechaza prioridad fuera del catálogo', async () => {
      const { status } = await post('/api/pedidos', { ...pedidoBase(), prioridad: 'CUALQUIERA' })

      expect(status).toBe(400)
    })

    // D-06 (corregido)
    it('IT-26 rechaza fecha de entrega en el pasado', async () => {
      const { status, json } = await post('/api/pedidos', { ...pedidoBase(), fecha_entrega: '2020-01-01' })

      expect(status).toBe(400)
      expect(json.message).toContain('no puede ser anterior a la fecha actual')
    })

    // La validación de stock se retiró (commit f06c14e): el pedido se acepta aunque supere el stock.
    it('IT-27 acepta un pedido que supera el stock actual', async () => {
      const { status, json } = await post('/api/pedidos', {
        ...pedidoBase(),
        detalles: [{ id_producto: idProductoSinStock, cantidad: 5 }],
      })
      if (json.data?.id_pedido) creados.pedidos.push(json.data.id_pedido)

      expect(status).toBe(201)
    })

    it('IT-14 los pedidos rechazados no dejan registros en la base', async () => {
      const { data, error } = await supabase
        .from('pedido')
        .select('id_pedido')
        .in('id_destinatario', creados.destinatarios)

      expect(error).toBeNull()
      expect(data?.map((p) => p.id_pedido).sort()).toEqual([...creados.pedidos].sort())
    })
  })

  describe('RF-02 · Normalización de prioridad (ronda 7)', () => {
    it('IT-30 acepta prioridad en minúsculas y la guarda en mayúsculas', async () => {
      const { status, json } = await post('/api/pedidos', { ...pedidoBase(), prioridad: 'urgente' })
      if (json.data?.id_pedido) creados.pedidos.push(json.data.id_pedido)

      expect(status).toBe(201)
      expect(json.data.prioridad).toBe('URGENTE')
    })
  })

  describe('RF-02 · Listado de pedidos', () => {
    it('IT-15 el pedido aparece en el listado con destinatario y productos', async () => {
      const json = await $fetch<{ success: boolean; total: number; data: any[] }>('/api/pedidos')
      const pedido = json.data.find((p) => p.id_pedido === creados.pedidos[0])

      expect(json.success).toBe(true)
      expect(json.total).toBe(json.data.length)
      expect(pedido).toBeDefined()
      expect(pedido.destinatario.nombre_empresa).toContain(MARCA)
      expect(pedido.detalle_pedido).toHaveLength(2)
      expect(pedido.detalle_pedido.map((d: any) => d.producto.nombre).join()).toContain(`${MARCA} Pan A`)
    })

    it('IT-16 el listado viene ordenado del más reciente al más antiguo', async () => {
      const json = await $fetch<{ data: { fecha_registro: string }[] }>('/api/pedidos')
      const fechas = json.data.map((p) => new Date(p.fecha_registro).getTime())

      expect(fechas).toEqual([...fechas].sort((a, b) => b - a))
    })
  })

  describe('Defectos abiertos de RF-02', () => {
    // IT-28 (ronda 7): la función transaccional ya no se usa (commit 3b3a70a); el caso
    // de D-02 se cubre en tests/unit/pedido.repository.test.ts.

    // DEFECTO D-03: el servidor no exige sesión y confía en el id_usuario del cuerpo.
    // Si el defecto sigue, esta petición crea un pedido [QA-TEST] que afterAll elimina.
    it.fails('IT-29 rechaza registrar un pedido sin sesión (401)', async () => {
      const { status, json } = await post('/api/pedidos', pedidoBase())
      if (json.data?.id_pedido) creados.pedidos.push(json.data.id_pedido)

      expect(status).toBe(401)
    })
  })
})
