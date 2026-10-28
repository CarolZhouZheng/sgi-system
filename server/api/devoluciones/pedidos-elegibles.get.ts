// server/api/devoluciones/pedidos-elegibles.get.ts
import { defineEventHandler, createError } from 'h3';
import { DevolucionService } from '../../services/devolucion.service';

export default defineEventHandler(async () => {
  try {
    const pedidos = await DevolucionService.obtenerPedidosElegibles();
    return {
      success: true,
      data: pedidos,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Error al obtener pedidos para devolución.',
    });
  }
});
