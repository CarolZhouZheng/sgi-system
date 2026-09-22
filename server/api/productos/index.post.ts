import { CrearProductoSchema } from '../../dtos/producto.dto';
import { ProductoService } from '../../services/producto.service';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const validationResult = CrearProductoSchema.safeParse(body);

  if (!validationResult.success) {
    const errorDetails = validationResult.error.issues.map((issue) => ({
      campo: issue.path.join('.'),
      mensaje: issue.message,
    }));

    throw createError({
      statusCode: 400,
      statusMessage: 'Error de validación en los datos enviados',
      data: errorDetails,
    });
  }

  const nuevoProducto = await ProductoService.registrarProducto(
    validationResult.data
  );

  setResponseStatus(event, 201);

  return {
    success: true,
    mensaje: 'Producto creado exitosamente',
    data: nuevoProducto,
  };
});
