import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../server/repositories/alerta.repository', () => ({
  AlertaRepository: {
    obtenerDiasConfiguracion: vi.fn(),
    obtenerLotesCandidatos: vi.fn(),
  },
}));

import { AlertaRepository } from '../../../server/repositories/alerta.repository';
import { AlertaService } from '../../../server/services/alerta.service';

const repo = vi.mocked(AlertaRepository);

describe('RF-06 · AlertaService.calcularDiasDiferencia', () => {
  it('calcula 0 días si la fecha de vencimiento es hoy', () => {
    const diff = AlertaService.calcularDiasDiferencia('2026-10-12', '2026-10-12');
    expect(diff).toBe(0);
  });

  it('calcula días positivos para fechas futuras', () => {
    const diff = AlertaService.calcularDiasDiferencia('2026-10-15', '2026-10-12');
    expect(diff).toBe(3);
  });

  it('calcula días negativos para fechas pasadas (lotes vencidos)', () => {
    const diff = AlertaService.calcularDiasDiferencia('2026-10-10', '2026-10-12');
    expect(diff).toBe(-2);
  });
});

describe('RF-06 · AlertaService.obtenerAlertasVencimiento', () => {
  const fechaHoyMock = '2026-10-12';

  const mockLotes = [
    {
      id_lote: 1,
      numero_lote: 'LOT-VENCIDO-1',
      cantidad: 15,
      fecha_produccion: '2026-10-01',
      fecha_vencimiento: '2026-10-10', // Venció hace 2 días
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
      numero_lote: 'LOT-HOY-2',
      cantidad: 8,
      fecha_produccion: '2026-10-05',
      fecha_vencimiento: '2026-10-12', // Vence hoy
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
      id_lote: 3,
      numero_lote: 'LOT-PRONTO-3',
      cantidad: 20,
      fecha_produccion: '2026-10-08',
      fecha_vencimiento: '2026-10-14', // Vence en 2 días (dentro del umbral de 3)
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
      id_lote: 4,
      numero_lote: 'LOT-LEJOS-4',
      cantidad: 50,
      fecha_produccion: '2026-10-10',
      fecha_vencimiento: '2026-10-25', // Vence en 13 días (fuera de umbral de 3)
      estado: true,
      id_producto: 104,
      producto: {
        id_producto: 104,
        nombre: 'Harina Fina Especial',
        categoria: 'Insumos',
        unidad_medida: 'kg',
      },
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    repo.obtenerDiasConfiguracion.mockResolvedValue(3);
    repo.obtenerLotesCandidatos.mockResolvedValue(mockLotes as never);
  });

  it('obtiene y clasifica correctamente los lotes vencidos y por vencer dentro del umbral', async () => {
    const res = await AlertaService.obtenerAlertasVencimiento(undefined, fechaHoyMock);

    expect(repo.obtenerDiasConfiguracion).toHaveBeenCalled();
    expect(repo.obtenerLotesCandidatos).toHaveBeenCalled();

    // Debe incluir LOT-1 (vencido), LOT-2 (hoy), LOT-3 (en 2 días), y excluir LOT-4 (en 13 días)
    expect(res.alertas).toHaveLength(3);
    expect(res.resumen.total).toBe(3);
    expect(res.resumen.total_vencidos).toBe(1);
    expect(res.resumen.total_por_vencer).toBe(2);
    expect(res.resumen.dias_umbral_alerta).toBe(3);

    const vencido = res.alertas.find((a) => a.numero_lote === 'LOT-VENCIDO-1');
    expect(vencido).toBeDefined();
    expect(vencido?.estado_vencimiento).toBe('VENCIDO');
    expect(vencido?.nivel_urgencia).toBe('CRITICO');
    expect(vencido?.dias_restantes).toBe(-2);
    expect(vencido?.mensaje).toBe('Venció hace 2 días');

    const venceHoy = res.alertas.find((a) => a.numero_lote === 'LOT-HOY-2');
    expect(venceHoy?.estado_vencimiento).toBe('POR_VENCER');
    expect(venceHoy?.nivel_urgencia).toBe('CRITICO');
    expect(venceHoy?.dias_restantes).toBe(0);
    expect(venceHoy?.mensaje).toBe('Vence hoy');

    const venceEnDos = res.alertas.find((a) => a.numero_lote === 'LOT-PRONTO-3');
    expect(venceEnDos?.estado_vencimiento).toBe('POR_VENCER');
    expect(venceEnDos?.nivel_urgencia).toBe('ALTO');
    expect(venceEnDos?.dias_restantes).toBe(2);
  });

  it('permite personalizar los días de anticipación mediante parámetros', async () => {
    const res = await AlertaService.obtenerAlertasVencimiento(
      { dias_anticipacion: 15 },
      fechaHoyMock
    );

    // Con umbral de 15 días, el LOT-4 (vence en 13 días) sí debe ser incluido
    expect(res.alertas).toHaveLength(4);
    expect(res.resumen.dias_umbral_alerta).toBe(15);
    expect(repo.obtenerDiasConfiguracion).not.toHaveBeenCalled();
  });

  it('filtra solo lotes vencidos si se solicita solo_vencidos', async () => {
    const res = await AlertaService.obtenerAlertasVencimiento(
      { solo_vencidos: true },
      fechaHoyMock
    );

    expect(res.alertas).toHaveLength(1);
    expect(res.alertas[0].estado_vencimiento).toBe('VENCIDO');
    // El resumen total conserva el panorama general
    expect(res.resumen.total).toBe(3);
  });

  it('filtra solo lotes por vencer si se solicita solo_por_vencer', async () => {
    const res = await AlertaService.obtenerAlertasVencimiento(
      { solo_por_vencer: true },
      fechaHoyMock
    );

    expect(res.alertas).toHaveLength(2);
    expect(res.alertas.every((a) => a.estado_vencimiento === 'POR_VENCER')).toBe(true);
  });
});
