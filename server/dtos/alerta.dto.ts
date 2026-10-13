import { z } from 'zod';

export const ConsultaAlertasSchema = z.object({
  dias_anticipacion: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === '') return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }, z.number().int().min(1, 'Los días de anticipación deben ser al menos 1').max(365, 'Máximo 365 días').optional())
    .optional(),

  solo_vencidos: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional(),

  solo_por_vencer: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional(),
});

export type ConsultaAlertasDto = z.infer<typeof ConsultaAlertasSchema>;
