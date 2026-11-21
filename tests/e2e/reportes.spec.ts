import { readFile } from 'node:fs/promises'
import { expect, iniciarSesionSimulada, test } from './helpers'

// RF-08: Reporte de movimientos (solo lectura).
test.describe('RF-08 · Reporte de movimientos', () => {
  test.beforeEach(async ({ context, baseURL, page }) => {
    await iniciarSesionSimulada(context, baseURL!)
    await page.goto('/reportes')
    await expect(page.getByRole('heading', { name: 'Reporte de movimientos', exact: true })).toBeVisible()
  })

  test('al abrir genera el reporte con el resumen', async ({ page, erroresJs }) => {
    await expect(page.getByText(/^Reporte generado: \d+ movimiento\(s\)/)).toBeVisible()
    await expect(page.getByText('Movimientos', { exact: true })).toBeVisible()
    await expect(page.getByText('Detalle de movimientos')).toBeVisible()
    expect(erroresJs).toEqual([])
  })

  test('"Generar reporte" vuelve a consultar con los filtros', async ({ page, erroresJs }) => {
    await expect(page.getByText(/^Reporte generado/)).toBeVisible()

    const consulta = page.waitForRequest((r) => r.url().includes('/api/movimientos') && r.url().includes('desde=2026-01-01'))
    await page.locator('#desde').fill('2026-01-01')
    await page.getByRole('button', { name: 'Generar reporte' }).click()

    await consulta
    await expect(page.getByText(/^Reporte generado/)).toBeVisible()
    expect(erroresJs).toEqual([])
  })

  test('un rango sin movimientos muestra el aviso de vacío', async ({ page, erroresJs }) => {
    await page.locator('#desde').fill('2000-01-01')
    await page.locator('#hasta').fill('2000-01-02')
    await page.getByRole('button', { name: 'Generar reporte' }).click()

    await expect(page.getByText('No hay movimientos para los filtros seleccionados.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeDisabled()
    expect(erroresJs).toEqual([])
  })

  test('"Exportar CSV" descarga el archivo con encabezados', async ({ page, erroresJs }) => {
    await page.locator('#desde').fill('2026-01-01')
    await page.getByRole('button', { name: 'Generar reporte' }).click()
    await expect(page.getByText(/^Reporte generado/)).toBeVisible()

    const boton = page.getByRole('button', { name: 'Exportar CSV' })
    test.skip(await boton.isDisabled(), 'No hay movimientos en la base para exportar')

    const [descarga] = await Promise.all([page.waitForEvent('download'), boton.click()])
    expect(descarga.suggestedFilename()).toMatch(/^reporte-movimientos_.*\.csv$/)

    const contenido = await readFile((await descarga.path())!, 'utf8')
    expect(contenido.replace(/^﻿/, '').split('\r\n')[0]).toBe(
      'Fecha;Tipo;Producto;Unidad;Cantidad;Stock anterior;Stock nuevo;Variación;Usuario;Origen;Observaciones'
    )
    expect(erroresJs).toEqual([])
  })
})
