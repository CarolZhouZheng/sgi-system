import { CrearUsuarioSchema } from '../../dtos/usuario.dto';
import { UsuarioService } from '../../services/usuario.service';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // 1. Validar la estructura del payload con Zod (responsabilidad HTTP)
  const validationResult = CrearUsuarioSchema.safeParse(body);
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

  // 2. Delegar la lógica de negocio al servicio
  const nuevoUsuario = await UsuarioService.registrarUsuario(validationResult.data);

  // 3. Responder con código 201 Created y payload limpio
  setResponseStatus(event, 201);
  return {
    success: true,
    mensaje: 'Usuario creado exitosamente',
    data: nuevoUsuario,
  };
});

