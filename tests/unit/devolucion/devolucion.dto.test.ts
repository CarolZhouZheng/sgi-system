import { describe, expect, it } from 'vitest'
import {
  CrearDevolucionSchema,
  CambiarEstadoDevolucionSchema,
  DevolucionIdParamSchema,
  FiltrosDevolucionSchema,
  ESTADOS_DEVOLUCION_VALIDOS,
} from '../../../server/dtos/devolucion.dto'

describe('RF-11 · Devolución DTO Unitario (Armando)', () => {
  describe('CrearDevolucionSchema', () => {
    it('valida con éxito un payload con todos los campos válidos', () => {
      const payload = {
        id_pedido: 10,
        id_producto: 5,
        id_lote: 2,
        id_usuario: 1,
        cantidad_devuelta: 15,
        motivo: 'Producto con empaque defectuoso',
        fecha: '2026-10-28',
        estado: 'PENDIENTE',
        observaciones: 'El cliente reportó el detalle al recibir',
      }
      const res = CrearDevolucionSchema.safeParse(payload)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.id_pedido).toBe(10)
        expect(res.data.id_producto).toBe(5)
        expect(res.data.id_lote).toBe(2)
        expect(res.data.id_usuario).toBe(1)
        expect(res.data.cantidad_devuelta).toBe(15)
        expect(res.data.estado).toBe('PENDIENTE')
        expect(res.data.motivo).toBe('Producto con empaque defectuoso')
      }
    })

    it('asigna PENDIENTE por defecto si no se especifica estado', () => {
      const payload = {
        id_pedido: 1,
        id_producto: 2,
        cantidad_devuelta: 3,
        motivo: 'Pan en mal estado',
      }
      const res = CrearDevolucionSchema.safeParse(payload)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.estado).toBe('PENDIENTE')
      }
    })

    it('permite id_lote nulo u opcional', () => {
      const res1 = CrearDevolucionSchema.safeParse({
        id_pedido: 1,
        id_producto: 2,
        id_lote: null,
        cantidad_devuelta: 5,
        motivo: 'Error de despacho',
      })
      expect(res1.success).toBe(true)

      const res2 = CrearDevolucionSchema.safeParse({
        id_pedido: 1,
        id_producto: 2,
        cantidad_devuelta: 5,
        motivo: 'Error de despacho',
      })
      expect(res2.success).toBe(true)
    })

    it('coacciona números expresados en strings (coerce)', () => {
      const payload = {
        id_pedido: '15',
        id_producto: '4',
        id_usuario: '3',
        cantidad_devuelta: '10.5',
        motivo: 'Devolución parcial',
      }
      const res = CrearDevolucionSchema.safeParse(payload)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.id_pedido).toBe(15)
        expect(res.data.id_producto).toBe(4)
        expect(res.data.id_usuario).toBe(3)
        expect(res.data.cantidad_devuelta).toBe(10.5)
      }
    })

    it('rechaza si falta id_pedido o id_producto', () => {
      const resSinPedido = CrearDevolucionSchema.safeParse({
        id_producto: 2,
        cantidad_devuelta: 5,
        motivo: 'Motivo de prueba',
      })
      expect(resSinPedido.success).toBe(false)

      const resSinProd = CrearDevolucionSchema.safeParse({
        id_pedido: 1,
        cantidad_devuelta: 5,
        motivo: 'Motivo de prueba',
      })
      expect(resSinProd.success).toBe(false)
    })

    it('rechaza IDs menores o iguales a cero o no enteros', () => {
      expect(
        CrearDevolucionSchema.safeParse({
          id_pedido: 0,
          id_producto: 1,
          cantidad_devuelta: 1,
          motivo: 'Test motivo',
        }).success
      ).toBe(false)

      expect(
        CrearDevolucionSchema.safeParse({
          id_pedido: -5,
          id_producto: 1,
          cantidad_devuelta: 1,
          motivo: 'Test motivo',
        }).success
      ).toBe(false)

      expect(
        CrearDevolucionSchema.safeParse({
          id_pedido: 1.5,
          id_producto: 1,
          cantidad_devuelta: 1,
          motivo: 'Test motivo',
        }).success
      ).toBe(false)
    })

    it('rechaza cantidad_devuelta menor o igual a cero', () => {
      expect(
        CrearDevolucionSchema.safeParse({
          id_pedido: 1,
          id_producto: 1,
          cantidad_devuelta: 0,
          motivo: 'Test motivo',
        }).success
      ).toBe(false)

      expect(
        CrearDevolucionSchema.safeParse({
          id_pedido: 1,
          id_producto: 1,
          cantidad_devuelta: -10,
          motivo: 'Test motivo',
        }).success
      ).toBe(false)
    })

    it('valida longitud del motivo (min 3, max 150)', () => {
      const corto = CrearDevolucionSchema.safeParse({
        id_pedido: 1,
        id_producto: 1,
        cantidad_devuelta: 5,
        motivo: 'No',
      })
      expect(corto.success).toBe(false)

      const largo = CrearDevolucionSchema.safeParse({
        id_pedido: 1,
        id_producto: 1,
        cantidad_devuelta: 5,
        motivo: 'a'.repeat(151),
      })
      expect(largo.success).toBe(false)

      const valido = CrearDevolucionSchema.safeParse({
        id_pedido: 1,
        id_producto: 1,
        cantidad_devuelta: 5,
        motivo: 'Producto en mal estado reportado por cliente',
      })
      expect(valido.success).toBe(true)
    })

    it('valida formato de fecha AAAA-MM-DD', () => {
      const fechaValida = CrearDevolucionSchema.safeParse({
        id_pedido: 1,
        id_producto: 1,
        cantidad_devuelta: 5,
        motivo: 'Prueba fecha',
        fecha: '2026-10-28',
      })
      expect(fechaValida.success).toBe(true)

      const fechaInvalida = CrearDevolucionSchema.safeParse({
        id_pedido: 1,
        id_producto: 1,
        cantidad_devuelta: 5,
        motivo: 'Prueba fecha',
        fecha: '28/10/2026',
      })
      expect(fechaInvalida.success).toBe(false)
    })

    it('rechaza estados no válidos', () => {
      const estadoInvalido = CrearDevolucionSchema.safeParse({
        id_pedido: 1,
        id_producto: 1,
        cantidad_devuelta: 5,
        motivo: 'Prueba estado',
        estado: 'CANCELADA',
      })
      expect(estadoInvalido.success).toBe(false)

      for (const estado of ESTADOS_DEVOLUCION_VALIDOS) {
        const ok = CrearDevolucionSchema.safeParse({
          id_pedido: 1,
          id_producto: 1,
          cantidad_devuelta: 5,
          motivo: 'Prueba estado',
          estado,
        })
        expect(ok.success).toBe(true)
      }
    })

    it('valida límite de 500 caracteres en observaciones', () => {
      const excesivo = CrearDevolucionSchema.safeParse({
        id_pedido: 1,
        id_producto: 1,
        cantidad_devuelta: 5,
        motivo: 'Motivo prueba',
        observaciones: 'x'.repeat(501),
      })
      expect(excesivo.success).toBe(false)
    })
  })

  describe('CambiarEstadoDevolucionSchema', () => {
    it('permite cambiar a APROBADA o RECHAZADA con observaciones opcionales', () => {
      const resAprobada = CambiarEstadoDevolucionSchema.safeParse({
        estado: 'APROBADA',
        observaciones: 'Reingresado a inventario correctamente',
      })
      expect(resAprobada.success).toBe(true)

      const resRechazada = CambiarEstadoDevolucionSchema.safeParse({
        estado: 'RECHAZADA',
      })
      expect(resRechazada.success).toBe(true)
    })

    it('rechaza estados no permitidos', () => {
      const invalido = CambiarEstadoDevolucionSchema.safeParse({
        estado: 'ARCHIVADO',
      })
      expect(invalido.success).toBe(false)
    })
  })

  describe('DevolucionIdParamSchema', () => {
    it('coacciona y valida IDs numéricos enteros positivos', () => {
      const res = DevolucionIdParamSchema.safeParse({ id: '25' })
      expect(res.success).toBe(true)
      if (res.success) expect(res.data.id).toBe(25)
    })

    it('rechaza valores no numéricos o menores o iguales a cero', () => {
      expect(DevolucionIdParamSchema.safeParse({ id: 'abc' }).success).toBe(false)
      expect(DevolucionIdParamSchema.safeParse({ id: '0' }).success).toBe(false)
      expect(DevolucionIdParamSchema.safeParse({ id: '-1' }).success).toBe(false)
    })
  })

  describe('FiltrosDevolucionSchema', () => {
    it('aplica límite default de 200 cuando se envían filtros vacíos', () => {
      const res = FiltrosDevolucionSchema.safeParse({})
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.limite).toBe(200)
        expect(res.data.estado).toBeUndefined()
      }
    })

    it('normaliza estado a mayúsculas y cadenas vacías a undefined', () => {
      const res = FiltrosDevolucionSchema.safeParse({
        estado: '  pendiente  ',
      })
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.estado).toBe('PENDIENTE')
      }

      const vacio = FiltrosDevolucionSchema.safeParse({
        estado: '   ',
      })
      expect(vacio.success).toBe(true)
      if (vacio.success) {
        expect(vacio.data.estado).toBeUndefined()
      }
    })

    it('valida rango de fechas y rechaza cuando desde > hasta', () => {
      const correcto = FiltrosDevolucionSchema.safeParse({
        desde: '2026-10-01',
        hasta: '2026-10-15',
      })
      expect(correcto.success).toBe(true)

      const invertido = FiltrosDevolucionSchema.safeParse({
        desde: '2026-10-20',
        hasta: '2026-10-10',
      })
      expect(invertido.success).toBe(false)
      if (!invertido.success) {
        expect(invertido.error.issues[0].message).toContain('La fecha \'desde\' no puede ser posterior')
      }
    })

    it('valida límites mínimo (1) y máximo (1000)', () => {
      expect(FiltrosDevolucionSchema.safeParse({ limite: 1 }).success).toBe(true)
      expect(FiltrosDevolucionSchema.safeParse({ limite: 1000 }).success).toBe(true)
      expect(FiltrosDevolucionSchema.safeParse({ limite: 0 }).success).toBe(false)
      expect(FiltrosDevolucionSchema.safeParse({ limite: 1001 }).success).toBe(false)
    })
  })
})

