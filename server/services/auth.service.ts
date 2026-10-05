import bcrypt from 'bcryptjs';
import { UsuarioRepository } from '../repositories/usuario.repository';

export const AuthService = {
  async login(nombre_usuario: string, contrasena_plana: string) {
    const usuario = await UsuarioRepository.obtenerPorNombreUsuario(nombre_usuario);
    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }
    
    // D-12: Si el usuario no tiene contraseña (ej. cuenta de Google), no puede iniciar sesión por vía nativa
    if (!usuario.contrasena_hash) {
      throw new Error('Credenciales inválidas');
    }
    
    // Comparar contraseña
    const esValida = await bcrypt.compare(contrasena_plana, usuario.contrasena_hash);
    if (!esValida) {
      throw new Error('Credenciales inválidas');
    }
    
    // Quitar la contraseña antes de devolver los datos para mayor seguridad
    const { contrasena_hash, ...usuarioSinContrasena } = usuario;
    return usuarioSinContrasena;
  }
};
