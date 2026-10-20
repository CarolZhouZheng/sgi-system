import { MovimientoRepository, type MovimientoRaw } from '../repositories/movimiento.repository';
import type { ConsultaMovimientosDto } from '../dtos/movimiento.dto';
import type {
  DireccionMovimiento,
  MovimientoReporte,
  RespuestaReporteMovimientos,
  ResumenMovimientos,
  ResumenProductoMovimiento,
} from '../models/movimiento.model';

// Costa Rica no usa horario de verano: siempre UTC-6.
const DESFASE_COSTA_RICA = '-06:00';

const redondear = (valor: number) => Math.round(valor * 1000) / 1000;

const primero = <T>(valor: T | T[] | null | undefined): T | null =>
  Array.isArray(valor) ? (valor[0] ?? null) : (valor ?? null);

export const MovimientoService = {
  /**
   * Convierte el rango de fechas del filtro (días de Costa Rica) en límites ISO:
   * desde 00:00 del primer día (inclusive) hasta 00:00 del día siguiente al último (exclusivo).
   */
  calcularRangoFechas(desde?: string, hasta?: string): { fechaInicio?: string; fechaFin?: string } {
    const rango: { fechaInicio?: string; fechaFin?: string } = {};

    if (desde) {
      rango.fechaInicio = `${desde}T00:00:00${DESFASE_COSTA_RICA}`;
    }

    if (hasta) {
      const [anio, mes, dia] = hasta.split('-').map(Number);
      const siguiente = new Date(Date.UTC(anio, mes - 1, dia + 1)).toISOString().slice(0, 10);
      rango.fechaFin = `${siguiente}T00:00:00${DESFASE_COSTA_RICA}`;
    }

    return rango;
  },

  /**
   * Describe de dónde viene el movimiento según la referencia que tenga.
   */
  describirOrigen(fila: MovimientoRaw): string | null {
    if (fila.id_perdida) return `Pérdida #${fila.id_perdida}`;
    if (fila.id_produccion) return `Producción #${fila.id_produccion}`;
    if (fila.id_devolucion) return `Devolución #${fila.id_devolucion}`;
    if (fila.id_lote) return `Lote #${fila.id_lote}`;
    return null;
  },

  /**
   * Convierte una fila de la base en un movimiento listo para mostrar.
   */
  mapearMovimiento(fila: MovimientoRaw): MovimientoReporte {
    const producto = primero(fila.producto);
    const usuario = primero(fila.usuario);

    const stockAnterior = Number(fila.stock_anterior);
    const stockNuevo = Number(fila.stock_nuevo);
    const variacion = redondear(stockNuevo - stockAnterior);

    let direccion: DireccionMovimiento = 'SIN_CAMBIO';
    if (variacion > 0) direccion = 'ENTRADA';
    if (variacion < 0) direccion = 'SALIDA';

    const nombreUsuario = usuario
      ? [usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || usuario.nombre_usuario
      : `Usuario #${fila.id_usuario}`;

    return {
      id_movimiento: fila.id_movimiento,
      fecha: fila.fecha,
      tipo_movimiento: fila.tipo_movimiento,
      id_producto: fila.id_producto,
      nombre_producto: producto?.nombre ?? `Producto #${fila.id_producto}`,
      unidad_medida: producto?.unidad_medida ?? '',
      cantidad: Number(fila.cantidad),
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      variacion,
      direccion,
      usuario: nombreUsuario,
      origen: this.describirOrigen(fila),
      observaciones: fila.observaciones,
    };
  },

  /**
   * Calcula el resumen del reporte. Los totales por producto se calculan por separado
   * porque cada producto tiene su propia unidad de medida (no se pueden sumar entre sí).
   */
  calcularResumen(movimientos: MovimientoReporte[], totalEnBase: number): ResumenMovimientos {
    const porTipo = new Map<string, number>();
    const porProducto = new Map<number, ResumenProductoMovimiento>();

    for (const movimiento of movimientos) {
      porTipo.set(movimiento.tipo_movimiento, (porTipo.get(movimiento.tipo_movimiento) ?? 0) + 1);

      const acumulado = porProducto.get(movimiento.id_producto) ?? {
        id_producto: movimiento.id_producto,
        nombre_producto: movimiento.nombre_producto,
        unidad_medida: movimiento.unidad_medida,
        entradas: 0,
        salidas: 0,
        neto: 0,
      };

      if (movimiento.variacion > 0) acumulado.entradas = redondear(acumulado.entradas + movimiento.variacion);
      if (movimiento.variacion < 0) acumulado.salidas = redondear(acumulado.salidas - movimiento.variacion);
      acumulado.neto = redondear(acumulado.entradas - acumulado.salidas);

      porProducto.set(movimiento.id_producto, acumulado);
    }

    return {
      total_movimientos: movimientos.length,
      total_entradas: movimientos.filter((m) => m.direccion === 'ENTRADA').length,
      total_salidas: movimientos.filter((m) => m.direccion === 'SALIDA').length,
      productos_afectados: porProducto.size,
      por_tipo: [...porTipo.entries()]
        .map(([tipo_movimiento, total_movimientos]) => ({ tipo_movimiento, total_movimientos }))
        .sort((a, b) => b.total_movimientos - a.total_movimientos),
      por_producto: [...porProducto.values()].sort((a, b) =>
        a.nombre_producto.localeCompare(b.nombre_producto, 'es')
      ),
      truncado: totalEnBase > movimientos.length,
    };
  },

  /**
   * RF-08: genera el reporte de movimientos de inventario según los filtros.
   */
  async generarReporte(filtros: ConsultaMovimientosDto): Promise<RespuestaReporteMovimientos> {
    const rango = this.calcularRangoFechas(filtros.desde, filtros.hasta);

    const [{ filas, total }, tipos_disponibles] = await Promise.all([
      MovimientoRepository.listar({
        ...rango,
        id_producto: filtros.id_producto,
        tipo: filtros.tipo,
        limite: filtros.limite,
      }),
      MovimientoRepository.obtenerTipos(),
    ]);

    const movimientos = filas.map((fila) => this.mapearMovimiento(fila));

    return {
      resumen: this.calcularResumen(movimientos, total),
      movimientos,
      tipos_disponibles,
    };
  },
};
