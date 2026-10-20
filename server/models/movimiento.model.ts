// RF-08: Reporte de movimientos de inventario (tabla movimiento_inventario).

export type DireccionMovimiento = 'ENTRADA' | 'SALIDA' | 'SIN_CAMBIO';

export interface MovimientoReporte {
  id_movimiento: number;
  fecha: string; // ISO (timestamptz)
  tipo_movimiento: string;
  id_producto: number;
  nombre_producto: string;
  unidad_medida: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  variacion: number; // stock_nuevo - stock_anterior
  direccion: DireccionMovimiento;
  usuario: string;
  origen: string | null; // Ej. "Pérdida #34"
  observaciones: string | null;
}

export interface ResumenTipoMovimiento {
  tipo_movimiento: string;
  total_movimientos: number;
}

export interface ResumenProductoMovimiento {
  id_producto: number;
  nombre_producto: string;
  unidad_medida: string;
  entradas: number;
  salidas: number;
  neto: number;
}

export interface ResumenMovimientos {
  total_movimientos: number;
  total_entradas: number; // cantidad de movimientos que aumentan el stock
  total_salidas: number; // cantidad de movimientos que disminuyen el stock
  productos_afectados: number;
  por_tipo: ResumenTipoMovimiento[];
  por_producto: ResumenProductoMovimiento[];
  truncado: boolean; // true si hay más movimientos que el límite consultado
}

export interface RespuestaReporteMovimientos {
  resumen: ResumenMovimientos;
  movimientos: MovimientoReporte[];
  tipos_disponibles: string[];
}
