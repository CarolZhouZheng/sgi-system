import { computed } from 'vue'

export interface UsuarioSesion {
  id_usuario: number
  id_rol: number
  nombre: string
  apellido?: string
  nombre_usuario: string
  estado?: boolean
}

export const useAuth = () => {
  const usuario = useCookie<UsuarioSesion | null>('usuario_sesion', {
    path: '/',
    default: () => null,
    watch: true,
  })

  const sesionActiva = useCookie<string | null>('sesion_activa', {
    path: '/',
    default: () => null,
    watch: true,
  })

  const setUsuario = (datos: UsuarioSesion) => {
    usuario.value = datos
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      usuario.value = null
      sesionActiva.value = null
      await navigateTo('/login')
    }
  }

  return {
    usuario,
    sesionActiva,
    setUsuario,
    logout,
    isAuthenticated: computed(() => Boolean(usuario.value)),
  }
}

