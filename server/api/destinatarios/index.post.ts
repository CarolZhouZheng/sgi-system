import { defineEventHandler, readBody } from 'h3';
import { CrearDestinatarioDTO } from '../../dtos/destinatario.dto';
import { DestinatarioService } from '../../services/destinatario.service';

const destinatarioService = new DestinatarioService();

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Validar con Zod
    const datosValidados = CrearDestinatarioDTO.parse(body);
    
    const resultado = await destinatarioService.registrarDestinatario({
      nombre_empresa: datosValidados.nombre_empresa,
      telefono: datosValidados.telefono || undefined,
      correo: datosValidados.correo || undefined,
      direccion: datosValidados.direccion || undefined
    });

    if (!resultado.success) {
      throw createError({
        statusCode: 400,
        statusMessage: resultado.error
      });
    }

    return {
      success: true,
      data: resultado.data
    };

  } catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error.issues ? error.issues[0].message : error.message
    });
  }
});
