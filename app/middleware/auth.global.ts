export default defineNuxtRouteMiddleware((to) => {
  // D-14: Redirigir al login si no hay sesión y se intenta acceder a una ruta protegida
  
  // Leemos la cookie pública, ya que la 'usuario_session' ahora es HttpOnly y no se puede leer desde JS del cliente
  const sesionActiva = useCookie('sesion_activa');

  // Si el usuario ya inició sesión y quiere ir a /login, lo mandamos directo al sistema
  if (sesionActiva.value && to.path === '/login') {
    return navigateTo('/productos'); // o la página principal
  }

  // Si NO ha iniciado sesión y quiere ir a cualquier lado que no sea el login, lo bloqueamos
  if (!sesionActiva.value && to.path !== '/login') {
    return navigateTo('/login');
  }
});
