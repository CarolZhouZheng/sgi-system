import { beforeEach, describe, expect, it, vi } from 'vitest'

// Simulación del cliente de Supabase usado por PedidoRepository.crearPedido.
// `respuestas` permite decidir qué devuelve cada operación en cada prueba.
type Resultado = { data: unknown; error: { message: string } | null }

const respuestas = {
  insertPedido: (): Resultado => ({ data: { id_pedido: 500 }, error: null }),
  insertDetalles: (): Resultado => ({ data: [{ id_detalle_pedido: 1 }], error: null }),
  borrar: (_tabla: string): { error: { message: string } | null } => ({ error: null }),
}
const insertados: Record<string, unknown[]> = {}
const borrados: string[] = []

const from = vi.fn((tabla: string) => ({
  insert: (filas: unknown) => {
    insertados[tabla] = [...(insertados[tabla] || []), filas]
    const resultado = tabla === 'pedido' ? respuestas.insertPedido() : respuestas.insertDetalles()
    return {
      select: () => ({
        single: async () => resultado,
        then: (resolver: (valor: Resultado) => void) => resolver(resultado),
      }),
    }
  },
  delete: () => ({
    eq: async () => {
      borrados.push(tabla)
      return respuestas.borrar(tabla)
    },
  }),
}))

vi.mock('../../server/utils/supabase', () => ({
  supabase: { from: (tabla: string) => from(tabla) },
}))

import { PedidoRepository } from '../../server/repositories/pedido.repository'

const datos = {
  id_destinatario: 1,
  id_usuario: 1,
  fecha_entrega: null,
  prioridad: 'NORMAL',
  encargado_entrega: null,
  detalles: [{ id_producto: 10, cantidad: 3 }],
}

describe('RF-02 · PedidoRepository.crearPedido (D-02)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const tabla of Object.keys(insertados)) delete insertados[tabla]
    borrados.length = 0
    respuestas.insertPedido = () => ({ data: { id_pedido: 500 }, error: null })
    respuestas.insertDetalles = () => ({ data: [{ id_detalle_pedido: 1 }], error: null })
    respuestas.borrar = () => ({ error: null })
  })

  it('guarda la cabecera y luego los detalles con cantidad_entregada 0', async () => {
    await expect(PedidoRepository.crearPedido(datos)).resolves.toEqual({ id_pedido: 500 })

    expect(insertados.pedido).toEqual([
      expect.objectContaining({ id_destinatario: 1, prioridad: 'NORMAL', estado: 'PENDIENTE' }),
    ])
    expect(insertados.detalle_pedido).toEqual([[{ id_pedido: 500, id_producto: 10, cantidad: 3, cantidad_entregada: 0 }]])
    expect(borrados).toEqual([])
  })

  it('no inserta nada si el pedido no trae productos', async () => {
    await expect(PedidoRepository.crearPedido({ ...datos, detalles: [] }))
      .rejects.toThrow('El pedido debe contener al menos un producto.')
    expect(from).not.toHaveBeenCalled()
  })

  it('informa el error si falla la cabecera y no intenta guardar detalles', async () => {
    respuestas.insertPedido = () => ({ data: null, error: { message: 'violates foreign key' } })

    await expect(PedidoRepository.crearPedido(datos)).rejects.toThrow('Error al registrar cabecera del pedido')
    expect(insertados.detalle_pedido).toBeUndefined()
  })

  it('si fallan los detalles, borra detalles y cabecera y avisa que se revirtió', async () => {
    respuestas.insertDetalles = () => ({ data: null, error: { message: 'violates check constraint' } })

    await expect(PedidoRepository.crearPedido(datos)).rejects.toThrow('Operación revertida')
    expect(borrados).toEqual(['detalle_pedido', 'pedido'])
  })

  // D-02 (corregido en ronda 9, commit e682d9a): si la limpieza falla, se informa.
  it('si la limpieza también falla, informa que no se pudo revertir e indica el pedido', async () => {
    respuestas.insertDetalles = () => ({ data: null, error: { message: 'violates check constraint' } })
    respuestas.borrar = (tabla) => (tabla === 'pedido' ? { error: { message: 'sin conexión' } } : { error: null })

    await expect(PedidoRepository.crearPedido(datos)).rejects.toThrow(/no se pudo revertir.*#500.*pedido \(sin conexión\)/)
  })

  it('si falla solo el borrado de los detalles, también lo informa', async () => {
    respuestas.insertDetalles = () => ({ data: null, error: { message: 'violates check constraint' } })
    respuestas.borrar = (tabla) => (tabla === 'detalle_pedido' ? { error: { message: 'timeout' } } : { error: null })

    await expect(PedidoRepository.crearPedido(datos)).rejects.toThrow(/no se pudo revertir.*detalles \(timeout\)/)
  })
})
