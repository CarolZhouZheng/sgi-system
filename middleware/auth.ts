// Este middleware se ejecutará en el cliente (Vue) antes de cambiar de página.
// Puedes aplicarlo a páginas específicas agregando: definePageMeta({ middleware: 'auth' }) en tu archivo .vue

export default defineNuxtRouteMiddleware((to, from) => {
  // Lógica de sesión en el cliente (ej. comprobar cookie o estado de Pinia)
  const isAuthenticated = true; // Cambiar según la lógica de autenticación deseada

  if (!isAuthenticated && to.path !== '/login') {
    return navigateTo('/login');
  }
});
