import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CrearPedidoSchema } from '../../../server/dtos/pedido.dto'

const pedidoValido = {
  id_destinatario: 1,
  id_usuario: 1,
  fecha_entrega: '2026-10-10',
  prioridad: 'ALTA',
  encargado_entrega: 'Luis Mora',
  detalles: [
    { id_producto: 1, cantidad: 10 },
    { id_producto: 2, cantidad: 2.5 },
  ],
}

const mensajes = (datos: unknown) => {
  const resultado = CrearPedidoSchema.safeParse(datos)
  return resultado.success ? [] : resultado.error.issues.map((issue) => issue.message)
}

describe('RF-02 · CrearPedidoSchema', () => {
  // La validación de fecha depende de "hoy": se fija el reloj para que las pruebas no caduquen.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 3, 12, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('acepta un pedido completo', () => {
    expect(CrearPedidoSchema.safeParse(pedidoValido).success).toBe(true)
  })

  it('asigna prioridad NORMAL por defecto', () => {
    const { prioridad, ...sinPrioridad } = pedidoValido
    const resultado = CrearPedidoSchema.parse(sinPrioridad)
    expect(resultado.prioridad).toBe('NORMAL')
  })

  it('convierte IDs y cantidades enviados como texto a número', () => {
    const resultado = CrearPedidoSchema.parse({
      ...pedidoValido,
      id_destinatario: '3',
      id_usuario: '4',
      detalles: [{ id_producto: '5', cantidad: '7.5' }],
    })
    expect(resultado.id_destinatario).toBe(3)
    expect(resultado.id_usuario).toBe(4)
    expect(resultado.detalles[0]).toEqual({ id_producto: 5, cantidad: 7.5 })
  })

  it('acepta fecha_entrega y encargado_entrega nulos u omitidos', () => {
    expect(CrearPedidoSchema.safeParse({ ...pedidoValido, fecha_entrega: null, encargado_entrega: null }).success).toBe(true)
    const { fecha_entrega, encargado_entrega, ...sinOpcionales } = pedidoValido
    expect(CrearPedidoSchema.safeParse(sinOpcionales).success).toBe(true)
  })

  it('rechaza pedido sin productos', () => {
    expect(mensajes({ ...pedidoValido, detalles: [] })).toContain('El pedido debe contener al menos un producto.')
  })

  it.each([0, -3])('rechaza cantidad %d', (cantidad) => {
    expect(mensajes({ ...pedidoValido, detalles: [{ id_producto: 1, cantidad }] }))
      .toContain('La cantidad debe ser mayor que cero.')
  })

  it('rechaza productos repetidos en el detalle', () => {
    const detalles = [
      { id_producto: 1, cantidad: 2 },
      { id_producto: 1, cantidad: 3 },
    ]
    expect(mensajes({ ...pedidoValido, detalles }))
      .toContain('No repitas productos; combina sus cantidades en una sola línea.')
  })

  it.each([0, -1, 1.5])('rechaza id_destinatario inválido (%s)', (id) => {
    expect(mensajes({ ...pedidoValido, id_destinatario: id }).length).toBeGreaterThan(0)
  })

  it('rechaza pedido sin destinatario seleccionado (null del formulario)', () => {
    expect(CrearPedidoSchema.safeParse({ ...pedidoValido, id_destinatario: null }).success).toBe(false)
  })

  it('rechaza id_usuario inválido', () => {
    expect(mensajes({ ...pedidoValido, id_usuario: 0 })).toContain('Indica un usuario válido.')
  })

  it('rechaza producto sin seleccionar', () => {
    expect(mensajes({ ...pedidoValido, detalles: [{ id_producto: 0, cantidad: 1 }] }))
      .toContain('Selecciona un producto válido.')
  })

  it.each(['10/10/2026', '2026-13-01', 'mañana'])('rechaza fecha_entrega con formato inválido (%s)', (fecha) => {
    expect(CrearPedidoSchema.safeParse({ ...pedidoValido, fecha_entrega: fecha }).success).toBe(false)
  })

  it('rechaza encargado_entrega de más de 150 caracteres', () => {
    expect(CrearPedidoSchema.safeParse({ ...pedidoValido, encargado_entrega: 'a'.repeat(151) }).success).toBe(false)
  })

  // D-05 (corregido): prioridad limitada al catálogo.
  it.each(['BAJA', 'NORMAL', 'ALTA', 'URGENTE'])('acepta prioridad %s', (prioridad) => {
    expect(CrearPedidoSchema.safeParse({ ...pedidoValido, prioridad }).success).toBe(true)
  })

  it.each(['alta', ' urgente '])('normaliza prioridad en minúsculas o con espacios (%j)', (prioridad) => {
    expect(CrearPedidoSchema.parse({ ...pedidoValido, prioridad }).prioridad).toBe(prioridad.trim().toUpperCase())
  })

  it.each(['CUALQUIERA', ''])('rechaza prioridad fuera del catálogo (%j)', (prioridad) => {
    expect(CrearPedidoSchema.safeParse({ ...pedidoValido, prioridad }).success).toBe(false)
  })

  // D-09 (corregido): mensaje en español para prioridad inválida.
  it('muestra el mensaje en español para prioridad inválida', () => {
    expect(mensajes({ ...pedidoValido, prioridad: 'CUALQUIERA' }))
      .toContain('La prioridad debe ser BAJA, NORMAL, ALTA o URGENTE.')
  })

  // D-06 (corregido): fecha de entrega en el pasado.
  it.each(['2020-01-01', '2026-10-02'])('rechaza fecha_entrega en el pasado (%s)', (fecha) => {
    expect(mensajes({ ...pedidoValido, fecha_entrega: fecha }))
      .toContain('La fecha de entrega no puede ser anterior a la fecha actual.')
  })

  it('trata fecha_entrega vacía ("") como sin fecha', () => {
    expect(CrearPedidoSchema.parse({ ...pedidoValido, fecha_entrega: '' }).fecha_entrega).toBeNull()
  })

  it('acepta fecha_entrega de hoy', () => {
    expect(CrearPedidoSchema.safeParse({ ...pedidoValido, fecha_entrega: '2026-10-03' }).success).toBe(true)
  })

  // D-10 (corregido): "hoy" se calcula en la zona horaria de Costa Rica.
  it('acepta fecha_entrega de hoy (Costa Rica) aunque el servidor esté en UTC', () => {
    const zonaOriginal = process.env.TZ
    process.env.TZ = 'UTC'
    try {
      vi.setSystemTime(new Date('2026-10-04T01:00:00Z')) // 03/10/2026 7:00 p. m. en Costa Rica
      expect(CrearPedidoSchema.safeParse({ ...pedidoValido, fecha_entrega: '2026-10-03' }).success).toBe(true)
    } finally {
      if (zonaOriginal === undefined) delete process.env.TZ
      else process.env.TZ = zonaOriginal
    }
  })
})
