import { AlertaService } from '../../services/alerta.service';
import { ConsultaAlertasSchema } from '../../dtos/alerta.dto';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const parsed = ConsultaAlertasSchema.safeParse(query);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parámetros de consulta inválidos.',
      data: parsed.error.format(),
    });
  }

  const resultado = await AlertaService.obtenerAlertasVencimiento(parsed.data);

  return {
    success: true,
    data: resultado.alertas,
    resumen: resultado.resumen,
  };
});
