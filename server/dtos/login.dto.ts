import { z } from 'zod';

export const LoginDTO = z.object({
  nombre_usuario: z.string().min(1, 'El usuario es obligatorio'),
  contrasena: z.string().min(1, 'La contraseña es obligatoria')
});
