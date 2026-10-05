import { LoginDTO } from '../../dtos/login.dto';
import { AuthService } from '../../services/auth.service';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // D-13: Validar datos de entrada de forma segura sin lanzar errores crudos de Zod
    const validacion = LoginDTO.safeParse(body);
    
    if (!validacion.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Por favor, completa correctamente el usuario y la contraseña.'
      });
    }
    
    const datosValidados = validacion.data;
    
    // Ejecutar lógica de negocio
    const usuario = await AuthService.login(datosValidados.nombre_usuario, datosValidados.contrasena);
    
    // Guardar sesión en cookie (Para arreglar D-03 y base para D-14)
    setCookie(event, 'usuario_session', JSON.stringify({
      id_usuario: usuario.id_usuario,
      id_rol: usuario.id_rol,
      nombre_usuario: usuario.nombre_usuario
    }), {
      maxAge: 60 * 60 * 24 * 7, // 1 semana
      path: '/',
      httpOnly: true, // QA D-03: Marcarla como HttpOnly para seguridad
    });

    // Cookie pública sin datos sensibles para que el Middleware frontend sepa que hay sesión
    setCookie(event, 'sesion_activa', 'true', {
      maxAge: 60 * 60 * 24 * 7,
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
      statusCode: error.statusCode || 401,
      statusMessage: error.statusMessage || error.message || 'Error de autenticación'
    });
  }
});
