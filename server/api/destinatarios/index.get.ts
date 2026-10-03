import { defineEventHandler } from 'h3';
import { DestinatarioService } from '../../services/destinatario.service';

const destinatarioService = new DestinatarioService();

export default defineEventHandler(async (event) => {
  const resultado = await destinatarioService.listarDestinatarios();

  if (!resultado.success) {
    throw createError({
      statusCode: 500,
      statusMessage: resultado.error
    });
  }

  return {
    success: true,
    data: resultado.data
  };
});
