// ===== INICIO DE MI IMPLEMENTACIÓN - RF-01 =====
// Este archivo es el Endpoint POST /api/productos (la puerta de entrada al servidor para registrar un producto).
// CONEXIÓN DE ENTRADA: Recibe los datos enviados por $fetch desde AgregarProducto.ts.
import { CrearProductoSchema } from '../../dtos/producto.dto';
import { ProductoService } from '../../services/producto.service';

export default defineEventHandler(async (event) => {
  // 1. Extrae los datos del formulario que llegaron en el cuerpo de la petición HTTP
  const body = await readBody(event);

  // 2. CONEXIÓN CON EL DTO: Envía los datos a CrearProductoSchema (producto.dto.ts) para revisar que cumplan las reglas
  const validationResult = CrearProductoSchema.safeParse(body);

  // 3. Si algún dato es inválido, prepara la lista de errores por campo y devuelve Error 400 al frontend
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

  // 4. CONEXIÓN CON EL SERVICIO: Si los datos están bien, los envía a ProductoService.registrarProducto (producto.service.ts)
  const nuevoProducto = await ProductoService.registrarProducto(
    validationResult.data
  );

  // 5. Indica con el código 201 que se creó un registro nuevo en la base de datos
  setResponseStatus(event, 201);

  // 6. CONEXIÓN DE SALIDA: Devuelve la confirmación y el producto guardado hacia AgregarProducto.ts
  return {
    success: true,
    mensaje: 'Producto creado exitosamente',
    data: nuevoProducto,
  };
});
// ===== FIN DE MI IMPLEMENTACIÓN - RF-01 =====
