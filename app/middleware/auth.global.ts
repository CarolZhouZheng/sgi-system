export default defineNuxtRouteMiddleware((to) => {
  // D-14: Redirigir al login si no hay sesión y se intenta acceder a una ruta protegida
  
  const sesion = useCookie('usuario_session');

  // Si el usuario ya inició sesión y quiere ir a /login, lo mandamos directo al sistema
  if (sesion.value && to.path === '/login') {
    return navigateTo('/productos'); // o la página principal
  }

  // Si NO ha iniciado sesión y quiere ir a cualquier lado que no sea el login, lo bloqueamos
  if (!sesion.value && to.path !== '/login') {
    return navigateTo('/login');
  }
});
