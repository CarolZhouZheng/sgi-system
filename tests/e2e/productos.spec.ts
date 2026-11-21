import { expect, iniciarSesionSimulada, test } from './helpers'

// Solo lectura: estas pruebas no guardan cambios en la base compartida.
test.describe('Productos (RF-01, RF-03, RF-07)', () => {
  test.beforeEach(async ({ context, baseURL, page }) => {
    await iniciarSesionSimulada(context, baseURL!)
    await page.goto('/productos')
    await expect(page.getByText('Gestión y Listado de Productos')).toBeVisible()
  })

  test('el listado muestra productos', async ({ page, erroresJs }) => {
    await expect(page.locator('tbody tr').first()).toBeVisible()
    expect(await page.locator('tbody tr').count()).toBeGreaterThan(0)
    expect(erroresJs).toEqual([])
  })

  test('RF-07: la búsqueda filtra el listado', async ({ page, erroresJs }) => {
    const filas = page.locator('tbody tr')
    await expect(filas.first()).toBeVisible()
    // No se compara el total exacto: otras pruebas del equipo pueden crear o borrar
    // productos [QA-TEST] en la base compartida mientras esta corre.
    // Referencia: un producto real (sin la marca [QA-TEST], que otras pruebas crean y borran).
    const filaReal = filas.filter({ hasNotText: '[QA-TEST]' }).first()
    const referencia = (await filaReal.innerText()).split('\n').map((t) => t.trim()).find((t) => t.length > 3 && !t.startsWith('#'))!

    const busqueda = page.getByPlaceholder('Nombre, categoría o descripción...')
    await busqueda.fill('zzz-e2e-no-existe-zzz')
    await expect(filas.filter({ hasText: /\d/ })).toHaveCount(0)

    await busqueda.fill('')
    await expect(filas.filter({ hasText: referencia }).first()).toBeVisible()
    expect(await filas.count()).toBeGreaterThan(0)
    expect(erroresJs).toEqual([])
  })

  test('RF-03: el modal de edición muestra la fecha de vencimiento y se cancela sin guardar', async ({ page, erroresJs }) => {
    const guardados: string[] = []
    page.on('request', (r) => { if (r.method() === 'PUT') guardados.push(r.url()) })

    await page.getByTitle('Editar producto').first().click()

    const fecha = page.locator('#edit_fecha_vencimiento')
    await expect(fecha).toBeVisible()
    await expect(fecha).toHaveAttribute('type', 'date')
    await expect(page.getByText(/Se puede cambiar, pero no quitar\.|Opcional: el producto no tiene fecha registrada\./)).toBeVisible()

    await page.getByRole('button', { name: 'Cancelar' }).click()
    await expect(fecha).toBeHidden()

    expect(guardados).toEqual([])
    expect(erroresJs).toEqual([])
  })
})
