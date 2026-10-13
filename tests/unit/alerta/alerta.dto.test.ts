import { describe, expect, it } from 'vitest';
import { ConsultaAlertasSchema } from '../../../server/dtos/alerta.dto';

describe('RF-06 · ConsultaAlertasSchema', () => {
  it('valida parámetros vacíos asignando defaults o undefined', () => {
    const parsed = ConsultaAlertasSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dias_anticipacion).toBeUndefined();
      expect(parsed.data.solo_vencidos).toBeUndefined();
    }
  });

  it('transforma strings numéricos a números para dias_anticipacion', () => {
    const parsed = ConsultaAlertasSchema.safeParse({
      dias_anticipacion: '7',
      solo_vencidos: 'true',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dias_anticipacion).toBe(7);
      expect(parsed.data.solo_vencidos).toBe(true);
    }
  });

  it('rechaza números negativos o fuera de rango', () => {
    const parsed = ConsultaAlertasSchema.safeParse({ dias_anticipacion: -5 });
    expect(parsed.success).toBe(false);
  });
});
