import { LoginDTO } from '../../dtos/login.dto';
import { AuthService } from '../../services/auth.service';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Validar datos de entrada con Zod (DTO)
    const datosValidados = LoginDTO.parse(body);
    
    // Ejecutar lógica de negocio
    const usuario = await AuthService.login(datosValidados.nombre_usuario, datosValidados.contrasena);
    
    // Guardar sesión en cookie (Para arreglar D-03 y base para D-14)
    setCookie(event, 'usuario_session', JSON.stringify({
      id_usuario: usuario.id_usuario,
      id_rol: usuario.id_rol,
      nombre_usuario: usuario.nombre_usuario
    }), {
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/'
    });

    return {
      success: true,
      mensaje: 'Login exitoso',
      usuario
    };
  } catch (error: any) {
    // Retornar error controlado
    throw createError({
      statusCode: 401,
      statusMessage: error.message || 'Error de autenticación'
    });
  }
});
