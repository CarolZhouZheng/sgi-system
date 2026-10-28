// server/api/devoluciones/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3';
import { DevolucionService } from '../../services/devolucion.service';

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const devoluciones = await DevolucionService.listarDevoluciones(query);

    return {
      success: true,
      total: devoluciones.length,
      data: devoluciones,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Error al listar las devoluciones.',
    });
  }
});
