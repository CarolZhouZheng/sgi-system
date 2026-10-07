/**
 * Pruebas de integración · Sprint 1 (RF-01, RF-03, RF-04) y RF-05 (tiempo real de Productos)
 *
 * Mismas reglas que destinatarios-pedidos.test.ts: todo producto creado lleva [QA-TEST],
 * se borra al terminar y no se modifica ningún producto existente.
 */
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import { MARCA, corrida, crearClientePublico, crearClienteServicio, hayCredenciales, pedir } from './helpers'

describe.skipIf(!hayCredenciales)('Integración · Productos', async () => {
  if (!hayCredenciales) return

  const supabase = crearClienteServicio()
  const creados: number[] = []
  let id: number

  await setup({ server: true })

  afterAll(async () => {
    if (!creados.length) return
    const { error } = await supabase.from('producto').delete().in('id_producto', creados)
    if (error) throw new Error(`Limpieza incompleta (revisar productos ${MARCA}): ${error.message}`)
  })

  const crearPorApi = async (cambios: Record<string, unknown> = {}) => {
    const respuesta = await pedir('POST', '/api/productos', {
      nombre: `${MARCA} Pan integración ${corrida}`,
      unidad_medida: 'unidad',
      ...cambios,
    })
    if (respuesta.json.data?.id_producto) creados.push(respuesta.json.data.id_producto)
    return respuesta
  }

  const listar = (filtro = '') =>
    $fetch<{ success: boolean; total: number; data: { id_producto: number }[] }>(`/api/productos${filtro}`)

  describe('RF-01 · Registro de producto', () => {
    it('IP-01 crea un producto con valores por defecto', async () => {
      const { status, json } = await crearPorApi({ categoria: 'QA' })

      expect(status).toBe(201)
      expect(json.mensaje).toBe('Producto creado exitosamente')
      expect(json.data).toMatchObject({ stock_actual: 0, stock_minimo: 0, estado: true, categoria: 'QA' })
      id = json.data.id_producto
    })

    it('IP-02 el producto aparece en el listado general y en el de activos, no en inactivos', async () => {
      const ids = async (filtro: string) => (await listar(filtro)).data.map((p) => p.id_producto)

      expect(await ids('')).toContain(id)
      expect(await ids('?estado=true')).toContain(id)
      expect(await ids('?estado=false')).not.toContain(id)
    })

    it('IP-03 el total coincide con la cantidad de productos devueltos', async () => {
      const json = await listar()
      expect(json.total).toBe(json.data.length)
    })

    it('IP-04 rechaza datos inválidos indicando el campo', async () => {
      const { status, json } = await crearPorApi({ nombre: '', stock_actual: -1 })

      expect(status).toBe(400)
      expect(json.message).toContain('Error de validaci')
      expect(json.data.map((d: { campo: string }) => d.campo)).toEqual(expect.arrayContaining(['nombre', 'stock_actual']))
    })

    // D-11 (corregido)
    it('IP-05 rechaza nombre de producto con solo espacios', async () => {
      const { status } = await crearPorApi({ nombre: '   ' })
      expect(status).toBe(400)
    })
  })

  describe('RF-03 · Actualización de datos', () => {
    it('IP-06 actualiza nombre (sin espacios externos) y stock', async () => {
      const { status, json } = await pedir('PUT', `/api/productos/${id}`, {
        nombre: `  ${MARCA} Pan editado ${corrida}  `,
        stock_actual: 40,
      })

      expect(status).toBe(200)
      expect(json.data).toMatchObject({ nombre: `${MARCA} Pan editado ${corrida}`, stock_actual: 40 })
    })

    it('IP-07 guarda la categoría vacía como null', async () => {
      const { json } = await pedir('PUT', `/api/productos/${id}`, { categoria: '' })
      expect(json.data.categoria).toBeNull()
    })

    it.each([
      ['IP-08', 'cuerpo vacío', `/api/productos/{id}`, {}, 400],
      ['IP-09', 'ID no numérico', '/api/productos/abc', { stock_actual: 1 }, 400],
      ['IP-10', 'producto inexistente', '/api/productos/999999999', { stock_actual: 1 }, 404],
    ])('%s rechaza %s', async (_id, _caso, ruta, body, estado) => {
      const { status } = await pedir('PUT', ruta.replace('{id}', String(id)), body)
      expect(status).toBe(estado)
    })
  })

  describe('RF-04 · Baja y reactivación', () => {
    it('IP-11 da de baja el producto', async () => {
      const { status, json } = await pedir('DELETE', `/api/productos/${id}`)

      expect(status).toBe(200)
      expect(json.data.estado).toBe(false)
      expect((await listar('?estado=false')).data.map((p) => p.id_producto)).toContain(id)
    })

    it('IP-12 rechaza dar de baja dos veces', async () => {
      const { status, json } = await pedir('DELETE', `/api/productos/${id}`)

      expect(status).toBe(400)
      expect(json.message).toContain('ya se encuentra dado de baja')
    })

    it('IP-13 rechaza modificar un producto dado de baja', async () => {
      const { status, json } = await pedir('PUT', `/api/productos/${id}`, { stock_actual: 1 })

      expect(status).toBe(400)
      expect(json.message).toContain('dado de baja')
    })

    it('IP-14 reactiva el producto', async () => {
      const { status, json } = await pedir('PATCH', `/api/productos/${id}/reactivar`)

      expect(status).toBe(200)
      expect(json.data.estado).toBe(true)
    })

    it('IP-15 rechaza reactivar un producto activo', async () => {
      const { status, json } = await pedir('PATCH', `/api/productos/${id}/reactivar`)

      expect(status).toBe(400)
      expect(json.message).toContain('ya se encuentra activo')
    })

    it.each([
      ['IP-16', 'DELETE', '/api/productos/999999999', 404],
      ['IP-17', 'DELETE', '/api/productos/0', 400],
      ['IP-18', 'PATCH', '/api/productos/999999999/reactivar', 404],
    ])('%s %s %s responde %i', async (_id, metodo, ruta, estado) => {
      const { status } = await pedir(metodo, ruta)
      expect(status).toBe(estado)
    })
  })

  describe('RF-05 · Listado en tiempo real de Productos', () => {
    // La clave pública no tiene permiso de lectura sobre producto, así que el aviso llega
    // sin datos (`new` vacío). Basta con que llegue: ListadoProductos.ts solo lo usa para
    // volver a pedir la lista al servidor.
    it('IP-19 notifica por Supabase Realtime (clave pública) cuando se crea un producto', async () => {
      const publico = crearClientePublico()
      const eventos: string[] = []

      const canal = publico
        .channel(`qa-realtime-${corrida}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'producto' }, (carga) => {
          eventos.push(carga.eventType)
        })

      await new Promise<void>((resolver, rechazar) => {
        const limite = setTimeout(() => rechazar(new Error('No se pudo suscribir al canal de tiempo real')), 10_000)
        canal.subscribe((estado) => {
          if (estado === 'SUBSCRIBED') {
            clearTimeout(limite)
            resolver()
          }
        })
      })

      // Supabase tarda un momento en empezar a enviar cambios después de SUBSCRIBED.
      await new Promise((r) => setTimeout(r, 2_000))

      try {
        await crearPorApi({ nombre: `${MARCA} Pan realtime ${corrida}` })

        const limite = Date.now() + 10_000
        while (!eventos.length && Date.now() < limite) {
          await new Promise((r) => setTimeout(r, 200))
        }

        expect(eventos).toContain('INSERT')
      } finally {
        await publico.removeChannel(canal)
      }
    })

    it('IP-20 la clave pública no puede leer la tabla producto directamente', async () => {
      const { data, error } = await crearClientePublico().from('producto').select('id_producto').limit(1)

      expect(data).toBeNull()
      expect(error?.code).toBe('42501')
    })
  })
})
