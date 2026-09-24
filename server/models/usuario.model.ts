export interface Usuario {
  id_usuario?: number;
  id_rol: number;
  nombre: string;
  apellido?: string;
  nombre_usuario: string;
  contrasena_hash: string;
  estado: boolean;
  fecha_creacion?: string;
  ultimo_acceso?: string;
}
