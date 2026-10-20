import { ConsultaMovimientosSchema } from '../../dtos/movimiento.dto';
import { MovimientoService } from '../../services/movimiento.service';

// RF-08: GET /api/movimientos?desde=AAAA-MM-DD&hasta=AAAA-MM-DD&id_producto=&tipo=&limite=
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const parsed = ConsultaMovimientosSchema.safeParse(query);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Parámetros de consulta inválidos.',
      data: parsed.error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensaje: issue.message,
      })),
    });
  }

  try {
    const reporte = await MovimientoService.generarReporte(parsed.data);

    return {
      success: true,
      total: reporte.movimientos.length,
      data: reporte.movimientos,
      resumen: reporte.resumen,
      tipos_disponibles: reporte.tipos_disponibles,
    };
  } catch (error: unknown) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'No se pudo generar el reporte de movimientos.',
    });
  }
});
