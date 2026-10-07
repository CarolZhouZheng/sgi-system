import { describe, expect, it } from 'vitest'
import {
  ActualizarProductoSchema,
  CrearProductoSchema,
  ProductoIdParamSchema,
} from '../../../server/dtos/producto.dto'

const productoValido = {
  nombre: 'Pan baguette',
  descripcion: 'Pan francés',
  categoria: 'Panes',
  unidad_medida: 'unidad',
  stock_actual: 20,
  stock_minimo: 5,
  estado: true,
}

const mensajes = (schema: { safeParse: (d: unknown) => any }, datos: unknown): string[] => {
  const resultado = schema.safeParse(datos)
  return resultado.success ? [] : resultado.error.issues.map((issue: any) => issue.message)
}

describe('RF-01 · CrearProductoSchema', () => {
  it('acepta un producto completo', () => {
    expect(CrearProductoSchema.safeParse(productoValido).success).toBe(true)
  })

  it('asigna stock 0 y estado activo por defecto', () => {
    const resultado = CrearProductoSchema.parse({ nombre: 'Pan', unidad_medida: 'unidad' })
    expect(resultado).toMatchObject({ stock_actual: 0, stock_minimo: 0, estado: true })
  })

  it('acepta stock con decimales (kg, litros)', () => {
    expect(CrearProductoSchema.safeParse({ ...productoValido, stock_actual: 2.75 }).success).toBe(true)
  })

  it.each([
    ['nombre vacío', { nombre: '' }, 'El nombre es obligatorio'],
    ['nombre de 151 caracteres', { nombre: 'a'.repeat(151) }, 'El nombre no puede superar los 150 caracteres'],
    ['unidad de medida vacía', { unidad_medida: '' }, 'La unidad de medida es obligatoria'],
    ['unidad de medida de 31 caracteres', { unidad_medida: 'a'.repeat(31) }, 'La unidad de medida no puede superar los 30 caracteres'],
    ['categoría de 101 caracteres', { categoria: 'a'.repeat(101) }, 'La categoría no puede superar los 100 caracteres'],
    ['stock actual negativo', { stock_actual: -1 }, 'El stock actual no puede ser negativo'],
    ['stock mínimo negativo', { stock_minimo: -1 }, 'El stock mínimo no puede ser negativo'],
  ])('rechaza %s', (_caso, cambios, mensaje) => {
    expect(mensajes(CrearProductoSchema, { ...productoValido, ...cambios })).toContain(mensaje)
  })

  it('rechaza stock enviado como texto', () => {
    expect(CrearProductoSchema.safeParse({ ...productoValido, stock_actual: '5' }).success).toBe(false)
  })

  it('rechaza cuando faltan nombre y unidad de medida', () => {
    expect(CrearProductoSchema.safeParse({}).success).toBe(false)
  })

  // D-11 (corregido): nombre y unidad de solo espacios.
  it('rechaza nombre de producto con solo espacios', () => {
    expect(mensajes(CrearProductoSchema, { ...productoValido, nombre: '   ' })).toContain('El nombre es obligatorio')
  })

  it('rechaza unidad de medida con solo espacios', () => {
    expect(mensajes(CrearProductoSchema, { ...productoValido, unidad_medida: '   ' }))
      .toContain('La unidad de medida es obligatoria')
  })

  it('quita espacios externos de nombre, unidad, categoría y descripción', () => {
    const resultado = CrearProductoSchema.parse({
      ...productoValido,
      nombre: '  Pan  ',
      unidad_medida: ' kg ',
      categoria: ' Panes ',
      descripcion: ' Fresco ',
    })
    expect(resultado).toMatchObject({ nombre: 'Pan', unidad_medida: 'kg', categoria: 'Panes', descripcion: 'Fresco' })
  })
})

describe('RF-03/RF-04 · ProductoIdParamSchema', () => {
  it('convierte el ID de la URL a número', () => {
    expect(ProductoIdParamSchema.parse({ id: '15' })).toEqual({ id: 15 })
  })

  it.each([
    ['abc', 'El ID debe ser numérico'],
    ['1.5', 'El ID debe ser un número entero'],
    ['0', 'El ID debe ser un número positivo'],
    ['-3', 'El ID debe ser un número positivo'],
  ])('rechaza el ID %s', (id, mensaje) => {
    expect(mensajes(ProductoIdParamSchema, { id })).toContain(mensaje)
  })
})

describe('RF-03 · ActualizarProductoSchema', () => {
  it('acepta actualizar un solo campo', () => {
    expect(ActualizarProductoSchema.safeParse({ stock_actual: 10 }).success).toBe(true)
  })

  it('quita espacios al inicio y al final del nombre', () => {
    expect(ActualizarProductoSchema.parse({ nombre: '  Pan dulce  ' }).nombre).toBe('Pan dulce')
  })

  it('acepta descripción y categoría nulas (para borrarlas)', () => {
    expect(ActualizarProductoSchema.safeParse({ descripcion: null, categoria: null }).success).toBe(true)
  })

  it('rechaza un cuerpo vacío', () => {
    expect(mensajes(ActualizarProductoSchema, {})).toContain('Debe enviar al menos un campo para actualizar')
  })

  it('ignora el campo estado (la baja se hace con RF-04) y exige otro campo', () => {
    const resultado = ActualizarProductoSchema.safeParse({ estado: false })
    expect(resultado.success).toBe(false)
  })

  it.each([
    ['nombre de solo espacios', { nombre: '   ' }, 'El nombre no puede estar vacío'],
    ['unidad de medida vacía', { unidad_medida: ' ' }, 'La unidad de medida no puede estar vacía'],
    ['stock actual negativo', { stock_actual: -2 }, 'El stock actual no puede ser negativo'],
    ['stock mínimo como texto', { stock_minimo: '3' }, 'El stock mínimo debe ser numérico'],
  ])('rechaza %s', (_caso, datos, mensaje) => {
    expect(mensajes(ActualizarProductoSchema, datos)).toContain(mensaje)
  })
})
