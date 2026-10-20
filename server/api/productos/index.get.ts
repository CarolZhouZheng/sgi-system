import { ProductoService } from '../../services/producto.service';
import { FiltroProductosSchema } from '../../dtos/producto.dto';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const resultado = FiltroProductosSchema.safeParse(query);

  if (!resultado.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Parámetros de búsqueda inválidos',
      data: {
        errores: resultado.error.issues.map((issue) => ({
          campo: issue.path.join('.'),
          mensaje: issue.message,
        })),
      },
    });
  }

  try {
    const productos = await ProductoService.listarProductos(resultado.data);

    return {
      success: true,
      total: productos.length,
      data: productos,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Error al listar los productos.',
    });
  }
});