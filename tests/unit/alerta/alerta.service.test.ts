import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../server/repositories/alerta.repository', () => ({
  AlertaRepository: {
    obtenerDiasConfiguracion: vi.fn(),
    obtenerLotesCandidatos: vi.fn(),
  },
}))

import { AlertaRepository } from '../../../server/repositories/alerta.repository'
import { AlertaService } from '../../../server/services/alerta.service'

const repo = vi.mocked(AlertaRepository)

describe('RF-06 · AlertaService.calcularDiasDiferencia', () => {
  it('calcula 0 días si la fecha de vencimiento es la misma de hoy', () => {
    const diff = AlertaService.calcularDiasDiferencia('2026-10-12', '2026-10-12')
    expect(diff).toBe(0)
  })

  it('calcula días positivos para fechas futuras', () => {
    const diff = AlertaService.calcularDiasDiferencia('2026-10-15', '2026-10-12')
    expect(diff).toBe(3)
  })

  it('calcula días negativos para fechas pasadas (lotes vencidos)', () => {
    const diff = AlertaService.calcularDiasDiferencia('2026-10-10', '2026-10-12')
    expect(diff).toBe(-2)
  })
})

describe('RF-06 · AlertaService.obtenerAlertasVencimiento (Lógica de Negocio)', () => {
  const fechaHoyMock = '2026-10-12'

  const mockLotes = [
    {
      id_lote: 1,
      numero_lote: 'LOT-VENCIDO-AYER',
      cantidad: 15,
      fecha_produccion: '2026-10-01',
      fecha_vencimiento: '2026-10-11', // Venció hace 1 día
      estado: true,
      id_producto: 101,
      producto: {
        id_producto: 101,
        nombre: 'Pan Blanco',
        categoria: 'Panadería',
        unidad_medida: 'bolsa',
      },
    },
    {
      id_lote: 2,
      numero_lote: 'LOT-VENCIDO-2DIAS',
      cantidad: 10,
      fecha_produccion: '2026-10-01',
      fecha_vencimiento: '2026-10-10', // Venció hace 2 días
      estado: true,
      id_producto: 101,
      producto: [
        {
          id_producto: 101,
          nombre: 'Pan Blanco',
          categoria: 'Panadería',
          unidad_medida: 'bolsa',
        },
      ],
    },
    {
      id_lote: 3,
      numero_lote: 'LOT-HOY',
      cantidad: 8,
      fecha_produccion: '2026-10-05',
      fecha_vencimiento: '2026-10-12', // Vence hoy (0 días)
      estado: true,
      id_producto: 102,
      producto: {
        id_producto: 102,
        nombre: 'Baguette Rústico',
        categoria: 'Especiales',
        unidad_medida: 'unidad',
      },
    },
    {
      id_lote: 4,
      numero_lote: 'LOT-MANANA',
      cantidad: 20,
      fecha_produccion: '2026-10-08',
      fecha_vencimiento: '2026-10-13', // Vence mañana (1 día)
      estado: true,
      id_producto: 103,
      producto: {
        id_producto: 103,
        nombre: 'Donas de Chocolate',
        categoria: 'Repostería',
        unidad_medida: 'docena',
      },
    },
    {
      id_lote: 5,
      numero_lote: 'LOT-DOS-DIAS',
      cantidad: 12,
      fecha_produccion: '2026-10-08',
      fecha_vencimiento: '2026-10-14', // Vence en 2 días
      estado: true,
      id_producto: 104,
      producto: null, // Producto sin relación poblada (fallback a ID)
    },
    {
      id_lote: 6,
      numero_lote: 'LOT-TRES-DIAS',
      cantidad: 25,
      fecha_produccion: '2026-10-08',
      fecha_vencimiento: '2026-10-15', // Vence en 3 días (urgencia media)
      estado: true,
      id_producto: 105,
      producto: {
        id_producto: 105,
        nombre: 'Croissant Mantequilla',
        categoria: 'Panadería',
        unidad_medida: 'unidad',
      },
    },
    {
      id_lote: 7,
      numero_lote: 'LOT-LEJOS',
      cantidad: 50,
      fecha_produccion: '2026-10-10',
      fecha_vencimiento: '2026-10-25', // Vence en 13 días (fuera de umbral 3)
      estado: true,
      id_producto: 106,
      producto: {
        id_producto: 106,
        nombre: 'Harina Fina Especial',
        categoria: 'Insumos',
        unidad_medida: 'kg',
      },
    },
  ]

  beforeEach(() => {
    vi.resetAllMocks()
    repo.obtenerDiasConfiguracion.mockResolvedValue(3)
    repo.obtenerLotesCandidatos.mockResolvedValue(mockLotes as never)
  })

  it('obtiene y clasifica correctamente los lotes según urgencia dentro del umbral por defecto (3 días)', async () => {
    const res = await AlertaService.obtenerAlertasVencimiento(undefined, fechaHoyMock)

    expect(repo.obtenerDiasConfiguracion).toHaveBeenCalledOnce()
    expect(repo.obtenerLotesCandidatos).toHaveBeenCalledOnce()

    // Debe incluir los 6 lotes que están <= 3 días y excluir LOT-LEJOS (13 días)
    expect(res.alertas).toHaveLength(6)
    expect(res.resumen.total).toBe(6)
    expect(res.resumen.total_vencidos).toBe(2)
    expect(res.resumen.total_por_vencer).toBe(4)
    expect(res.resumen.dias_umbral_alerta).toBe(3)

    // 1. Vencido hace 1 día
    const vencidoAyer = res.alertas.find((a) => a.numero_lote === 'LOT-VENCIDO-AYER')
    expect(vencidoAyer).toBeDefined()
    expect(vencidoAyer?.estado_vencimiento).toBe('VENCIDO')
    expect(vencidoAyer?.nivel_urgencia).toBe('CRITICO')
    expect(vencidoAyer?.dias_restantes).toBe(-1)
    expect(vencidoAyer?.mensaje).toBe('Venció hace 1 día')

    // 2. Vencido hace 2 días
    const vencidoDosDias = res.alertas.find((a) => a.numero_lote === 'LOT-VENCIDO-2DIAS')
    expect(vencidoDosDias?.mensaje).toBe('Venció hace 2 días')

    // 3. Vence hoy
    const hoy = res.alertas.find((a) => a.numero_lote === 'LOT-HOY')
    expect(hoy?.estado_vencimiento).toBe('POR_VENCER')
    expect(hoy?.nivel_urgencia).toBe('CRITICO')
    expect(hoy?.dias_restantes).toBe(0)
    expect(hoy?.mensaje).toBe('Vence hoy')

    // 4. Vence mañana (1 día)
    const manana = res.alertas.find((a) => a.numero_lote === 'LOT-MANANA')
    expect(manana?.estado_vencimiento).toBe('POR_VENCER')
    expect(manana?.nivel_urgencia).toBe('ALTO')
    expect(manana?.dias_restantes).toBe(1)
    expect(manana?.mensaje).toBe('Vence mañana (1 día)')

    // 5. Vence en 2 días
    const dosDias = res.alertas.find((a) => a.numero_lote === 'LOT-DOS-DIAS')
    expect(dosDias?.nivel_urgencia).toBe('ALTO')
    expect(dosDias?.mensaje).toBe('Vence en 2 días')
    // Verifica fallback de nombre si no hay producto poblado
    expect(dosDias?.nombre_producto).toBe('Producto #104')

    // 6. Vence en 3 días (urgencia media)
    const tresDias = res.alertas.find((a) => a.numero_lote === 'LOT-TRES-DIAS')
    expect(tresDias?.nivel_urgencia).toBe('MEDIO')
    expect(tresDias?.mensaje).toBe('Vence en 3 días')
  })

  it('ordena las alertas por días restantes de menor a mayor (más vencidos primero)', async () => {
    const res = await AlertaService.obtenerAlertasVencimiento(undefined, fechaHoyMock)
    const dias = res.alertas.map((a) => a.dias_restantes)
    const diasOrdenados = [...dias].sort((a, b) => a - b)
    expect(dias).toEqual(diasOrdenados)
  })

  it('permite personalizar el umbral mediante dias_anticipacion', async () => {
    const res = await AlertaService.obtenerAlertasVencimiento(
      { dias_anticipacion: 15 },
      fechaHoyMock
    )

    // Con umbral de 15 días, el LOT-LEJOS (13 días) también califica
    expect(res.alertas).toHaveLength(7)
    expect(res.resumen.dias_umbral_alerta).toBe(15)
    expect(repo.obtenerDiasConfiguracion).not.toHaveBeenCalled()
  })

  it('filtra solo lotes vencidos si se solicita solo_vencidos', async () => {
    const res = await AlertaService.obtenerAlertasVencimiento(
      { solo_vencidos: true },
      fechaHoyMock
    )

    expect(res.alertas).toHaveLength(2)
    expect(res.alertas.every((a) => a.estado_vencimiento === 'VENCIDO')).toBe(true)
    // El resumen total conserva el panorama general del inventario
    expect(res.resumen.total).toBe(6)
    expect(res.resumen.total_vencidos).toBe(2)
  })

  it('filtra solo lotes por vencer si se solicita solo_por_vencer', async () => {
    const res = await AlertaService.obtenerAlertasVencimiento(
      { solo_por_vencer: true },
      fechaHoyMock
    )

    expect(res.alertas).toHaveLength(4)
    expect(res.alertas.every((a) => a.estado_vencimiento === 'POR_VENCER')).toBe(true)
    expect(res.resumen.total).toBe(6)
  })
})
