export default defineEventHandler((event) => {
  deleteCookie(event, 'usuario_session', {
    path: '/',
    httpOnly: true,
  });

  deleteCookie(event, 'sesion_activa', {
    path: '/',
  });

  deleteCookie(event, 'usuario_sesion', {
    path: '/',
  });

  return {
    success: true,
    mensaje: 'Sesión cerrada correctamente',
  };
});
