import { LoginDTO } from '../../dtos/login.dto';
import { AuthService } from '../../services/auth.service';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Validar datos de entrada con Zod (DTO)
    const datosValidados = LoginDTO.parse(body);
    
    // Ejecutar lógica de negocio
    const usuario = await AuthService.login(datosValidados.nombre_usuario, datosValidados.contrasena);
    
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
