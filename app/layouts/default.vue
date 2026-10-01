<template>
  <div class="min-h-screen flex bg-[#FDF8F3] text-[#1A0A00] font-sans antialiased">
    <!-- =====================================================
         SIDEBAR / TASKBAR (Basado fielmente en el prototipo)
         ===================================================== -->
    <aside class="w-60 min-h-screen bg-[#3D1F0A] flex flex-col flex-shrink-0 text-white select-none sticky top-0 h-screen overflow-y-auto border-r border-[#3D1F0A]">
      <!-- Marca y Logo de la Panadería -->
      <div class="p-4 border-b border-white/10 flex items-center gap-3">
        <div class="w-10 h-10 rounded-md bg-white p-0.5 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
          <img
            src="/images/logo.jpg"
            alt="Logo La Nueva Victoria"
            class="w-full h-full object-contain"
          />
        </div>
        <div class="overflow-hidden">
          <h1 class="font-serif font-bold text-white text-[0.95rem] leading-tight truncate">
            La Nueva Victoria
          </h1>
          <p class="text-white/45 text-[0.7rem] font-sans mt-0.5 truncate">
            Panel Administración
          </p>
        </div>
      </div>

      <!-- Menú de Navegación por Secciones -->
      <nav class="flex-1 py-3 space-y-1">
        <!-- Sección 1: Principal -->
        <div class="px-5 pt-3 pb-1 text-[0.65rem] font-bold uppercase tracking-wider text-white/35 font-sans">
          Principal
        </div>
        <NuxtLink
          to="/productos"
          class="flex items-center gap-2.5 px-5 py-2.5 text-xs text-white/65 hover:bg-white/10 hover:text-white transition font-sans border-l-[3px] border-transparent"
        >
          <span>Dashboard</span>
        </NuxtLink>

        <!-- Sección 2: Gestión -->
        <div class="px-5 pt-4 pb-1 text-[0.65rem] font-bold uppercase tracking-wider text-white/35 font-sans">
          Gestión
        </div>
        <NuxtLink
          to="/productos"
          class="flex items-center gap-2.5 px-5 py-2.5 text-xs font-semibold bg-[#C4620A]/25 text-[#E8A84A] border-l-[3px] border-[#E8A84A] transition font-sans"
        >
          <span>Inventario / Productos</span>
        </NuxtLink>

        <div class="flex items-center gap-2.5 px-5 py-2.5 text-xs text-white/65 hover:bg-white/10 hover:text-white transition font-sans border-l-[3px] border-transparent cursor-pointer">
          <span>Producción</span>
        </div>

        <div class="flex items-center gap-2.5 px-5 py-2.5 text-xs text-white/65 hover:bg-white/10 hover:text-white transition font-sans border-l-[3px] border-transparent cursor-pointer">
          <span>Pedidos</span>
        </div>

        <div class="flex items-center gap-2.5 px-5 py-2.5 text-xs text-white/65 hover:bg-white/10 hover:text-white transition font-sans border-l-[3px] border-transparent cursor-pointer">
          <span>Pérdidas</span>
        </div>

        <!-- Sección 3: Administración -->
        <div class="px-5 pt-4 pb-1 text-[0.65rem] font-bold uppercase tracking-wider text-white/35 font-sans">
          Administración
        </div>
        <div class="flex items-center gap-2.5 px-5 py-2.5 text-xs text-white/65 hover:bg-white/10 hover:text-white transition font-sans border-l-[3px] border-transparent cursor-pointer">
          <span>Reportes</span>
        </div>

        <div class="flex items-center gap-2.5 px-5 py-2.5 text-xs text-white/65 hover:bg-white/10 hover:text-white transition font-sans border-l-[3px] border-transparent cursor-pointer">
          <span>Usuarios</span>
        </div>
      </nav>

      <!-- Pie del Sidebar: Cerrar Sesión -->
      <div class="p-4 border-t border-white/10 mt-auto">
        <button
          type="button"
          class="w-full py-2 px-3 bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs rounded-lg transition font-sans flex items-center justify-center gap-2 border border-white/15"
          @click="cerrarSesion"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <!-- =====================================================
         ÁREA PRINCIPAL CON TOPBAR
         ===================================================== -->
    <div class="flex-1 flex flex-col min-w-0 bg-[#FDF8F3] min-h-screen">
      <!-- Topbar Superior -->
      <header class="sticky top-0 z-20 bg-white border-b border-[#E8D5BC] px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div class="flex items-center gap-3">
          <div>
            <h2 class="text-base font-serif font-bold text-[#1A0A00]">
              Inventario de Productos
            </h2>
            <p class="text-[0.72rem] text-[#7A5A3A] font-sans">
              Sistema de Gestión de Inventario — Panadería La Nueva Victoria
            </p>
          </div>
        </div>

        <!-- Usuario y Avatar -->
        <div class="flex items-center gap-3">
          <div class="text-right hidden sm:block">
            <div class="text-xs font-semibold text-[#1A0A00]">
              Administrador
            </div>
            <div class="text-[0.68rem] text-[#7A5A3A]">
              admin@lanuevavictoria.com
            </div>
          </div>
          <div class="w-8 h-8 rounded-full bg-[#C4620A] text-white flex items-center justify-center font-bold text-xs shadow-xs select-none">
            A
          </div>
        </div>
      </header>

      <!-- Contenido Principal Renderizado por Nuxt -->
      <main class="flex-1 p-6 max-w-7xl w-full mx-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const cerrarSesion = () => {
  router.push('/login/login');
};
</script>
