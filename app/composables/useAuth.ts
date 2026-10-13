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
    default: () => null,
    watch: true,
  })

  const setUsuario = (datos: UsuarioSesion) => {
    usuario.value = datos
  }

  const logout = () => {
    usuario.value = null
    navigateTo('/login')
  }

  return {
    usuario,
    setUsuario,
    logout,
    isAuthenticated: computed(() => Boolean(usuario.value)),
  }
}
