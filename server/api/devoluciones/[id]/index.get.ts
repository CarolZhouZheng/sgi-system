// server/api/devoluciones/[id]/index.get.ts
import { defineEventHandler, getRouterParams, createError } from 'h3';
import { DevolucionIdParamSchema } from '../../../dtos/devolucion.dto';
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

  try {
    const devolucion = await DevolucionService.obtenerDevolucionPorId(validacionId.data.id);

    return {
      success: true,
      data: devolucion,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Error al obtener la devolución.',
    });
  }
});
