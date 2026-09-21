import { supabase } from '../utils/supabase';

export default defineEventHandler(async (event) => {
  // Obtenemos la URL de la petición
  const url = getRequestURL(event);

  // Si la ruta es del API (por ejemplo, queremos proteger /api/usuarios)
  if (url.pathname.startsWith('/api/')) {

    // Aquí puedes decidir qué rutas proteger. 
    // Por ejemplo, podríamos dejar pasar los GET y bloquear POST, PUT, DELETE sin token:
    // if (event.method === 'GET') return;

    // 1. Intentamos leer el header de Autorización (el token JWT)
    const authHeader = getHeader(event, 'authorization');

    // 2. Si es una ruta protegida y no hay token, rechazamos la petición
    // Descomenta esto cuando tu frontend ya envíe tokens de sesión:
    /*
    if (!authHeader) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No autorizado. Se requiere un token Bearer.',
      });
    }

    // 3. Validar el token con Supabase
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Token inválido o expirado.',
      });
    }

    // 4. Guardamos el usuario en el contexto para poder usarlo dentro de tus endpoints
    // (Ej: en [id].get.ts puedes leer event.context.user)
    event.context.user = data.user;
    */
  }
});