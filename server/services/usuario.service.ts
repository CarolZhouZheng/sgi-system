import type { CrearUsuarioDTO, UsuarioResponseDTO } from '../dtos/usuario.dto';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { hashPassword } from '../utils/password';

export class UsuarioService {
  /**
   * Registra un nuevo usuario aplicando las reglas de negocio
   */
  static async registrarUsuario(dto: CrearUsuarioDTO): Promise<UsuarioResponseDTO> {
    // 1. Regla de negocio: Verificar unicidad del nombre de usuario
    const usuarioExistente = await UsuarioRepository.findByNombreUsuario(dto.nombreUsuario);
    if (usuarioExistente) {
      throw createError({
        statusCode: 409,
        statusMessage: `El nombre de usuario '${dto.nombreUsuario}' ya se encuentra registrado`,
      });
    }

    // 2. Regla de negocio: Cifrado seguro de contraseña
    const hashedPassword = hashPassword(dto.password);

    // 3. Persistencia mediante el repositorio
    const nuevoUsuario = await UsuarioRepository.create({
      nombreUsuario: dto.nombreUsuario,
      password: hashedPassword,
      rol: dto.rol,
      estado: dto.estado ?? true,
    });

    // 4. Sanitización: Excluir campos confidenciales (password) en la respuesta
    const { password: _, ...usuarioSinPassword } = nuevoUsuario;
    return usuarioSinPassword;
  }

  /**
   * Obtiene la lista de usuarios sin exponer contraseñas
   */
  static async listarUsuarios(): Promise<UsuarioResponseDTO[]> {
    const usuarios = await UsuarioRepository.findAll();
    return usuarios.map(({ password: _, ...usuario }) => usuario);
  }

  /**
   * Obtiene un usuario por ID sin exponer su contraseña
   */
  static async obtenerPorId(id: number): Promise<UsuarioResponseDTO | null> {
    const usuario = await UsuarioRepository.findById(id);
    if (!usuario) return null;
    const { password: _, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword;
  }
}
