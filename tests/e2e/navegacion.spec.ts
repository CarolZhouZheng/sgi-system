import { expect, iniciarSesionSimulada, test } from './helpers'

// Cada opción del menú lateral abre su módulo, con su título en la página y en el encabezado.
const MODULOS = [
  { menu: 'Inventario / Productos', ruta: '/productos', titulo: 'Gestión y Listado de Productos', encabezado: 'Inventario de Productos' },
  { menu: 'Pedidos', ruta: '/pedidos', titulo: 'Gestión de pedidos', encabezado: 'Gestión de Pedidos' },
  { menu: 'Destinatarios', ruta: '/destinatarios', titulo: 'Gestión de Destinatarios', encabezado: 'Gestión de Destinatarios' },
  { menu: 'Producción', ruta: '/produccion', titulo: 'Gestión de Producción', encabezado: 'Cola de Producción' },
  { menu: 'Pérdidas', ruta: '/perdidas', titulo: 'Pérdidas', encabezado: 'Registro de Pérdidas y Mermas' },
  { menu: 'Devoluciones', ruta: '/devoluciones', titulo: 'Gestión de Devoluciones', encabezado: 'Gestión de Devoluciones' },
  { menu: 'Reporte de Movimientos', ruta: '/reportes', titulo: 'Reporte de movimientos', encabezado: 'Reporte de Movimientos de Inventario' },
]

test.describe('Navegación por el menú', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await iniciarSesionSimulada(context, baseURL!)
  })

  for (const modulo of MODULOS) {
    test(`el menú "${modulo.menu}" abre ${modulo.ruta}`, async ({ page, erroresJs }) => {
      await page.goto('/productos')
      await page.locator('aside').getByRole('link', { name: modulo.menu, exact: true }).click()

      await expect(page).toHaveURL(new RegExp(`${modulo.ruta}$`))
      await expect(page.locator('main, body').getByText(modulo.titulo, { exact: true }).first()).toBeVisible()
      await expect(page.locator('header h2')).toHaveText(modulo.encabezado)
      expect(erroresJs).toEqual([])
    })
  }
})
