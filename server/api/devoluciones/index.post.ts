// server/api/devoluciones/index.post.ts
import { defineEventHandler, getCookie, readBody, createError } from 'h3';
import { DevolucionService } from '../../services/devolucion.service';

export default defineEventHandler(async (event) => {
  // Validación estricta de sesión mediante cookie
  const sessionCookie =
    getCookie(event, 'usuario_session') || getCookie(event, 'usuario_sesion');
  if (!sessionCookie) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No hay sesión activa.',
    });
  }

  let sesion: any;
  try {
    sesion =
      typeof sessionCookie === 'string'
        ? JSON.parse(sessionCookie)
        : sessionCookie;
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: 'La sesión está dañada o es inválida.',
    });
  }

  const idUsuario = Number(sesion?.id_usuario);
  if (!idUsuario || isNaN(idUsuario) || idUsuario <= 0) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sesión inválida.',
    });
  }

  const body = (await readBody(event)) || {};
  body.id_usuario = idUsuario;

  try {
    const devolucion = await DevolucionService.registrarDevolucion(body, idUsuario);

    return {
      success: true,
      mensaje: 'Devolución registrada exitosamente.',
      data: devolucion,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 400,
      statusMessage: error.statusMessage || error.message || 'Error al registrar la devolución.',
    });
  }
});
