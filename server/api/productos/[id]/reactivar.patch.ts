import { ProductoIdParamSchema } from '../../../dtos/producto.dto';
import { ProductoService } from '../../../services/producto.service';

export default defineEventHandler(async (event) => {
  const paramId = getRouterParam(event, 'id');

  const validationResult = ProductoIdParamSchema.safeParse({ id: paramId });

  if (!validationResult.success) {
    const errorDetails = validationResult.error.issues.map((issue) => ({
      campo: issue.path.join('.'),
      mensaje: issue.message,
    }));

    throw createError({
      statusCode: 400,
      statusMessage: 'El identificador del producto es inválido',
      data: errorDetails,
    });
  }

  const productoReactivado = await ProductoService.reactivarProducto(
    validationResult.data.id
  );

  return {
    success: true,
    mensaje: `Producto "${productoReactivado.nombre}" reactivado exitosamente`,
    data: productoReactivado,
  };
});
