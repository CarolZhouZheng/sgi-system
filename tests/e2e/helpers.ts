import { test as base, expect, type BrowserContext } from '@playwright/test'

/**
 * Sesión para las pruebas E2E.
 * El middleware de páginas solo revisa la cookie pública `sesion_activa`, así que se
 * crea directamente para recorrer la app sin usar credenciales reales.
 * El login real se prueba aparte en auth.spec.ts (solo si se definen E2E_USUARIO y E2E_CONTRASENA).
 */
export async function iniciarSesionSimulada(context: BrowserContext, baseURL: string) {
  await context.addCookies([{ name: 'sesion_activa', value: 'true', url: baseURL }])
}

/**
 * `test` con dos extras:
 *  - `sesion`: página con la cookie de sesión ya creada.
 *  - Falla la prueba si la página lanza un error de JavaScript.
 */
export const test = base.extend<{ erroresJs: string[] }>({
  erroresJs: async ({ page }, usar) => {
    const errores: string[] = []
    page.on('pageerror', (error) => errores.push(error.message))
    await usar(errores)
    expect(errores, 'La página no debe lanzar errores de JavaScript').toEqual([])
  },
})

export { expect }
