import { describe, expect, it } from 'vitest'
import { CrearDestinatarioDTO } from '../../server/dtos/destinatario.dto'

const destinatarioValido = {
  nombre_empresa: 'Panadería El Trigo',
  telefono: '8888-8888',
  correo: 'contacto@eltrigo.com',
  direccion: 'Heredia centro',
}

describe('RF-12 · CrearDestinatarioDTO', () => {
  it('acepta un destinatario completo', () => {
    expect(CrearDestinatarioDTO.safeParse(destinatarioValido).success).toBe(true)
  })

  it('acepta solo el nombre de la empresa (campos opcionales omitidos)', () => {
    expect(CrearDestinatarioDTO.safeParse({ nombre_empresa: 'Soda Doña Ana' }).success).toBe(true)
  })

  it('acepta correo vacío (formulario sin correo)', () => {
    const resultado = CrearDestinatarioDTO.safeParse({ ...destinatarioValido, correo: '' })
    expect(resultado.success).toBe(true)
  })

  it('rechaza nombre de empresa vacío con mensaje claro', () => {
    const resultado = CrearDestinatarioDTO.safeParse({ ...destinatarioValido, nombre_empresa: '' })
    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues[0]?.message).toBe('El nombre de la empresa es obligatorio')
  })

  it('rechaza cuando falta nombre_empresa', () => {
    const { nombre_empresa, ...sinNombre } = destinatarioValido
    expect(CrearDestinatarioDTO.safeParse(sinNombre).success).toBe(false)
  })

  it('rechaza correo con formato inválido', () => {
    const resultado = CrearDestinatarioDTO.safeParse({ ...destinatarioValido, correo: 'no-es-correo' })
    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues[0]?.message).toBe('Debe ser un correo válido')
  })

  it.each([
    ['nombre_empresa', 151],
    ['telefono', 31],
    ['direccion', 256],
  ])('rechaza %s que excede el largo de la columna (%i caracteres)', (campo, largo) => {
    const resultado = CrearDestinatarioDTO.safeParse({ ...destinatarioValido, [campo]: 'a'.repeat(largo) })
    expect(resultado.success).toBe(false)
  })

  it('acepta nombre_empresa en el límite exacto de 150 caracteres', () => {
    const resultado = CrearDestinatarioDTO.safeParse({ ...destinatarioValido, nombre_empresa: 'a'.repeat(150) })
    expect(resultado.success).toBe(true)
  })

  // D-04 (corregido): nombre de solo espacios.
  it('rechaza nombre de empresa con solo espacios', () => {
    const resultado = CrearDestinatarioDTO.safeParse({ ...destinatarioValido, nombre_empresa: '   ' })
    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues[0]?.message).toBe('El nombre de la empresa es obligatorio')
  })

  it('quita los espacios al inicio y al final del nombre', () => {
    const resultado = CrearDestinatarioDTO.parse({ ...destinatarioValido, nombre_empresa: '  Soda Doña Ana  ' })
    expect(resultado.nombre_empresa).toBe('Soda Doña Ana')
  })
})
