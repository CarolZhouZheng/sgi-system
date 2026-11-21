import { expect, iniciarSesionSimulada, test } from './helpers'

const RUTAS_PROTEGIDAS = [
  '/productos',
  '/pedidos',
  '/destinatarios',
  '/produccion',
  '/perdidas',
  '/devoluciones',
  '/reportes',
]

test.describe('RF-15 · Acceso y login', () => {
  for (const ruta of RUTAS_PROTEGIDAS) {
    test(`sin sesión, ${ruta} redirige al login`, async ({ page, erroresJs }) => {
      await page.goto(ruta)
      await expect(page).toHaveURL(/\/login$/)
      await expect(page.getByPlaceholder('Usuario')).toBeVisible()
      expect(erroresJs).toEqual([])
    })
  }

  test('credenciales incorrectas muestran un mensaje y no entran', async ({ page, erroresJs }) => {
    // Se espera a que la página termine de cargar su JavaScript antes de enviar el formulario.
    await page.goto('/login', { waitUntil: 'networkidle' })
    await page.getByPlaceholder('Usuario').fill('e2e-usuario-que-no-existe')
    await page.getByPlaceholder('Contraseña').fill('incorrecta')
    await page.getByRole('button', { name: 'INICIAR SESIÓN' }).click()

    await expect(page.getByText(/Credenciales inválidas|Usuario o contraseña incorrectos/)).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
    expect(erroresJs).toEqual([])
  })

  test('con sesión, abrir /login lleva a /productos', async ({ page, context, baseURL, erroresJs }) => {
    await iniciarSesionSimulada(context, baseURL!)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/productos$/)
    expect(erroresJs).toEqual([])
  })

  // D-17 (corregido por Armando en b89399a): "/" daba 500 por un middleware 'auth' inexistente.
  test('con sesión, la raíz / lleva a /productos', async ({ page, context, baseURL, erroresJs }) => {
    await iniciarSesionSimulada(context, baseURL!)
    await page.goto('/')
    await expect(page).toHaveURL(/\/productos$/)
    expect(erroresJs).toEqual([])
  })

  // Login real: solo corre si se definen credenciales de prueba en el entorno.
  // Ejemplo (PowerShell): $env:E2E_USUARIO='admin'; $env:E2E_CONTRASENA='...'; npm run test:e2e
  test('login real con credenciales válidas entra al sistema', async ({ page, erroresJs }) => {
    test.skip(!process.env.E2E_USUARIO || !process.env.E2E_CONTRASENA, 'Define E2E_USUARIO y E2E_CONTRASENA para probar el login real')

    await page.goto('/login')
    await page.getByPlaceholder('Usuario').fill(process.env.E2E_USUARIO!)
    await page.getByPlaceholder('Contraseña').fill(process.env.E2E_CONTRASENA!)
    await page.getByRole('button', { name: 'INICIAR SESIÓN' }).click()

    await expect(page).toHaveURL(/\/productos$/)
    await expect(page.getByText('Gestión y Listado de Productos')).toBeVisible()
    expect(erroresJs).toEqual([])
  })
})
