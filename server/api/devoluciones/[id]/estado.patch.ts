// server/api/devoluciones/[id]/estado.patch.ts
import { defineEventHandler, getRouterParams, readBody, getCookie, createError } from 'h3';
import { DevolucionIdParamSchema, CambiarEstadoDevolucionSchema } from '../../../dtos/devolucion.dto';
import { DevolucionService } from '../../../services/devolucion.service';

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event);
  const validacionId = DevolucionIdParamSchema.safeParse({ id: params.id });

  if (!validacionId.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El ID de devolución proporcionado no es válido.',
    });
  }

  const body = await readBody(event);
  const validacion = CambiarEstadoDevolucionSchema.safeParse(body);

  if (!validacion.success) {
    throw createError({
      statusCode: 400,
      statusMessage: validacion.error.issues.map((i) => i.message).join('; '),
    });
  }

  let idUsuarioSesion: number | undefined;
  const sessionCookie =
    getCookie(event, 'usuario_session') || getCookie(event, 'usuario_sesion');
  if (sessionCookie) {
    try {
      const sesion = JSON.parse(sessionCookie);
      idUsuarioSesion = Number(sesion?.id_usuario) || undefined;
    } catch {
      // Ignorar error de parsing no crítico
    }
  }

  try {
    const actualizada = await DevolucionService.cambiarEstadoDevolucion(
      validacionId.data.id,
      validacion.data,
      idUsuarioSesion
    );

    return {
      success: true,
      mensaje: `Estado de la devolución actualizado a ${validacion.data.estado}.`,
      data: actualizada,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Error al actualizar el estado de la devolución.',
    });
  }
});
