import { ActualizarProductoSchema, ProductoIdParamSchema } from '../../dtos/producto.dto';
import { ProductoService } from '../../services/producto.service';

export default defineEventHandler(async (event) => {
  const paramId = getRouterParam(event, 'id');

  const idResult = ProductoIdParamSchema.safeParse({ id: paramId });

  if (!idResult.success) {
    const errorDetails = idResult.error.issues.map((issue) => ({
      campo: issue.path.join('.'),
      mensaje: issue.message,
    }));

    throw createError({
      statusCode: 400,
      statusMessage: 'El identificador del producto es inválido',
      data: errorDetails,
    });
  }

  const body = await readBody(event);

  const validationResult = ActualizarProductoSchema.safeParse(body);

  if (!validationResult.success) {
    const errorDetails = validationResult.error.issues.map((issue) => ({
      campo: issue.path.join('.') || 'general',
      mensaje: issue.message,
    }));

    throw createError({
      statusCode: 400,
      statusMessage: 'Error de validación en los datos enviados',
      data: errorDetails,
    });
  }

  const productoActualizado = await ProductoService.actualizarProducto(
    idResult.data.id,
    validationResult.data
  );

  return {
    success: true,
    mensaje: `Producto "${productoActualizado.nombre}" actualizado exitosamente`,
    data: productoActualizado,
  };
});
