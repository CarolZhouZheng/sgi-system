import { z } from 'zod'

export const registrarPerdidaSchema = z.object({
  id_producto: z.number().int().positive(),
  id_lote: z.number().int().positive().nullable().optional(),
  id_usuario: z.number().int().positive(),
  cantidad: z.number().positive(),
  motivo: z.string().trim().min(1),
  tipo_perdida: z.string().trim().min(1),
  fecha: z.string().optional(),
  observaciones: z.string().trim().optional(),
})

export type RegistrarPerdidaDTO = z.infer<typeof registrarPerdidaSchema>
