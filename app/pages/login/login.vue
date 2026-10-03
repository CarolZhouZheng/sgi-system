<template>
  <div class="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-4 font-sans relative" style="background-image: url('/images/fondo-login.jpg');">
    <!-- Overlay oscuro para emular el estilo transparente y elegante -->
    <div class="absolute inset-0 bg-black/70"></div>
    
    <!-- Contenedor Principal (Sin fondo, todo transparente) -->
    <div class="relative z-10 w-full max-w-md flex flex-col items-center mt-[-5vh]">
      
      <!-- Cabecera -->
      <h1 class="text-3xl sm:text-4xl font-light text-white tracking-[0.15em] uppercase mb-8 text-center">
        Panadería La Nueva Victoria
      </h1>
      
      <img src="/images/logo.jpg" alt="Logo La Nueva Victoria" class="w-32 h-32 mb-12 rounded-3xl object-contain shadow-2xl bg-white" />

      <!-- Formulario Login Nativo -->
      <form @submit.prevent="handleNativeLogin" class="space-y-8 w-full px-6">
        
        <!-- Campo Usuario -->
        <div class="relative">
          <input 
            v-model="username" 
            type="text" 
            placeholder="Usuario" 
            class="w-full bg-transparent border-0 border-b-2 border-white/60 py-2 text-white placeholder-white/70 focus:outline-none focus:border-white focus:ring-0 transition-colors text-lg font-light"
            required
          >
        </div>

        <!-- Campo Contraseña -->
        <div class="relative">
          <input 
            v-model="password" 
            type="password" 
            placeholder="Contraseña" 
            class="w-full bg-transparent border-0 border-b-2 border-white/60 py-2 text-white placeholder-white/70 focus:outline-none focus:border-white focus:ring-0 transition-colors text-lg font-light"
            required
          >
        </div>

        <!-- Mensaje de error -->
        <p v-if="errorMessage" class="text-red-400 text-sm font-medium text-center mt-2">
          {{ errorMessage }}
        </p>

        <!-- Botones en lugar de la flecha redonda -->
        <div class="pt-10 flex flex-col items-center space-y-4">
          <button 
            type="submit" 
            class="w-56 py-3 rounded-full border border-white text-white hover:bg-white hover:text-black transition-all duration-300 font-light tracking-widest text-sm flex justify-center items-center"
            :disabled="isLoading"
          >
            <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-else>INICIAR SESIÓN</span>
          </button>
          
          <button 
            type="button"
            @click="handleGoogleLogin"
            class="w-56 py-3 rounded-full border border-white/40 text-white/80 hover:bg-white hover:text-black hover:border-white transition-all duration-300 font-light tracking-widest text-sm flex items-center justify-center space-x-3"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"/>
            </svg>
            <span>GOOGLE</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Footer minimalista -->
    <div class="absolute bottom-8 z-10 text-white/40 text-xs font-light tracking-wider">
      © 2026 Panadería La Nueva Victoria. Todos los derechos reservados.
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '~/composables/useAuth'

const config = useRuntimeConfig()
const supabase = createClient(
  (config.public.supabaseUrl as string) || '',
  (config.public.supabaseKey as string) || ''
)

const router = useRouter()
const username = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const { setUsuario } = useAuth()

const handleNativeLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const response = await $fetch<{ success: boolean; usuario: any }>('/api/auth/login', {
      method: 'POST',
      body: {
        nombre_usuario: username.value,
        contrasena: password.value
      }
    })
    
    if (response.success && response.usuario) {
      setUsuario(response.usuario)
      router.push('/productos')
    }
  } catch (error: any) {
    errorMessage.value = error.data?.statusMessage || 'Usuario o contraseña incorrectos'
  } finally {
    isLoading.value = false
  }
}

const handleGoogleLogin = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/productos'
      }
    })
    if (error) throw error
  } catch (error) {
    errorMessage.value = 'Error al conectar con Google'
    console.error(error)
  }
}
</script>

<style scoped>
/* Elimina el autocompletado azul feo de los navegadores para mantener la transparencia */
input:-webkit-autofill,
input:-webkit-autofill:hover, 
input:-webkit-autofill:focus, 
input:-webkit-autofill:active{
    -webkit-box-shadow: 0 0 0 30px transparent inset !important;
    -webkit-text-fill-color: white !important;
    transition: background-color 5000s ease-in-out 0s;
}
</style>
