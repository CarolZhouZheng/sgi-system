import { z } from 'zod';
import type { Usuario } from '../models/usuario.model';

// Esquema Zod para validar la carga útil (payload) al crear un usuario
export const CrearUsuarioSchema = z.object({
  nombreUsuario: z
    .string({ required_error: 'El nombre de usuario es obligatorio' })
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .trim(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol: z
    .string({ required_error: 'El rol es obligatorio' })
    .min(1, 'El rol no puede estar vacío')
    .trim(),
  estado: z.boolean().optional().default(true),
});

// Tipo TypeScript inferido automáticamente del esquema de Zod
export type CrearUsuarioDTO = z.infer<typeof CrearUsuarioSchema>;

// DTO de respuesta seguro: omite el campo sensible 'password'
export type UsuarioResponseDTO = Omit<Usuario, 'password'>;
