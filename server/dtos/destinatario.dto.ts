import { z } from 'zod';

export const CrearDestinatarioDTO = z.object({
  nombre_empresa: z.string().trim().min(1, 'El nombre de la empresa es obligatorio').max(150),
  telefono: z.string().max(30).optional(),
  correo: z.string().email('Debe ser un correo válido').max(150).optional().or(z.literal('')),
  direccion: z.string().max(255).optional()
});
